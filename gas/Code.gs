/**
 * @OnlyCurrentDoc
 */

function doGet(e) {
  const params = (e && e.parameter) || {};
  try {
    let data;
    if (!params.action || params.action === 'data') {
      data = getPublicData();
    } else if (params.action === 'grade') {
      data = gradeQuiz({
        courseId: params.courseId,
        answers: JSON.parse(params.answers || '[]')
      });
    } else {
      throw new Error('Action tidak dikenal. Gunakan data atau grade.');
    }
    return apiResponse_({ ok: true, data: data }, params.callback);
  } catch (error) {
    return apiResponse_({ ok: false, error: error.message || String(error) }, params.callback);
  }
}

function apiResponse_(payload, callback) {
  const json = JSON.stringify(payload);
  const validCallback = typeof callback === 'string' &&
    /^[A-Za-z_$][0-9A-Za-z_$]*(\.[A-Za-z_$][0-9A-Za-z_$]*)*$/.test(callback);

  if (validCallback) {
    return ContentService.createTextOutput(callback + '(' + json + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}

function getPublicData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const courses = readSheet_(ss, 'Courses')
    .filter(row => isVisible_(row.visible))
    .map(row => ({
      id: row.course_id,
      category: row.category,
      title: row.title,
      description: row.description,
      date: row.period,
      speaker: row.speaker || '',
      duration: row.duration,
      level: row.level,
      passingScore: Number(row.passing_score),
      topics: String(row.topics || '').split('|').filter(Boolean),
      banner: row.banner || '',
      quizEnabled: isActive_(row.active)
    }));

  const activeCourseIds = new Set(courses.filter(course => course.quizEnabled).map(course => course.id));
  const questions = readSheet_(ss, 'Questions')
    .filter(row => isActive_(row.active) && activeCourseIds.has(row.course_id))
    .sort((a, b) => Number(a.order) - Number(b.order))
    .map(row => ({
      courseId: row.course_id,
      id: row.question_id,
      prompt: row.question,
      options: [row.option_a, row.option_b, row.option_c, row.option_d]
    }));

  return { courses, questions };
}

function gradeQuiz(payload) {
  if (!payload || !payload.courseId || !Array.isArray(payload.answers)) {
    throw new Error('Data jawaban tidak valid.');
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const course = readSheet_(ss, 'Courses').find(row =>
    row.course_id === payload.courseId && isVisible_(row.visible) && isActive_(row.active)
  );
  if (!course) throw new Error('Course tidak ditemukan atau kuis belum diaktifkan.');

  const questions = readSheet_(ss, 'Questions')
    .filter(row => row.course_id === payload.courseId && isActive_(row.active));
  if (!questions.length || payload.answers.length !== questions.length) {
    throw new Error('Jumlah jawaban tidak sesuai dengan jumlah soal.');
  }

  const answerMap = new Map(payload.answers.map(item => [
    String(item.questionId), String(item.option || '').toUpperCase()
  ]));
  if (answerMap.size !== questions.length || questions.some(q => !answerMap.has(q.question_id))) {
    throw new Error('Ada jawaban yang terduplikasi atau tidak lengkap.');
  }

  const correct = questions.reduce((total, question) =>
    total + (answerMap.get(question.question_id) === String(question.answer_key).toUpperCase() ? 1 : 0), 0
  );
  const score = Math.round(correct / questions.length * 100);
  const passingScore = Number(course.passing_score);
  return { score, passingScore, passed: score >= passingScore };
}

function readSheet_(ss, sheetName) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error('Tab "' + sheetName + '" tidak ditemukan.');

  const values = sheet.getDataRange().getDisplayValues();
  if (values.length < 2) return [];
  const headers = values[0].map(value => String(value).trim().toLowerCase());

  return values.slice(1)
    .filter(row => row.some(cell => cell !== ''))
    .map(row => {
      const item = {};
      headers.forEach((header, index) => { item[header] = String(row[index] || '').trim(); });
      return item;
    });
}

function isActive_(value) {
  return ['TRUE', '1', 'YES', 'YA', 'AKTIF'].includes(String(value).trim().toUpperCase());
}

function isVisible_(value) {
  const normalized = String(value == null ? '' : value).trim();
  return normalized === '' || isActive_(normalized);
}
