(() => {
  let programs = window.BERRYCERT_PROGRAMS || [];
  const API_URL = window.BERRYCERT_API_URL || "";
  const useApi = Boolean(API_URL);
  const app = document.querySelector("#app");
  const STORAGE_KEY = "berrycert.completions.v1";
  const PROFILE_KEY = "berrycert.profile.v1";
  let route = { page: "home" };
  let quiz = null;

  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const imageUrl = (value) => {
    const url = String(value || "").trim();
    const driveId = url.match(/(?:\/file\/d\/|[?&]id=)([-\w]+)/);
    return driveId && /drive\.google\.com/.test(url)
      ? `https://drive.google.com/thumbnail?id=${driveId[1]}&sz=w1600`
      : url;
  };
  const getProgram = (id) => programs.find((item) => item.id === id);
  const getCompletions = () => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch { return {}; } };
  const getProfile = () => { try { return JSON.parse(localStorage.getItem(PROFILE_KEY) || "{}"); } catch { return {}; } };
  const saveCompletion = (id, value) => { const all = getCompletions(); all[id] = value; localStorage.setItem(STORAGE_KEY, JSON.stringify(all)); };
  const completionFor = (id) => getCompletions()[id];
  const go = (page, id) => { route = { page, id }; window.scrollTo(0, 0); render(); };

  function callApi(action, params = {}) {
    return new Promise((resolve, reject) => {
      const callbackName = `berrycert_jsonp_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
      const script = document.createElement("script");
      const url = new URL(API_URL);
      let timer;
      const cleanup = () => {
        window.clearTimeout(timer);
        delete window[callbackName];
        script.remove();
      };
      window[callbackName] = (response) => {
        cleanup();
        if (!response?.ok) reject(new Error(response?.error || "Permintaan ke Apps Script gagal."));
        else resolve(response.data);
      };
      script.onerror = () => { cleanup(); reject(new Error("Tidak bisa menghubungi Google Apps Script.")); };
      timer = window.setTimeout(() => { cleanup(); reject(new Error("Apps Script tidak merespons. Coba lagi.")); }, 20000);
      url.searchParams.set("action", action);
      url.searchParams.set("callback", callbackName);
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, typeof value === "string" ? value : JSON.stringify(value));
      });
      script.src = url.toString();
      document.head.appendChild(script);
    });
  }

  function card(program, index) {
    const banner = imageUrl(program.banner);
    const previewOnly = program.quizEnabled === false;
    return `<article class="program-card ${previewOnly ? "preview-only" : ""}" data-open="${escapeHtml(program.id)}" tabindex="0" role="button" aria-label="Lihat detail ${escapeHtml(program.title)}">
      <div class="card-art ${program.accent} ${banner ? "has-banner" : ""}">${banner ? `<img class="card-banner" src="${escapeHtml(banner)}" alt="" loading="lazy">` : `<span class="card-symbol">${escapeHtml(program.icon)}</span>`}<span class="card-index">0${index + 1} / 0${programs.length}</span><span class="card-type">${escapeHtml(program.category)}</span>${previewOnly ? `<span class="preview-badge">SEGERA TERSEDIA</span>` : ""}</div>
      <div class="card-body"><div class="card-meta"><span>◷ &nbsp;${escapeHtml(program.duration)}</span><span>✦ &nbsp;${escapeHtml(program.level)}</span></div><h3>${escapeHtml(program.title)}</h3><p>${escapeHtml(program.description.length > 80 ? program.description.slice(0, 80) + "…" : program.description)}</p><div class="card-bottom"><span>${previewOnly ? "Lihat detail" : completionFor(program.id) ? "Lihat sertifikat" : "Lihat program"}</span><span>↗</span></div></div>
    </article>`;
  }

  function home() {
    const profile = getProfile();
    const passed = programs.filter((p) => completionFor(p.id));
    app.innerHTML = `<section class="hero"><div class="eyebrow">BERRY CERTIFICATE</div><form class="profile-form" id="profile-form"><div class="profile-entry${profile.name ? " is-saved" : ""}"><input id="profile-name" name="fullName" autocomplete="name" maxlength="100" placeholder="Masukkan nama lengkap" value="${escapeHtml(profile.name || "")}" required${profile.name ? " disabled" : ""} />${profile.name ? `<button class="clear-name" type="button" data-clear-profile aria-label="Hapus nama" title="Hapus nama"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button>` : `<button class="primary" type="submit">Simpan</button>`}</div></form>${passed.length ? `<div class="earned-list"><h2>Sertifikat Anda</h2>${passed.map((p) => { const r = completionFor(p.id); return `<button class="earned-item" data-earned="${escapeHtml(p.id)}"><span><strong>${escapeHtml(p.title)}</strong><small>Nilai ${r.score}/100 · ${escapeHtml(r.name)}</small></span><span>↗</span></button>`; }).join("")}</div>` : ""}</section>
      <section class="section" id="program"><div class="section-head"><div><div class="eyebrow">TERSEDIA</div></div><p>${programs.length} course</p></div><div class="program-grid">${programs.map(card).join("")}</div></section>`;
    const form = document.querySelector("#profile-form");
    form.onsubmit = (event) => { event.preventDefault(); const name = form.fullName.value.trim().replace(/\s+/g, " "); if (name.length < 3) return; localStorage.setItem(PROFILE_KEY, JSON.stringify({ name })); home(); };
  }

  function detail() {
    const p = getProgram(route.id); if (!p) return go("home");
    const done = completionFor(p.id);
    const banner = imageUrl(p.banner);
    const topics = Array.isArray(p.topics) ? p.topics : [];
    const quizEnabled = p.quizEnabled !== false;
    app.innerHTML = `<div class="page-wrap"><div class="detail-grid"><section class="detail-main ${quizEnabled ? "" : "preview-only"}"><div class="eyebrow">${escapeHtml(p.category)} &nbsp;·&nbsp; ${escapeHtml(p.level)}</div><h1>${escapeHtml(p.title)}</h1><div class="detail-image ${p.accent}${banner ? " has-banner" : ""}">${banner ? `<img src="${escapeHtml(banner)}" alt="Banner ${escapeHtml(p.title)}">` : `<span class="card-symbol">${escapeHtml(p.icon)}</span>`}</div>${p.description ? `<p class="lead">${escapeHtml(p.description)}</p>` : ""}${topics.length ? `<ul class="topic-list">${topics.map((topic) => `<li>${escapeHtml(topic)}</li>`).join("")}</ul>` : ""}</section><aside class="detail-aside"><div class="aside-row"><span>Waktu</span><strong>${escapeHtml(p.duration)}</strong></div><div class="aside-row"><span>Jadwal</span><strong>${escapeHtml(p.date)}</strong></div>${p.speaker ? `<div class="aside-row"><span>Speaker</span><strong>${escapeHtml(p.speaker)}</strong></div>` : ""}${quizEnabled ? `<div class="aside-row"><span>Nilai lulus</span><strong>${p.passingScore} poin</strong></div>` : ""}${quizEnabled ? `<button class="primary" data-start="${escapeHtml(p.id)}">${done ? "Lihat sertifikat" : "Mulai course"} &nbsp;↗</button>` : `<button class="primary" disabled>Belum tersedia</button>`}</aside></div></div>`;
  }

  function clearProfileModal() {
    const total = Object.keys(getCompletions()).length;
    const modal = document.createElement("div"); modal.className = "name-modal";
    modal.innerHTML = `<div class="modal-card" role="alertdialog" aria-modal="true" aria-labelledby="clear-title"><div class="eyebrow">HAPUS DATA</div><h2 id="clear-title">Hapus nama?</h2><p>Nama${total ? ` dan ${total} sertifikat` : ""} yang tersimpan di browser ini akan dihapus permanen dan tidak bisa dikembalikan. ${total ? "Unduh sertifikatmu lebih dulu jika masih dibutuhkan." : ""}</p><div class="modal-actions"><button type="button" class="secondary" data-cancel>Batalkan</button><button type="button" class="primary danger" data-confirm>Ya, hapus</button></div></div>`;
    document.body.append(modal); modal.querySelector("[data-cancel]").focus();
    const close = () => { modal.remove(); document.removeEventListener("keydown", onKey); };
    const onKey = (event) => { if (event.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    modal.onclick = (event) => { if (event.target === modal) close(); };
    modal.querySelector("[data-cancel]").onclick = close;
    modal.querySelector("[data-confirm]").onclick = () => { localStorage.removeItem(PROFILE_KEY); localStorage.removeItem(STORAGE_KEY); close(); go("home"); };
  }

  function nameModal(p) {
    const old = completionFor(p.id);
    const profile = getProfile();
    const modal = document.createElement("div"); modal.className = "name-modal";
    modal.innerHTML = `<form class="modal-card" id="name-form"><div class="eyebrow">SEBELUM MEMULAI</div><p>Nama ini akan dicantumkan pada sertifikat. Gunakan nama lengkap sesuai identitasmu.</p><input id="full-name" name="fullName" autocomplete="name" maxlength="100" placeholder="Masukkan nama lengkap" value="${escapeHtml(old?.name || profile.name || "")}" required /><div class="modal-error" id="name-error"></div><div class="modal-actions"><button type="button" class="secondary" data-cancel>Batalkan</button><button type="submit" class="primary">Lanjut ↗</button></div></form>`;
    document.body.append(modal); modal.querySelector("input").focus();
    modal.querySelector("[data-cancel]").onclick = () => modal.remove();
    modal.querySelector("form").onsubmit = (event) => { event.preventDefault(); const name = modal.querySelector("input").value.trim().replace(/\s+/g, " "); if (name.length < 3) { modal.querySelector("#name-error").textContent = "Masukkan nama lengkap (minimal 3 karakter)."; return; } localStorage.setItem(PROFILE_KEY, JSON.stringify({ name })); modal.remove(); startQuiz(p, name); };
  }

  function startQuiz(p, name) { quiz = { programId: p.id, name, index: 0, answers: Array(p.questions.length).fill(null) }; go("quiz", p.id); }

  function quizPage() {
    const p = getProgram(route.id); if (!p || !quiz) return go("home");
    const q = p.questions[quiz.index]; const chosen = quiz.answers[quiz.index];
    app.innerHTML = `<div class="page-wrap"><button class="back-link" data-detail="${escapeHtml(p.id)}">← &nbsp;Keluar dari kuis</button><div class="quiz-top"><span>${escapeHtml(p.title)}</span><span>${quiz.index + 1} dari ${p.questions.length}</span></div><div class="progress"><span style="width:${((quiz.index + 1) / p.questions.length) * 100}%"></span></div><section class="quiz-box"><div class="question-count">PERTANYAAN 0${quiz.index + 1}</div><h1>Uji pemahamanmu.</h1><p class="quiz-sub">Pilih satu jawaban yang paling tepat.</p><div class="question">${escapeHtml(q.prompt)}</div><div class="options">${q.options.map((option, i) => `<button class="option ${chosen === i ? "selected" : ""}" data-answer="${i}"><span class="option-letter">${String.fromCharCode(65 + i)}</span><span>${escapeHtml(option)}</span></button>`).join("")}</div><div class="quiz-actions"><button class="text-button" data-prev ${quiz.index === 0 ? "disabled" : ""}>← Sebelumnya</button><button class="primary" data-next ${chosen === null ? "disabled" : ""}>${quiz.index === p.questions.length - 1 ? "Kirim jawaban" : "Pertanyaan berikutnya"} &nbsp;→</button></div></section></div>`;
  }

  function submitQuiz(p) {
    if (useApi) {
      const answers = quiz.answers.map((answer, index) => ({
        questionId: p.questions[index].id,
        option: String.fromCharCode(65 + answer)
      }));
      app.innerHTML = `<div class="page-wrap"><section class="result"><div class="eyebrow">MEMERIKSA JAWABAN</div><h1>Sebentar ya…</h1><p>Jawabanmu sedang diperiksa.</p></section></div>`;
      callApi("grade", { courseId: p.id, answers })
        .then((graded) => finishQuiz(p, graded))
        .catch((error) => {
          app.innerHTML = `<div class="page-wrap"><section class="result"><div class="eyebrow">KUIS BELUM TERKIRIM</div><h1>Ada kendala.</h1><p>${escapeHtml(error?.message || "Gagal memeriksa jawaban. Silakan coba lagi.")}</p><button class="primary" data-resume-quiz>← Kembali ke kuis</button></section></div>`;
        })
      return;
    }

    const correct = quiz.answers.reduce((total, answer, i) => total + (answer === p.questions[i].answer ? 1 : 0), 0);
    const score = Math.round((correct / p.questions.length) * 100);
    finishQuiz(p, { score, passed: score >= p.passingScore });
  }

  function finishQuiz(p, graded) {
    const result = { name: quiz.name, score: Number(graded.score), passed: Boolean(graded.passed), completedAt: new Date().toISOString() };
    if (result.passed) saveCompletion(p.id, result);
    quiz = null; route = { page: "result", id: p.id, result }; window.scrollTo(0, 0); render();
  }

  function resultPage() {
    const p = getProgram(route.id); const r = route.result; if (!p || !r) return go("home");
    app.innerHTML = `<div class="page-wrap"><section class="result"><div class="result-icon">${r.passed ? "✓" : "↻"}</div><div class="eyebrow">${r.passed ? "PENCAPAIAN TERCATAT" : "MASIH ADA KESEMPATAN"}</div><h1>${r.passed ? "Kamu berhasil!" : "Coba sekali lagi."}</h1><p>${r.passed ? `Selamat, ${escapeHtml(r.name)}. Kamu telah menyelesaikan ${escapeHtml(p.title)} dan memenuhi nilai kelulusan.` : `Nilaimu belum mencapai ${p.passingScore}. Pelajari kembali materinya, lalu coba kuis ini lagi. Jawabanmu tidak disimpan.`}</p><span class="score-pill">Nilai kamu &nbsp;<strong>${r.score}/100</strong></span><span class="score-pill">Nilai lulus &nbsp;<strong>${p.passingScore}/100</strong></span><div><button class="primary" data-result-action="${r.passed ? "certificate" : "retry"}">${r.passed ? "Lihat sertifikat" : "Ulangi kuis"} &nbsp;↗</button><button class="secondary" data-home>Ke beranda</button></div></section></div>`;
  }

  const certImages = new Map();
  const certImageUrl = (value) => {
    const url = String(value || "").trim();
    const driveId = url.match(/(?:\/file\/d\/|[?&]id=)([-\w]+)/);
    return driveId && /drive\.google\.com/.test(url) ? `https://lh3.googleusercontent.com/d/${driveId[1]}=w600` : url;
  };
  function loadCertImage(value) {
    const url = certImageUrl(value); if (!url) return Promise.resolve(null);
    if (!certImages.has(url)) certImages.set(url, fetch(url).then((res) => { if (!res.ok) throw new Error(res.status); return res.blob(); }).then((blob) => new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(blob); })).catch(() => { certImages.delete(url); return null; }));
    return certImages.get(url);
  }

  function certificateData(image) {
    const p = getProgram(route.id); const r = completionFor(route.id); if (!p || !r) return null;
    const date = p.date || new Date(r.completedAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
    return { p, data: { name: r.name, program: p.title, date, score: r.score, speaker: p.speaker, description: p.description, image } };
  }

  function certificatePage() {
    const c = certificateData(null); if (!c) return go("home");
    const shownRoute = route;
    loadCertImage(c.p.banner).then((image) => { const box = document.querySelector("#certificate"); if (image && box && route === shownRoute) box.innerHTML = window.berrycertCertificate.svg(certificateData(image).data); });
    app.innerHTML = `<div class="page-wrap"><button class="back-link" data-detail="${escapeHtml(c.p.id)}">← &nbsp;Materi</button><div class="certificate" id="certificate">${window.berrycertCertificate.svg(c.data)}</div><div class="cert-actions"><button class="primary" data-download-image>Unduh gambar PNG ↗</button><button class="secondary" data-print>Unduh / cetak PDF</button></div><p class="cert-note">Sertifikat ini tersimpan di browser perangkat ini. Mohon segera diunduh.</p></div>`;
  }

  function render() {
    const header = document.querySelector(".topbar");
    const headerAction = document.querySelector("#header-action");
    const onDetail = route.page === "detail";
    if (header) header.classList.toggle("has-action", onDetail);
    if (headerAction) {
      headerAction.hidden = !onDetail;
      headerAction.textContent = onDetail ? "Materi" : "";
      headerAction.setAttribute("aria-label", "Kembali ke halaman materi");
    }
    if (route.page === "home") home();
    if (route.page === "detail") detail();
    if (route.page === "quiz") quizPage();
    if (route.page === "result") resultPage();
    if (route.page === "certificate") certificatePage();
  }

  async function downloadPng() {
    const base = certificateData(null); if (!base) return;
    const c = certificateData(await loadCertImage(base.p.banner));
    const { svg, width, height } = window.berrycertCertificate; const scale = 2;
    const image = new Image(); const url = URL.createObjectURL(new Blob([svg(c.data)], { type: "image/svg+xml;charset=utf-8" }));
    image.onload = () => { const canvas = document.createElement("canvas"); canvas.width = width * scale; canvas.height = height * scale; canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height); URL.revokeObjectURL(url); canvas.toBlob((blob) => { const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `sertifikat-${c.p.id}.png`; link.click(); URL.revokeObjectURL(link.href); }, "image/png"); };
    image.onerror = () => { URL.revokeObjectURL(url); alert("Gambar sertifikat belum dapat dibuat. Coba gunakan fitur cetak PDF."); }; image.src = url;
  }

  document.addEventListener("click", (event) => {
    const target = event.target.closest("[data-home], [data-open], [data-scroll-program], [data-detail], [data-start], [data-answer], [data-next], [data-prev], [data-result-action], [data-my-cert], [data-download-image], [data-print], [data-earned], [data-resume-quiz], [data-reload-programs], [data-clear-profile]");
    if (!target) return;
    if (target.hasAttribute("data-clear-profile")) { clearProfileModal(); return; }
    if (target.hasAttribute("data-home")) { go("home"); return; }
    if (target.dataset.open) { go("detail", target.dataset.open); return; }
    if (target.dataset.earned) { go("certificate", target.dataset.earned); return; }
    if (target.hasAttribute("data-resume-quiz")) { quizPage(); return; }
    if (target.hasAttribute("data-reload-programs")) { loadPrograms(); return; }
    if (target.hasAttribute("data-scroll-program")) { document.querySelector("#program")?.scrollIntoView({ behavior: "smooth" }); return; }
    if (target.dataset.detail) { go("detail", target.dataset.detail); return; }
    if (target.dataset.start) { const p = getProgram(target.dataset.start); const done = completionFor(p.id); if (done) { go("certificate", p.id); return; } const profile = getProfile(); if (profile.name) { startQuiz(p, profile.name); } else { nameModal(p); } return; }
    if (target.hasAttribute("data-my-cert")) { const completed = Object.keys(getCompletions()); if (!completed.length) { document.querySelector("#program")?.scrollIntoView({ behavior: "smooth" }); return; } go("certificate", completed[0]); return; }
    if (target.dataset.answer !== undefined) { quiz.answers[quiz.index] = Number(target.dataset.answer); quizPage(); return; }
    if (target.hasAttribute("data-prev")) { if (quiz.index > 0) quiz.index--; quizPage(); return; }
    if (target.hasAttribute("data-next")) { const p = getProgram(route.id); if (quiz.answers[quiz.index] === null) return; if (quiz.index < p.questions.length - 1) { quiz.index++; quizPage(); } else submitQuiz(p); return; }
    if (target.dataset.resultAction === "certificate") { go("certificate", route.id); return; }
    if (target.dataset.resultAction === "retry") { const p = getProgram(route.id); startQuiz(p, route.result.name); return; }
    if (target.hasAttribute("data-download-image")) { downloadPng(); return; }
    if (target.hasAttribute("data-print")) { window.print(); return; }
  });
  document.addEventListener("keydown", (event) => { if ((event.key === "Enter" || event.key === " ") && event.target.matches(".program-card")) { event.preventDefault(); go("detail", event.target.dataset.open); } });
  function loadPrograms() {
    if (!useApi) { render(); return; }
    app.innerHTML = `<div class="page-wrap"><section class="result"><div class="eyebrow">BERRY CERTIFICATE</div><h1>Memuat data…</h1></section></div>`;
    callApi("data")
      .then((data) => {
        const accents = ["peach", "lilac", "mint"];
        const icons = ["✳", "↗", "◈"];
        programs = (data.courses || []).map((course, index) => ({
          ...course,
          accent: accents[index % accents.length],
          icon: icons[index % icons.length],
          banner: course.banner || "",
          quizEnabled: course.quizEnabled !== false,
          questions: (data.questions || []).filter((question) => question.courseId === course.id)
        }));
        render();
      })
      .catch((error) => {
        app.innerHTML = `<div class="page-wrap"><section class="result"><div class="eyebrow">KONEKSI BERMASALAH</div><h1>Program belum bisa dimuat.</h1><p>${escapeHtml(error?.message || "Periksa koneksi Apps Script dan nama tab spreadsheet.")}</p><button class="primary" data-reload-programs>Coba lagi</button></section></div>`;
      });
  }

  loadPrograms();
})();
