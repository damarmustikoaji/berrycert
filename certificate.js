(() => {
  const TITLE = "'Trajan Pro',Trajan,Cinzel,Optima,'Palatino Linotype',Palatino,'Book Antiqua',Georgia,serif";
  const SCRIPT = "'Snell Roundhand','Apple Chancery','Monotype Corsiva','Lucida Calligraphy','Segoe Script',Georgia,serif";
  const RING_TEXT = "LinKA Universe Certificate • ";
  const W = 1600;
  const H = 1131;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const fit = (text, max, width, min) => Math.max(min, Math.min(max, Math.floor(width / (Math.max(text.length, 1) * 0.54))));
  const wrap = (text, limit) => {
    const words = text.split(/\s+/).filter(Boolean);
    const lines = [""];
    words.forEach((word) => {
      const last = lines.length - 1;
      if (!lines[last] || (lines[last] + " " + word).length <= limit || last === 1) lines[last] = (lines[last] + " " + word).trim();
      else lines.push(word);
    });
    return lines;
  };

  const spark = (x, y, s) => `<path d="M${x} ${y - s}Q${x} ${y} ${x + s} ${y}Q${x} ${y} ${x} ${y + s}Q${x} ${y} ${x - s} ${y}Q${x} ${y} ${x} ${y - s}Z" fill="#fff"/>`;

  function seal(cx, cy, r, image) {
    const rosette = Array.from({ length: 18 }, (_, i) => `<ellipse rx="${r - 12}" ry="29" transform="rotate(${i * 10})"/>`).join("");
    const rosette2 = Array.from({ length: 18 }, (_, i) => `<ellipse rx="${r - 36}" ry="19" transform="rotate(${i * 10 + 5})"/>`).join("");
    return `<g transform="translate(${cx} ${cy})">
      <circle cy="6" r="${r}" fill="#2a3a2a" opacity=".16" filter="url(#bcBlur)"/>
      <circle r="${r}" fill="url(#bcSealA)"/>
      <circle r="${r}" fill="url(#bcSealB)" opacity=".72"/>
      <g clip-path="url(#bcSealClip)">
        <g fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="1.2">${rosette}</g>
        <g fill="none" stroke="#6b78e0" stroke-opacity=".32" stroke-width="1">${rosette2}</g>
        <g transform="rotate(35)"><rect x="-58" y="-140" width="34" height="280" fill="url(#bcShine)"/><rect x="2" y="-140" width="12" height="280" fill="url(#bcShine)" opacity=".8"/><rect x="34" y="-140" width="6" height="280" fill="url(#bcShine)" opacity=".6"/></g>
        <circle r="${r}" fill="url(#bcGloss)"/>
      </g>
      <circle r="${r - 2}" fill="none" stroke="url(#bcRing)" stroke-width="4"/>
      <circle r="${r - 12}" fill="none" stroke="#fff" stroke-opacity=".85" stroke-width="1.4"/>
      <path id="bcRingPath" d="M-${r - 18} 0A${r - 18} ${r - 18} 0 1 1 ${r - 18} 0A${r - 18} ${r - 18} 0 1 1 -${r - 18} 0" fill="none"/>
      <text font-family="Arial,Helvetica,sans-serif" font-size="13" font-weight="700" fill="#2f3f66" fill-opacity=".9" textLength="${Math.round(2 * Math.PI * (r - 18) - 4)}" lengthAdjust="spacing"><textPath href="#bcRingPath" xlink:href="#bcRingPath">${esc(RING_TEXT)}${esc(RING_TEXT)}</textPath></text>
      <circle r="${r - 34}" fill="none" stroke="url(#bcRing)" stroke-width="2.5"/>
      ${image ? `<image href="${image}" xlink:href="${image}" x="-${Math.round((r - 34) * 0.69)}" y="-${Math.round((r - 34) * 0.69)}" width="${Math.round((r - 34) * 1.38)}" height="${Math.round((r - 34) * 1.38)}" preserveAspectRatio="xMidYMid meet"/>` : ""}
      ${spark(r * 0.98, -r * 0.86, 15)}${spark(-r * 1.06, r * 0.56, 9)}${spark(r * 0.9, r * 0.82, 7)}
    </g>`;
  }


  function qrCode(text, x, y, size) {
    if (typeof qrcode !== "function" || !text) return "";
    qrcode.stringToBytes = qrcode.stringToBytesFuncs["UTF-8"];
    const qr = qrcode(0, "L");
    qr.addData(text.length > 700 ? text.slice(0, 699) + "…" : text, "Byte");
    qr.make();
    const n = qr.getModuleCount(); const pad = 8; const m = (size - pad * 2) / n; let d = "";
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (!qr.isDark(r, c)) continue;
        let run = 1; while (c + run < n && qr.isDark(r, c + run)) run++;
        d += `M${(x + pad + c * m).toFixed(2)} ${(y + pad + r * m).toFixed(2)}h${(run * m).toFixed(2)}v${m.toFixed(2)}h-${(run * m).toFixed(2)}z`;
        c += run - 1;
      }
    }
    return `<rect x="${x}" y="${y}" width="${size}" height="${size}" fill="#fffefa" stroke="#1c241c" stroke-width="1.2"/><path d="${d}" fill="#1c241c" shape-rendering="crispEdges"/>`;
  }

  function frame() {
    const K = "#1c241c";
    const G = "#2f4a2b";
    const corner = `<rect x="40" y="40" width="94" height="94" fill="#fffefa"/>
    <g fill="none" stroke-linecap="square" stroke-linejoin="miter">
      <rect x="40" y="40" width="94" height="94" stroke="${K}" stroke-width="3"/>
      <rect x="53" y="53" width="68" height="68" stroke="${G}" stroke-width="1.8"/>
      <rect x="62" y="62" width="50" height="50" stroke="${G}" stroke-width="1.1"/>
      <path d="M134 26V134H26" stroke="${K}" stroke-width="3"/>
      <path d="M121 36V121H36" stroke="${G}" stroke-width="1.8"/>
      <path d="M112 45V112H45" stroke="${G}" stroke-width="1.1"/>
      <path d="M87 74L100 87L87 100L74 87Z" stroke="${G}" stroke-width="1.4"/>
    </g>
    <rect x="84.5" y="84.5" width="5" height="5" fill="${K}"/>`;
    return `<g>
  <rect x="40" y="40" width="${W - 80}" height="${H - 80}" fill="none" stroke="${K}" stroke-width="3"/>
  <rect x="53" y="53" width="${W - 106}" height="${H - 106}" fill="none" stroke="${G}" stroke-width="1.8"/>
  <rect x="62" y="62" width="${W - 124}" height="${H - 124}" fill="none" stroke="${G}" stroke-width="1.1" stroke-opacity=".8"/>
  <g>${corner}</g>
  <g transform="translate(${W} 0) scale(-1 1)">${corner}</g>
  <g transform="translate(0 ${H}) scale(1 -1)">${corner}</g>
  <g transform="translate(${W} ${H}) scale(-1 -1)">${corner}</g>
</g>`;
  }

  function certificateSvg({ name, program, date, score, speaker, description, image }) {
    const nm = String(name).trim();
    const nameSize = fit(nm, 92, 1000, 30);
    const speakerName = String(speaker || "").trim();
    const speakerSize = fit(speakerName, 24, 300, 16);
    const lines = wrap(String(program).trim(), 40).slice(0, 2);
    const courseSize = Math.min(...lines.map((l) => fit(l, 44, 1000, 26)));
    const courseY = lines.length > 1 ? 608 : 630;
    const scoreY = lines.length > 1 ? 608 + Math.round(courseSize * 1.2) + 62 : 704;
    const course = lines.map((l, i) => `<text x="800" y="${courseY + i * Math.round(courseSize * 1.2)}" text-anchor="middle" font-family="Georgia,'Times New Roman',serif" font-size="${courseSize}" fill="#262a25">${esc(l)}</text>`).join("");
    const circles = Array.from({ length: 22 }, (_, i) => `<circle cx="800" cy="580" r="${110 + i * 32}"/>`).join("");
    const waves = Array.from({ length: 36 }, (_, i) => `<ellipse cx="800" cy="580" rx="720" ry="230" transform="rotate(${i * 5} 800 580)"/>`).join("");
    const fr = frame();
    return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Certificate of completion for ${esc(nm)}">
  <defs>
    <linearGradient id="bcPaper" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fffefa"/><stop offset="1" stop-color="#f5f2e4"/></linearGradient>
    <linearGradient id="bcTitle" gradientUnits="userSpaceOnUse" x1="560" y1="0" x2="1040" y2="0"><stop offset="0" stop-color="#3d5a37"/><stop offset=".5" stop-color="#6c9560"/><stop offset="1" stop-color="#3d5a37"/></linearGradient>
    <linearGradient id="bcRule" gradientUnits="userSpaceOnUse" x1="380" y1="0" x2="1220" y2="0"><stop offset="0" stop-color="#abb69b" stop-opacity="0"/><stop offset=".2" stop-color="#abb69b"/><stop offset=".8" stop-color="#abb69b"/><stop offset="1" stop-color="#abb69b" stop-opacity="0"/></linearGradient>
    <linearGradient id="bcSealA" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8ff0ff"/><stop offset=".22" stop-color="#d5b3ff"/><stop offset=".45" stop-color="#ffb8e0"/><stop offset=".62" stop-color="#ffe9a0"/><stop offset=".8" stop-color="#a6ffd2"/><stop offset="1" stop-color="#8cb8ff"/></linearGradient>
    <linearGradient id="bcSealB" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd27a"/><stop offset=".3" stop-color="#7fe0ff"/><stop offset=".55" stop-color="#e4a0ff"/><stop offset=".8" stop-color="#8affc0"/><stop offset="1" stop-color="#ffe08a"/></linearGradient>
    <linearGradient id="bcRing" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff"/><stop offset=".35" stop-color="#e7c97a"/><stop offset=".65" stop-color="#fff"/><stop offset="1" stop-color="#c9a652"/></linearGradient>
    <linearGradient id="bcShine" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".75"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <radialGradient id="bcGloss" cx=".32" cy=".26" r=".7"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
    <clipPath id="bcSealClip"><circle r="108"/></clipPath>
    <clipPath id="bcFrame"><rect x="70" y="70" width="${W - 140}" height="${H - 140}"/></clipPath>
    <filter id="bcBlur" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="5"/></filter>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bcPaper)"/>
  <g clip-path="url(#bcFrame)" fill="none" stroke="#66875c" stroke-opacity=".05" stroke-width="1.2">${circles}${waves}</g>
  ${fr}
  <text x="808" y="256" text-anchor="middle" font-family="${TITLE}" font-size="88" font-weight="600" letter-spacing="16" fill="url(#bcTitle)">CERTIFICATE</text>
  <path d="M560 322H760M840 322H1040" stroke="#3d5a37" stroke-width="2"/>
  <path d="M800 306L816 322L800 338L784 322Z" fill="#3d5a37"/>
  <text x="800" y="392" text-anchor="middle" font-family="Georgia,'Times New Roman',serif" font-size="26" letter-spacing="1" fill="#777c6d">This is to certify that</text>
  <text x="800" y="482" text-anchor="middle" font-family="${SCRIPT}" font-size="${nameSize}" font-style="italic" fill="#1f3a2a">${esc(nm)}</text>
  <path d="M380 510H1220" stroke="url(#bcRule)" stroke-width="2"/>
  <text x="800" y="562" text-anchor="middle" font-family="Georgia,'Times New Roman',serif" font-size="26" letter-spacing="1" fill="#777c6d">has successfully completed the program</text>
  ${course}
  <text x="800" y="${scoreY}" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="17" letter-spacing="4" fill="#71776a">FINAL SCORE  ${esc(score)}</text>
  ${speakerName ? `<text x="420" y="784" text-anchor="middle" font-family="Georgia,'Times New Roman',serif" font-size="${speakerSize}" fill="#262a25">${esc(speakerName)}</text>` : ""}
  <path d="M270 800H570" stroke="#b9bdad" stroke-width="1.6"/>
  <text x="420" y="840" text-anchor="middle" font-family="Georgia,'Times New Roman',serif" font-size="24" fill="#262a25">${esc(date)}</text>
  <text x="420" y="872" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="15" letter-spacing="3" fill="#71776a">PROGRAM DATE</text>
  ${qrCode(String(description || "").trim(), 1100, 763, 160)}
  ${seal(800, 843, 104, image)}
</svg>`;
  }

  window.berrycertCertificate = { svg: certificateSvg, width: W, height: H };
})();
