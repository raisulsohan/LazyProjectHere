/* ───────────────────────── The film: Premiere Pro + After Effects ───────────────────────── */
(function () {
 function makeFilm(VERT) {
  const W = VERT ? 1080 : 1920, H = VERT ? 1350 : 1080, DUR = 20, FPS = 30;
  const BN = '"Inter","Segoe UI",system-ui,sans-serif', UI = '"Inter","Segoe UI",system-ui,sans-serif';
  const bnd = n => String(n);
  let ctx;

  // ── math ──
  const clamp = (v, a = 0, b = 1) => v < a ? a : v > b ? b : v;
  const lerp = (a, b, u) => a + (b - a) * u;
  const seg = (t, a, b) => clamp((t - a) / (b - a));
  const eo = u => 1 - Math.pow(1 - u, 3), eo5 = u => 1 - Math.pow(1 - u, 5), ei = u => u * u * u;
  const eio = u => u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
  const eback = u => { const c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(u - 1, 3) + c1 * Math.pow(u - 1, 2); };
  const lerpR = (a, b, u) => ({ x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), w: lerp(a.w, b.w, u), h: lerp(a.h, b.h, u) });
  const hex = c => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
  const rgba = (c, a) => { const [r, g, b] = Array.isArray(c) ? c : hex(c); return `rgba(${r | 0},${g | 0},${b | 0},${a})`; };
  const mixC = (ws) => { let r = 0, g = 0, b = 0, s = 0; for (const [c, w] of ws) { const h = hex(c); r += h[0] * w; g += h[1] * w; b += h[2] * w; s += w; } return [r / s, g / s, b / s]; };

  // ── colours ──
  const C = { purple: '#8c6cff', purple2: '#b9a5ff', green: '#2ee6a0', red: '#ff4d6a', blue: '#3d8bff', blue2: '#7fa8ff', mut: '#aaa6c6', white: '#ffffff' };

  // ── drawing helpers ──
  function rr(x, y, w, h, r) { r = Math.max(0, Math.min(r, w / 2, h / 2)); ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  const F = (sz, w = 600, fam = BN) => `${w} ${sz}px ${fam}`;
  function txt(s, x, y, sz, col, o = {}) {
    ctx.font = F(sz, o.w || 600, o.fam || BN); ctx.fillStyle = col; ctx.textAlign = o.al || 'left'; ctx.textBaseline = o.bl || 'alphabetic';
    ctx.fillText(s, x, y);
  }
  function tw(s, sz, w = 600, fam = BN) { ctx.font = F(sz, w, fam); return ctx.measureText(s).width; }
  function fitSz(s, maxW, sz, w = 600, fam = BN) { const m = tw(s, sz, w, fam); return m > maxW ? sz * maxW / m : sz; }
  function parts(ps, x, y, sz, w, fam, al = 'center') {
    ctx.font = F(sz, w, fam); const ws = ps.map(p => ctx.measureText(p[0]).width), tot = ws.reduce((a, b) => a + b, 0);
    let px = al === 'center' ? x - tot / 2 : al === 'right' ? x - tot : x;
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ps.forEach((p, i) => { ctx.fillStyle = p[1]; ctx.fillText(p[0], px, y); px += ws[i]; });
    return tot;
  }
  const partsW = (ps, sz, w, fam) => { ctx.font = F(sz, w, fam); return ps.reduce((a, p) => a + ctx.measureText(p[0]).width, 0); };
  function line(x1, y1, x2, y2, col, lw = 1.5) { ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); }
  function pill(x, y, label, sz, fg, bg, o = {}) {   // x = centre
    const pw = tw(label, sz, o.w || 700, o.fam || BN) + sz * 1.3, ph = sz * 1.75;
    ctx.fillStyle = bg; rr(x - pw / 2, y - ph / 2, pw, ph, ph / 2); ctx.fill();
    if (o.stroke) { ctx.strokeStyle = o.stroke; ctx.lineWidth = 2; ctx.stroke(); }
    txt(label, x, y + sz * .36, sz, fg, { w: o.w || 700, fam: o.fam || BN, al: 'center' });
    return pw;
  }

  // ── icons ──
  function folderIcon(x, y, s, c1 = '#ffd35c', c2 = '#e9a923') {
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = c2; rr(0, s * .06, s * .46, s * .3, s * .07); ctx.fill(); rr(0, s * .14, s, s * .7, s * .08); ctx.fill();
    const g = ctx.createLinearGradient(0, s * .26, 0, s * .84); g.addColorStop(0, c1); g.addColorStop(1, c2);
    ctx.fillStyle = g; rr(0, s * .26, s, s * .58, s * .08); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(s * .06, s * .3, s * .88, s * .035);
    ctx.restore();
  }
  function binIcon(x, y, s) {   // outline folder for editor bins / AE folders
    ctx.save(); ctx.translate(x, y); ctx.strokeStyle = '#e8bf55'; ctx.lineWidth = s * .08; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(s * .05, s * .82); ctx.lineTo(s * .05, s * .2); ctx.lineTo(s * .38, s * .2); ctx.lineTo(s * .48, s * .32); ctx.lineTo(s * .95, s * .32); ctx.lineTo(s * .95, s * .82); ctx.closePath(); ctx.stroke();
    ctx.fillStyle = 'rgba(232,191,85,.18)'; ctx.fill(); ctx.restore();
  }
  function seqIcon(x, y, s) {
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = '#2b2940'; rr(0, s * .12, s, s * .76, s * .14); ctx.fill(); ctx.strokeStyle = '#7d66ff'; ctx.lineWidth = s * .06; ctx.stroke();
    ctx.fillStyle = '#a58cff'; rr(s * .14, s * .26, s * .5, s * .12, s * .05); ctx.fill();
    ctx.fillStyle = '#4fd8a8'; rr(s * .3, s * .44, s * .56, s * .12, s * .05); ctx.fill();
    ctx.fillStyle = '#ffb547'; rr(s * .14, s * .62, s * .38, s * .12, s * .05); ctx.fill();
    ctx.restore();
  }
  function compIcon(x, y, s) {   // an AE-style composition: a frame with two stacked layers
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = '#1f2a4a'; rr(0, s * .12, s, s * .76, s * .14); ctx.fill(); ctx.strokeStyle = '#6f8fff'; ctx.lineWidth = s * .06; ctx.stroke();
    ctx.fillStyle = '#8fb0ff'; rr(s * .18, s * .28, s * .46, s * .3, s * .06); ctx.fill();
    ctx.fillStyle = 'rgba(255,196,90,.95)'; rr(s * .38, s * .44, s * .44, s * .3, s * .06); ctx.fill();
    ctx.restore();
  }
  function fileIcon(x, y, s, kind) {
    const col = kind === 'v' ? ['#5aa2ff', '#2f6bff'] : kind === 'a' ? ['#ffa34d', '#ff6a2b'] : kind === 'e' ? ['#7d9bff', '#3550e8'] : ['#a487ff', '#5b38f0'];
    const w = s * .8, fx = x + s * .1, f = s * .26;
    ctx.save();
    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = 'rgba(0,0,0,.22)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(fx, y); ctx.lineTo(fx + w - f, y); ctx.lineTo(fx + w, y + f); ctx.lineTo(fx + w, y + s); ctx.lineTo(fx, y + s); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#e4e4ea'; ctx.beginPath(); ctx.moveTo(fx + w - f, y); ctx.lineTo(fx + w - f, y + f); ctx.lineTo(fx + w, y + f); ctx.closePath(); ctx.fill();
    const g = ctx.createLinearGradient(0, y + s * .42, 0, y + s * .92); g.addColorStop(0, col[0]); g.addColorStop(1, col[1]);
    ctx.fillStyle = g; rr(fx - s * .06, y + s * .42, w * .92, s * .44, s * .08); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.strokeStyle = '#fff'; const cxx = fx - s * .06 + w * .46, cy = y + s * .64;
    if (kind === 'v') { ctx.beginPath(); ctx.moveTo(cxx - s * .08, cy - s * .11); ctx.lineTo(cxx + s * .12, cy); ctx.lineTo(cxx - s * .08, cy + s * .11); ctx.closePath(); ctx.fill(); }
    else if (kind === 'a') { ctx.lineWidth = s * .05; ctx.beginPath(); ctx.moveTo(cxx + s * .06, cy + s * .08); ctx.lineTo(cxx + s * .06, cy - s * .13); ctx.lineTo(cxx + s * .14, cy - s * .09); ctx.stroke(); ctx.beginPath(); ctx.arc(cxx + s * .01, cy + s * .08, s * .055, 0, 7); ctx.fill(); }
    else if (kind === 'e') { ctx.lineWidth = s * .045; rr(cxx - s * .15, cy - s * .12, s * .2, s * .15, s * .03); ctx.stroke(); rr(cxx - s * .05, cy - s * .03, s * .2, s * .15, s * .03); ctx.fill(); }
    else { ctx.lineWidth = s * .045; rr(cxx - s * .15, cy - s * .1, s * .3, s * .2, s * .04); ctx.stroke(); line(cxx - s * .05, cy - s * .1, cxx - s * .05, cy + s * .1, '#fff', s * .04); line(cxx + s * .05, cy - s * .1, cxx + s * .05, cy + s * .1, '#fff', s * .04); }
    ctx.restore();
  }
  // generic app tiles (not real logos): purple with a film frame = the Premiere tool, blue with two layers = the After Effects tool
  function appBadge(x, y, s, kind = 'pr') {
    ctx.save(); const g = ctx.createLinearGradient(x, y, x + s, y + s);
    if (kind === 'ae') { g.addColorStop(0, '#8fb0ff'); g.addColorStop(1, '#2f45d8'); } else { g.addColorStop(0, '#a98bff'); g.addColorStop(1, '#5432e6'); }
    ctx.fillStyle = g; rr(x, y, s, s, s * .24); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.fillStyle = '#fff'; ctx.lineWidth = s * .08;
    if (kind === 'ae') { rr(x + s * .2, y + s * .24, s * .38, s * .3, s * .06); ctx.stroke(); rr(x + s * .42, y + s * .46, s * .38, s * .3, s * .06); ctx.fill(); }
    else { rr(x + s * .22, y + s * .3, s * .56, s * .4, s * .07); ctx.stroke(); line(x + s * .4, y + s * .3, x + s * .4, y + s * .7, '#fff', s * .07); line(x + s * .6, y + s * .3, x + s * .6, y + s * .7, '#fff', s * .07); }
    ctx.restore();
  }
  function cursor(x, y, s, press = 0) {
    const k = s / 20 * (1 - press * .12);
    ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
    ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 6; ctx.shadowOffsetY = 2;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 17); ctx.lineTo(4, 13.4); ctx.lineTo(6.8, 19.6); ctx.lineTo(9.4, 18.5); ctx.lineTo(6.7, 12.5); ctx.lineTo(12, 12.5); ctx.closePath();
    ctx.fillStyle = '#fff'; ctx.fill(); ctx.shadowColor = 'transparent'; ctx.strokeStyle = '#111'; ctx.lineWidth = 1.3; ctx.lineJoin = 'round'; ctx.stroke();
    ctx.restore();
  }
  function ripple(x, y, t, t0, col, r1 = 30, lw = 3) {
    const u = seg(t, t0, t0 + .45); if (u <= 0 || u >= 1) return;
    ctx.strokeStyle = rgba(col, (1 - u) * .9); ctx.lineWidth = lw * (1 - u * .5); ctx.beginPath(); ctx.arc(x, y, 4 + eo(u) * r1, 0, 7); ctx.stroke();
  }
  function mouseGlyph(x, y, s, col) { ctx.strokeStyle = col; ctx.lineWidth = s * .09; rr(x - s * .3, y - s * .45, s * .6, s * .9, s * .3); ctx.stroke(); line(x, y - s * .45, x, y - s * .12, col, s * .08); }
  function keyGlyph(x, y, s, col) { ctx.strokeStyle = col; ctx.lineWidth = s * .08; rr(x - s * .5, y - s * .3, s, s * .6, s * .1); ctx.stroke(); ctx.fillStyle = col; for (let i = 0; i < 4; i++) ctx.fillRect(x - s * .36 + i * s * .2, y - s * .14, s * .1, s * .09); ctx.fillRect(x - s * .24, y + s * .06, s * .48, s * .09); }
  function checkMark(x, y, s, prog, col = '#fff', lw) {
    ctx.strokeStyle = col; ctx.lineWidth = lw || s * .16; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const pts = [[-.32, .02], [-.1, .24], [.34, -.22]], L1 = Math.hypot(.22, .22), L2 = Math.hypot(.44, .46), tot = L1 + L2, d = prog * tot;
    ctx.beginPath(); ctx.moveTo(x + pts[0][0] * s, y + pts[0][1] * s);
    if (d <= L1) { const u = d / L1; ctx.lineTo(x + lerp(pts[0][0], pts[1][0], u) * s, y + lerp(pts[0][1], pts[1][1], u) * s); }
    else { ctx.lineTo(x + pts[1][0] * s, y + pts[1][1] * s); const u = (d - L1) / L2; ctx.lineTo(x + lerp(pts[1][0], pts[2][0], u) * s, y + lerp(pts[1][1], pts[2][1], u) * s); }
    ctx.stroke(); ctx.lineCap = 'butt';
  }
  function bubbleIcon(x, y, s, col) {
    ctx.save(); ctx.fillStyle = col; rr(x - s * .5, y - s * .4, s, s * .7, s * .2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x - s * .22, y + s * .28); ctx.lineTo(x - s * .3, y + s * .5); ctx.lineTo(x - s * .02, y + s * .28); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#16102e'; for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.arc(x + i * s * .22, y - s * .05, s * .07, 0, 7); ctx.fill(); }
    ctx.restore();
  }
  // a download arrow into a tray (a plain sign, no brand logo)
  function downloadIcon(x, y, s, col) {
    ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = s * .11; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(x, y - s * .42); ctx.lineTo(x, y + s * .12); ctx.moveTo(x - s * .24, y - s * .1); ctx.lineTo(x, y + s * .14); ctx.lineTo(x + s * .24, y - s * .1); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - s * .42, y + s * .12); ctx.lineTo(x - s * .42, y + s * .4); ctx.lineTo(x + s * .42, y + s * .4); ctx.lineTo(x + s * .42, y + s * .12); ctx.stroke();
    ctx.restore();
  }
  function winButtons(w, y, col) { const x = w - 46; line(x - 92 - 8, y, x - 92 + 8, y, col, 1.5); ctx.strokeStyle = col; ctx.lineWidth = 1.5; ctx.strokeRect(x - 46 - 7, y - 7, 14, 14); line(x - 7, y - 7, x + 7, y + 7, col, 1.5); line(x + 7, y - 7, x - 7, y + 7, col, 1.5); }

  // ───────────────────────── layout ─────────────────────────
  const RG = VERT ? { x: 60, y: 300, w: 960, h: 1000 } : { x: 230, y: 268, w: 1460, h: 772 };
  const RC = { x: RG.x + RG.w / 2, y: RG.y + RG.h / 2 };
  const EXW = VERT ? 800 : 1180, EXH = VERT ? 800 : 700;
  const EDW = VERT ? 920 : 1320, EDH = VERT ? 960 : 740;
  const DLW = VERT ? 820 : 1040, DLH = VERT ? 820 : 640;
  const fitR = (w, h, r, cap = 9) => { const s = Math.min(r.w / w, r.h / h, cap); return { s, x: r.x + (r.w - w * s) / 2, y: r.y + (r.h - h * s) / 2 }; };
  const EX = fitR(EXW, EXH, RG), ED = fitR(EDW, EDH, RG), DL = fitR(DLW, DLH, RG, 1.12);
  const ID = { cx: RC.x, cy: RC.y, s: 1 };
  const camMap = (c, x, y) => ({ x: (x - c.cx) * c.s + RC.x, y: (y - c.cy) * c.s + RC.y });
  const camApply = c => { ctx.translate(RC.x, RC.y); ctx.scale(c.s, c.s); ctx.translate(-c.cx, -c.cy); };
  function camAt(t, keys) {
    let c = { ...ID };
    for (const k of keys) {
      const u = (k.ease || eio)(seg(t, k.t0, k.t1)); if (u <= 0) break;
      c = { cx: lerp(c.cx, k.cx, u), cy: lerp(c.cy, k.cy, u), s: Math.exp(lerp(Math.log(c.s), Math.log(k.s), u)) };
      if (u < 1) break;
    }
    return c;
  }

  // ───────────────────────── data (true to both tools) ─────────────────────────
  const FOLDER = 'Reversing Aging', LINK = 'github.com/raisulsohan/LazyProjectHere';
  const FILES = [['B-roll_City.mp4', 'MP4 File', '1.84 GB', 'v'], ['Interview_01.mp4', 'MP4 File', '2.31 GB', 'v'], ['Interview_02.mp4', 'MP4 File', '1.97 GB', 'v'], ['Music_Bed.mp3', 'MP3 File', '8.4 MB', 'a'], ['Voiceover.mp3', 'MP3 File', '12.1 MB', 'a']];
  const PRJ = ['Reversing Aging.prproj', 'Premiere Pro Project', '', 'p'];
  const AEP = ['Reversing Aging.aep', 'After Effects Project', '', 'e'];   // sorted by name: .aep comes before .prproj
  const NEW_AT = 4;
  const BINS = ['01 Footage', '02 Audio', '03 Graphics', '04 Music', '05 Photos'];
  const SEQS = [['Reversing Aging_16X9', '1920 × 1080', 16 / 9, '_16X9'], ['Reversing Aging_9X16', '1080 × 1920', 9 / 16, '_9X16'], ['Reversing Aging_4X5', '1080 × 1350', 4 / 5, '_4X5']];
  const STEPS = [
    ['Open Premiere Pro / After Effects', 'm'], ['File › New › Project…', 'm'], ['Type the project name', 'k'], ['Browse… pick the location', 'm'], ['Click OK', 'm'],
    ['New Sequence / New Comp…', 'm'], ['Frame size: 1920 × 1080', 'k'], ['Frame rate: 30 fps', 'm'], ['Name it', 'k'],
    ['Again for 9X16 and 4X5…', 'm', 1], ['Ctrl+I → some old folder', 'k', 1], ['Browse to the footage again…', 'm', 1]];
  const ST = STEPS.map((s, i) => .45 + 2.35 * (1 - Math.pow(1 - i / (STEPS.length - 1), 1.25)));   // the steps come faster and faster

  // ───────────────────────── timeline (s) ─────────────────────────
  const T = { stamp: 2.85, push0: 3.45, push1: 4.1, end: 16.65, chips: 17.0, cta: [17.3, 17.9] };
  // part 1: Premiere Pro (no Ctrl+I here) · part 2: After Effects, then Ctrl+I once
  const P1 = {
    kind: 'pr', in: [T.push0, T.push1], curIn: [4.1, 4.6], rclick: 4.68, zoom1: [4.75, 5.15], curMenu: [4.95, 5.3], hover: 5.22, lclick: 5.5, menuOut: [5.54, 5.74],
    ins: [5.7, 6.05], sel: [5.85, 6.05], zoom2: [5.65, 6.1], curRest: [5.7, 6.2], pulse: [6.08, 6.2], dive: [6.25, 6.95], fixOut: [6.6, 6.9], edGrow: [6.35, 7.0], edIn: [6.45, 6.65],
    badge1: 5.4, badge2: 6.2, rows0: 7.0, rowStep: .07, zoomP: [7.05, 7.5], out: [8.7, 9.2]
  };
  const P2 = {
    kind: 'ae', in: [8.75, 9.35], curIn: [9.2, 9.7], rclick: 9.78, zoom1: [9.85, 10.25], curMenu: [10.05, 10.42], hover: 10.34, lclick: 10.62, menuOut: [10.66, 10.86],
    ins: [10.82, 11.17], sel: [10.97, 11.17], zoom2: [10.77, 11.22], curRest: [10.82, 11.3], pulse: [11.2, 11.32], dive: [11.38, 12.08], fixOut: [11.73, 12.03], edGrow: [11.48, 12.13], edIn: [11.58, 11.78],
    badge1: 10.52, badge2: 11.33, rows0: 12.13, rowStep: .06, zoomP: [12.18, 12.63], zoomPout: [13.45, 13.85],
    keys: 13.9, press: 14.3, dlg: [14.48, 14.95], hl: 15.1, zoomA: [15.0, 15.5], out: [16.15, 16.65]
  };

  // ───────────────────────── background ─────────────────────────
  const BGD = [];
  for (let i = 0; i < 70; i++) { const a = (i * 137.5) % 360, r = (i * 53) % 97 / 97; BGD.push([((i * 0.618034) % 1), ((i * 0.381966 * 1.7) % 1), .6 + r * 1.6, a]); }
  function background(t) {
    const k = (a, b) => seg(t, a, b);
    const wP = 1 - k(T.push0, T.push1), wF = k(T.push0, T.push1) * (1 - k(6.4, 7.1)), wR = k(6.4, 7.1) * (1 - k(8.7, 9.3)),
      wF2 = k(8.7, 9.3) * (1 - k(11.5, 12.2)), wA = k(11.5, 12.2) * (1 - k(T.end - .4, T.end + .3)), wE = k(T.end - .4, T.end + .3);
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#100c26'); g.addColorStop(1, '#06050d');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const A = mixC([['#ff2d55', wP + 1e-6], ['#12c98e', wF + wF2], ['#7b52ff', wR + wE], ['#2f5cff', wA]]);
    const B = mixC([['#ff7a1a', wP + 1e-6], ['#2f7cff', wF + wR + wF2], ['#7b52ff', wA], ['#16d39a', wE]]);
    const blob = (x, y, r, c, a) => { const rg = ctx.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0, rgba(c, a)); rg.addColorStop(1, rgba(c, 0)); ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H); };
    const D = Math.max(W, H);
    blob(W * (.16 + .05 * Math.sin(t * .23)), H * (.2 + .05 * Math.cos(t * .19)), D * .62, A, .34);
    blob(W * (.86 + .04 * Math.cos(t * .21)), H * (.84 + .05 * Math.sin(t * .17)), D * .6, B, .3);
    for (const [px, py, r, a] of BGD) {
      const x = ((px * W + t * 9 * Math.cos(a)) % W + W) % W, y = ((py * H - t * 12) % H + H) % H;
      ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
    }
  }
  function vignette() {
    const rg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .35, W / 2, H / 2, Math.max(W, H) * .78);
    rg.addColorStop(0, 'rgba(0,0,0,0)'); rg.addColorStop(1, 'rgba(0,0,0,.5)'); ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);
  }

  // ───────────────────────── headlines ─────────────────────────
  const HL = VERT ? { tag: 78, y: 200, sz: 80, sub: 256, subSz: 31, maxW: 980 } : { tag: 70, y: 168, sz: 76, sub: 222, subSz: 30, maxW: 1560 };
  const HEADS = [
    { t0: 3.95, t1: 5.75, tag: 'NOW', tc: C.green, p: [['Right-click the ', '#fff'], ['footage folder', C.green]], sub: 'Windows 11: Shift + right-click' },
    { t0: 5.7, t1: 8.85, tag: 'PREMIERE PRO', tc: C.purple2, p: [['Premiere Pro project, ', '#fff'], ['ready', C.green]], sub: '5 bins  ·  3 sequences: 16X9, 9X16, 4X5  ·  30 fps  ·  named after the folder' },
    { t0: 8.8, t1: 11.2, tag: 'AFTER EFFECTS', tc: C.blue2, p: [['Same menu. ', '#fff'], ['After Effects too.', C.blue2]], sub: 'New After Effects project here' },
    { t0: 11.15, t1: 13.95, tag: 'AFTER EFFECTS', tc: C.blue2, p: [['After Effects project, ', '#fff'], ['ready', C.green]], sub: '6 folders  ·  3 comps in 00 Comps  ·  30 fps  ·  30 s  ·  16X9 open' },
    { t0: 13.9, t1: 16.7, tag: 'CTRL+I', tc: C.green, p: [['Import opens ', '#fff'], ['this folder', C.green]], sub: 'No more browsing for your footage' }
  ];
  function drawHead(t, h) {
    const a = seg(t, h.t0, h.t0 + .5), b = seg(t, h.t1 - .32, h.t1);
    if (a <= 0 || b >= 1) return;
    const ea = eo(a), eb = ei(b), al = ea * (1 - eb), dy = (1 - ea) * 44 - eb * 34;
    ctx.save(); ctx.globalAlpha *= al; ctx.translate(0, dy);
    const ta = eo(seg(t, h.t0, h.t0 + .4));
    ctx.save(); ctx.translate(W / 2, HL.tag); ctx.scale(lerp(.8, 1, ta), lerp(.8, 1, ta));
    pill(0, 0, h.tag, 20, '#0c0a1c', h.tc, { w: 800 }); ctx.restore();
    const sz = Math.min(HL.sz, HL.sz * HL.maxW / partsW(h.p, HL.sz, 800, BN));
    parts(h.p, W / 2, HL.y, sz, 800, BN);
    const sa = seg(t, h.t0 + .15, h.t0 + .6);
    ctx.globalAlpha = al * sa; txt(h.sub, W / 2, HL.sub + (1 - eo(sa)) * 16, fitSz(h.sub, HL.maxW, HL.subSz, 500), C.mut, { w: 500, al: 'center' });
    ctx.restore();
  }
  const CLIPY = HL.sub + 24;
  function clipWin() { ctx.beginPath(); ctx.rect(-W, CLIPY, W * 3, H * 2); ctx.clip(); }
  function topBand(t) {
    const a = seg(t, 6.0, 6.6) * (1 - seg(t, P2.out[0], P2.out[1] - .05)); if (a <= 0) return;
    const g = ctx.createLinearGradient(0, CLIPY, 0, CLIPY + 34); g.addColorStop(0, `rgba(12,9,28,${.85 * a})`); g.addColorStop(1, 'rgba(12,9,28,0)');
    ctx.fillStyle = g; ctx.fillRect(0, CLIPY, W, 34);
  }

  // ───────────────────────── scene 1: the long way ─────────────────────────
  const PL = VERT ? { list: { x: 70, y: 430, w: 940, h: 860 }, ph: 66, gap: 12 } : { list: { x: 900, y: 92, w: 900, h: 910 }, ph: 66, gap: 12 };
  const PSTEP = PL.ph + PL.gap;
  const target = n => Math.max(0, n * PSTEP - PL.list.h);
  function scrollAt(t) { let s = 0; for (let i = 0; i < ST.length; i++) s += (target(i + 1) - target(i)) * eio(seg(t, ST[i], ST[i] + .4)); return s; }
  function drawPain(t) {
    const land = T.stamp + .22, sh = t > land ? Math.sin((t - land) * 85) * 13 * Math.exp(-(t - land) * 11) : 0;
    ctx.save(); ctx.translate(sh, sh * .4);
    const tagA = eo(seg(t, .1, .5)), hA = eo(seg(t, .2, .75)), sA = eo(seg(t, .45, .95)), cA = eo(seg(t, .55, 1.05));
    const nLand = ST.filter(s => t >= s + .2).length, red = nLand >= 10;
    if (!VERT) {
      const cx = 470;
      ctx.save(); ctx.globalAlpha *= tagA; ctx.translate(cx, 250 + (1 - tagA) * 20); pill(0, 0, 'THE OLD WAY', 22, '#1a0610', C.red, { w: 800 }); ctx.restore();
      ctx.save(); ctx.globalAlpha *= hA; ctx.translate(0, (1 - hA) * 50);
      txt('Every project,', cx, 390, fitSz('Every project,', 760, 104, 800), '#fff', { w: 800, al: 'center' });
      parts([['same ', '#fff'], ['hassle', C.red]], cx, 512, 104, 800, BN);
      ctx.restore();
      ctx.save(); ctx.globalAlpha *= sA; txt('Setting up Premiere Pro or After Effects by hand', cx, 600 + (1 - sA) * 18, fitSz('Setting up Premiere Pro or After Effects by hand', 760, 30, 500), C.mut, { w: 500, al: 'center' }); ctx.restore();
      counter(t, cx, 830, 200, cA, nLand, red);
    } else {
      const cx = W / 2;
      ctx.save(); ctx.globalAlpha *= tagA; ctx.translate(cx, 80 + (1 - tagA) * 20); pill(0, 0, 'THE OLD WAY', 20, '#1a0610', C.red, { w: 800 }); ctx.restore();
      ctx.save(); ctx.globalAlpha *= hA; ctx.translate(0, (1 - hA) * 44);
      const hp = [['Every project, same ', '#fff'], ['hassle', C.red]];
      parts(hp, cx, 200, Math.min(84, 84 * 960 / partsW(hp, 84, 800, BN)), 800, BN); ctx.restore();
      ctx.save(); ctx.globalAlpha *= sA; txt('Setting up Premiere Pro or After Effects by hand', cx, 260 + (1 - sA) * 16, fitSz('Setting up Premiere Pro or After Effects by hand', 960, 30, 500), C.mut, { w: 500, al: 'center' }); ctx.restore();
      counter(t, cx, 384, 100, cA, nLand, red);
    }
    const L = PL.list, sc = scrollAt(t), dim = 1 - .45 * eo(seg(t, T.stamp, T.stamp + .3));
    ctx.save(); ctx.beginPath(); ctx.rect(0, L.y - PSTEP, W, L.h + PSTEP + 4); ctx.clip();
    for (let i = 0; i < STEPS.length; i++) {
      const a = seg(t, ST[i], ST[i] + .4); if (a <= 0) continue;
      const [label, kind, bad] = STEPS[i];
      const x = L.x + (1 - eo5(a)) * (W + 30 - L.x), y = L.y + i * PSTEP - sc;
      const fade = clamp((y - (L.y - PSTEP * .9)) / (PSTEP * .9));
      if (fade <= 0) continue;
      ctx.save(); ctx.globalAlpha *= fade * dim;
      ctx.fillStyle = bad ? 'rgba(255,77,106,.16)' : 'rgba(34,27,64,.92)'; rr(x, y, L.w, PL.ph, 16); ctx.fill();
      ctx.strokeStyle = bad ? 'rgba(255,77,106,.75)' : 'rgba(255,255,255,.09)'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = bad ? 'rgba(255,77,106,.3)' : 'rgba(140,108,255,.26)'; rr(x + 12, y + 11, 44, 44, 11); ctx.fill();
      txt(String(i + 1).padStart(2, '0'), x + 34, y + 40, 19, bad ? '#ffd0d8' : '#d2c6ff', { fam: UI, w: 700, al: 'center' });
      txt(label, x + 74, y + 42, 27, bad ? '#ffd9df' : '#f3f1fb', { fam: UI, w: 600 });
      const gx = x + L.w - 40, gy = y + PL.ph / 2, gc = bad ? '#ff8a9c' : '#9d93c9';
      kind === 'k' ? keyGlyph(gx, gy, 30, gc) : mouseGlyph(gx, gy, 30, gc);
      ripple(gx, gy, t, ST[i] + .3, bad ? C.red : C.purple2, 34, 3);
      ctx.restore();
    }
    ctx.restore();
    const sa = seg(t, T.stamp, T.stamp + .22);
    if (sa > 0) {
      const s = lerp(1.9, 1, eo(sa)), cx = L.x + L.w / 2, cy = L.y + L.h * (VERT ? .52 : .5), sz = VERT ? 84 : 96, lbl = 'WASTED TIME';
      const bw = tw(lbl, sz, 800) + sz * 1.1, bh = sz * 1.6;
      ctx.save(); ctx.globalAlpha *= clamp(sa * 3); ctx.translate(cx, cy); ctx.rotate(-.12); ctx.scale(s, s);
      ctx.shadowColor = 'rgba(255,40,80,.55)'; ctx.shadowBlur = 40;
      ctx.fillStyle = 'rgba(28,6,14,.92)'; rr(-bw / 2, -bh / 2, bw, bh, 22); ctx.fill(); ctx.shadowColor = 'transparent';
      ctx.strokeStyle = C.red; ctx.lineWidth = 7; rr(-bw / 2, -bh / 2, bw, bh, 22); ctx.stroke();
      ctx.lineWidth = 2; rr(-bw / 2 + 12, -bh / 2 + 12, bw - 24, bh - 24, 14); ctx.stroke();
      txt(lbl, 0, sz * .36, sz, C.red, { w: 800, al: 'center' });
      ctx.restore();
    }
    ctx.restore();
  }
  function counter(t, cx, y, sz, a, n, red) {
    if (a <= 0) return;
    const k = n - 1, q = n > 0 ? eo(seg(t, ST[k] + .2, ST[k] + .42)) : 1, col = red ? C.red : '#fff';
    ctx.save(); ctx.globalAlpha *= a; ctx.translate(0, (1 - a) * 30);
    const A0 = ctx.globalAlpha, unit = n === 1 ? 'step' : 'steps', usz = sz * .3, gap = sz * .1;
    const nw = Math.max(tw(bnd(Math.max(n, 1)), sz, 700), tw('00', sz, 700) * .9), uw = tw(unit, usz, 600), tot = nw + gap + uw, x0 = cx - tot / 2;
    ctx.save(); ctx.beginPath(); ctx.rect(x0 - 20, y - sz * .84, nw + 40, sz * 1.06); ctx.clip();
    if (n > 0 && q < 1) { ctx.globalAlpha = A0 * Math.pow(1 - q, 2.5); txt(bnd(n - 1), x0 + nw, y - q * sz * 1.2, sz, '#fff', { w: 700, al: 'right' }); }
    ctx.globalAlpha = A0 * (n > 0 ? q : 1); txt(bnd(n), x0 + nw, y + (1 - q) * sz * 1.2, sz, col, { w: 700, al: 'right' });
    ctx.restore();
    txt(unit, x0 + nw + gap, y, usz, C.mut, { w: 600 });
    ctx.restore();
  }

  // ───────────────────────── explorer ─────────────────────────
  function exGeo(w, h, dialog) {
    const narrow = w < 1000, navW = narrow ? 196 : 236, hdrY = 158, rowsY = hdrY + 46, rowH = 50, mx = navW, mw = w - navW;
    const cols = narrow ? [mx + 22, mx + mw * .6] : [mx + 22, mx + mw * .52, mx + mw * .8];
    const sw = narrow ? 170 : 240, addr = { x: 176, y: 62, w: w - 176 - sw - 34, h: 38 };
    return { narrow, navW, hdrY, rowsY, rowH, mx, mw, cols, sw, addr };
  }
  const NAV = [['Home', '#4a8cff'], ['Gallery', '#ff9f43'], 0, ['Desktop', '#3d8bff'], ['Downloads', '#22b573'], ['Documents', '#8a8a98'], ['Videos', '#8c6cff'], 0, ['This PC', '#3d8bff'], ['Local Disk (D:)', '#6b6b78', 1]];
  // the rows: the five files, plus the new .aep / .prproj as they appear (k = 0…1 grows the row in)
  function rowList(o) {
    const out = [];
    FILES.forEach((f, i) => { if (i === NEW_AT) { out.push([AEP, o.insA || 0, o.selA || 0]); out.push([PRJ, o.insP || 0, o.selP || 0]); } out.push([f, 1, 0, 1]); });
    return out;
  }
  function drawExplorer(w, h, o) {
    const G = exGeo(w, h, o.dialog);
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 70; ctx.shadowOffsetY = 30;
    ctx.fillStyle = '#f7f7f9'; rr(0, 0, w, h, 16); ctx.fill(); ctx.restore();
    ctx.save(); rr(0, 0, w, h, 16); ctx.clip();
    ctx.fillStyle = '#e3e5ee'; ctx.fillRect(0, 0, w, 52);
    if (!o.dialog) {
      ctx.fillStyle = '#f9f9fb'; rr(14, 10, 318, 56, 12); ctx.fill();
      folderIcon(32, 20, 24); txt(FOLDER, 68, 40, 17, '#1c1c22', { fam: UI, w: 500 });
      line(304, 26, 316, 38, '#555', 1.4); line(316, 26, 304, 38, '#555', 1.4);
      line(352, 32, 366, 32, '#555', 1.5); line(359, 25, 359, 39, '#555', 1.5);
    } else {
      appBadge(18, 15, 22, o.app); txt(o.title || 'Import', 52, 33, 17, '#1c1c22', { fam: UI, w: 600 });
    }
    winButtons(w, 30, '#3a3a44');
    ctx.fillStyle = '#f9f9fb'; ctx.fillRect(0, 52, w, 106);
    const ay = 81; ctx.lineCap = 'round';
    [[26, -1], [66, 1]].forEach(([x, d]) => { line(x - 8 * d, ay, x + 8 * d, ay, '#6a6a78', 1.8); line(x - 8 * d, ay, x - 2 * d, ay - 6, '#6a6a78', 1.8); line(x - 8 * d, ay, x - 2 * d, ay + 6, '#6a6a78', 1.8); });
    line(106, ay + 8, 106, ay - 8, '#6a6a78', 1.8); line(106, ay - 8, 100, ay - 2, '#6a6a78', 1.8); line(106, ay - 8, 112, ay - 2, '#6a6a78', 1.8);
    ctx.strokeStyle = '#6a6a78'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.arc(144, ay, 7.5, -.4, 4.6); ctx.stroke(); ctx.lineCap = 'butt';
    const A = G.addr; ctx.fillStyle = '#ffffff'; rr(A.x, A.y, A.w, A.h, 8); ctx.fill(); ctx.strokeStyle = '#d6d6de'; ctx.lineWidth = 1; ctx.stroke();
    folderIcon(A.x + 12, A.y + 9, 20);
    const crumbs = G.narrow ? ['D:', 'Projects', FOLDER] : ['This PC', 'Local Disk (D:)', 'Projects', FOLDER];
    let px = A.x + 42;
    crumbs.forEach((c, i) => {
      const last = i === crumbs.length - 1; txt(c, px, A.y + 25, 16, last ? '#111' : '#3a3a46', { fam: UI, w: last ? 600 : 400 }); px += tw(c, 16, last ? 600 : 400, UI);
      if (!last) { txt('›', px + 10, A.y + 25, 17, '#8a8a96', { fam: UI, w: 400, al: 'center' }); px += 20; }
    });
    ctx.fillStyle = '#ffffff'; rr(w - G.sw - 20, A.y, G.sw, A.h, 8); ctx.fill(); ctx.strokeStyle = '#d6d6de'; ctx.stroke();
    ctx.strokeStyle = '#7a7a86'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(w - G.sw - 2, A.y + 18, 6, 0, 7); ctx.stroke(); line(w - G.sw + 2, A.y + 22, w - G.sw + 7, A.y + 27, '#7a7a86', 1.6);
    txt(G.narrow ? 'Search' : 'Search ' + FOLDER, w - G.sw + 14, A.y + 24, 15, '#8a8a96', { fam: UI, w: 400 });
    line(0, 112, w, 112, '#ececf1', 1);
    if (!o.dialog) {
      ctx.fillStyle = '#ffffff'; rr(14, 120, 92, 30, 7); ctx.fill(); ctx.strokeStyle = '#dcdce4'; ctx.stroke();
      txt('+', 30, 141, 20, '#2a62d8', { fam: UI, w: 500, al: 'center' }); txt('New', 44, 140, 15, '#222', { fam: UI, w: 500 }); txt('⌄', 90, 136, 13, '#555', { fam: UI, w: 500, al: 'center' });
      const ix = 136;
      for (let i = 0; i < 5; i++) { ctx.strokeStyle = '#7b7b88'; ctx.lineWidth = 1.5; rr(ix + i * 40 - 8, 127, 16, 16, 3); ctx.stroke(); }
      txt('Sort ⌄', ix + 220, 141, 15, '#333', { fam: UI, w: 500 }); txt('View ⌄', ix + 290, 141, 15, '#333', { fam: UI, w: 500 }); txt('···', ix + 362, 141, 15, '#333', { fam: UI, w: 700 });
    } else {
      txt('Organize ⌄', 22, 141, 15, '#333', { fam: UI, w: 500 }); txt('New folder', 132, 141, 15, '#333', { fam: UI, w: 500 });
    }
    line(0, 158, w, 158, '#e4e4ea', 1);
    ctx.fillStyle = '#fbfbfc'; ctx.fillRect(0, 158, G.navW, h - 158); line(G.navW, 158, G.navW, h, '#ececf1', 1);
    let ny = 178;
    NAV.forEach(n => {
      if (!n) { line(18, ny + 4, G.navW - 18, ny + 4, '#e8e8ee', 1); ny += 12; return; }
      if (n[2]) { ctx.fillStyle = '#e8eefc'; rr(8, ny - 4, G.navW - 16, 34, 6); ctx.fill(); }
      ctx.fillStyle = n[1]; rr(22, ny + 4, 18, 16, 4); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(25, ny + 7, 12, 3);
      txt(n[0], 52, ny + 19, 15, '#24242c', { fam: UI, w: 500 }); ny += 38;
    });
    const hx = G.cols; txt('Name', hx[0] + 4, G.hdrY + 30, 14, '#5c5c6a', { fam: UI, w: 500 }); txt('Type', hx[1], G.hdrY + 30, 14, '#5c5c6a', { fam: UI, w: 500 }); if (hx[2]) txt('Size', hx[2], G.hdrY + 30, 14, '#5c5c6a', { fam: UI, w: 500 });
    line(G.mx + 12, G.hdrY + 44, w - 12, G.hdrY + 44, '#e8e8ee', 1);
    let y = G.rowsY;
    rowList(o).forEach(([f, k, sel, fixed]) => {
      const rh = G.rowH * (fixed ? 1 : eio(k)); if (rh < .5) return;
      ctx.save(); ctx.beginPath(); ctx.rect(G.mx, y, G.mw, rh); ctx.clip();
      const a = fixed ? 1 : clamp((k - .55) / .45);
      ctx.globalAlpha *= a;
      if (sel > 0) { ctx.fillStyle = rgba('#cfe3ff', sel); rr(G.mx + 8, y + 3, G.mw - 16, G.rowH - 6, 7); ctx.fill(); ctx.strokeStyle = rgba('#8fb9f5', sel); ctx.lineWidth = 1; ctx.stroke(); }
      const sx = fixed ? 0 : (1 - eo(a)) * 24;
      fileIcon(hx[0] + sx, y + 10, 30, f[3]);
      txt(f[0], hx[0] + 44 + sx, y + 32, 18, '#1b1b22', { fam: UI, w: fixed ? 500 : 600 });
      txt(f[1], hx[1], y + 32, 15, '#5d5d6a', { fam: UI, w: 400 });
      if (hx[2]) txt(f[2], hx[2], y + 32, 15, '#5d5d6a', { fam: UI, w: 400 });
      ctx.restore();
      y += rh;
    });
    if (o.dialog) {
      const by = h - 100; ctx.fillStyle = '#f1f1f5'; ctx.fillRect(0, by, w, 100); line(0, by, w, by, '#e0e0e8', 1);
      txt('File name:', G.navW - 96, by + 38, 15, '#333', { fam: UI, w: 500 });
      const fw = w - G.navW - 260; ctx.fillStyle = '#fff'; rr(G.navW, by + 16, fw, 34, 6); ctx.fill(); ctx.strokeStyle = '#cfd0da'; ctx.stroke();
      ctx.fillStyle = '#fff'; rr(G.navW + fw + 12, by + 16, 222, 34, 6); ctx.fill(); ctx.stroke(); txt(o.app === 'ae' ? 'All Acceptable Files ⌄' : 'All Supported Media ⌄', G.navW + fw + 24, by + 38, 14, '#333', { fam: UI, w: 500 });
      ctx.fillStyle = '#2f6bff'; rr(w - 252, by + 58, 112, 32, 6); ctx.fill(); txt(o.app === 'ae' ? 'Import' : 'Open', w - 196, by + 79, 15, '#fff', { fam: UI, w: 600, al: 'center' });
      ctx.fillStyle = '#fff'; rr(w - 128, by + 58, 112, 32, 6); ctx.fill(); ctx.strokeStyle = '#cfd0da'; ctx.stroke(); txt('Cancel', w - 72, by + 79, 15, '#222', { fam: UI, w: 500, al: 'center' });
    }
    ctx.restore();
    ctx.strokeStyle = 'rgba(0,0,0,.2)'; ctx.lineWidth = 1; rr(.5, .5, w - 1, h - 1, 16); ctx.stroke();
    return G;
  }
  // context menu (the classic menu: Shift + right-click on Windows 11) with both tools in it
  const MENU = [['View', 1], ['Sort by', 1], ['Group by', 1], 0, ['Refresh'], 0, ['New After Effects project here', 0, 'ae'], ['New Premiere Pro project here', 0, 'pr'], 0, ['New', 1], 0, ['Properties']];
  const MW = 420, MIH = 46, MSEP = 11;
  const MH = 14 + MENU.reduce((a, m) => a + (m ? MIH : MSEP), 0);
  const XG = exGeo(EXW, EXH, false);
  function menuGeo(click) {
    const box = { x: click.x + 2, y: click.y - MH - 2, w: MW, h: MH }, items = {};
    let y = box.y + 7; MENU.forEach(m => { if (!m) { y += MSEP; return; } if (m[2]) items[m[2]] = { x: box.x + 6, y, w: MW - 12, h: MIH }; y += MIH; });
    return { click, box, items };
  }
  // where things happen (explorer local units)
  const exToScreen = (x, y) => ({ x: EX.x + x * EX.s, y: EX.y + y * EX.s });
  const CUR_OUT = { x: EXW + 520, y: EXH + 460 };
  function setupPart(S, click, newIdx, zMenu, zRow) {
    S.click = click; S.menu = menuGeo(click); S.item = S.menu.items[S.kind];
    S.curMenu_ = { x: S.item.x + 170, y: S.item.y + 26 }; S.curRest_ = { x: click.x + 120, y: click.y + 110 };
    S.newY = XG.rowsY + newIdx * XG.rowH;
    const mC = exToScreen(S.menu.box.x + MW / 2, S.menu.box.y + MH / 2), rowC = exToScreen(XG.cols[0] + (VERT ? 250 : 300), S.newY + 25);
    S.icoL = { x: XG.cols[0] + 15, y: S.newY + 25 }; S.icoC = exToScreen(S.icoL.x, S.icoL.y);
    S.FIXCAM = [
      { t0: S.zoom1[0], t1: S.zoom1[1], cx: mC.x, cy: mC.y + (VERT ? 0 : 10), s: zMenu },
      { t0: S.zoom2[0], t1: S.zoom2[1], cx: rowC.x, cy: rowC.y, s: zRow },
      { t0: S.dive[0], t1: S.dive[1], cx: S.icoC.x, cy: S.icoC.y, s: zRow * 6, ease: u => u * u * u * u }
    ];
  }
  setupPart(P1, { x: XG.navW + (XG.narrow ? 150 : 300), y: XG.rowsY + 5 * XG.rowH + 66 }, NEW_AT, VERT ? 1.5 : 1.55, VERT ? 1.55 : 1.6);       // .prproj: row 5 of 6
  setupPart(P2, { x: XG.navW + (XG.narrow ? 170 : 330), y: XG.rowsY + 6 * XG.rowH + 64 }, NEW_AT, VERT ? 1.5 : 1.55, VERT ? 1.55 : 1.6);       // .aep goes in above the .prproj
  function drawMenu(t, S) {
    const a = seg(t, S.rclick + .04, S.rclick + .24), b = seg(t, S.menuOut[0], S.menuOut[1]);
    if (a <= 0 || b >= 1) return;
    const M = S.menu, c = S.click, s = lerp(.9, 1, eo(a)) * lerp(1, .96, b), al = eo(a) * (1 - b);
    ctx.save(); ctx.globalAlpha *= al; ctx.translate(c.x, c.y); ctx.scale(s, s); ctx.translate(-c.x, -c.y);
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.28)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 10;
    ctx.fillStyle = '#ffffff'; rr(M.box.x, M.box.y, MW, MH, 10); ctx.fill(); ctx.restore();
    ctx.strokeStyle = 'rgba(0,0,0,.12)'; ctx.lineWidth = 1; rr(M.box.x, M.box.y, MW, MH, 10); ctx.stroke();
    const hv = eo(seg(t, S.hover, S.hover + .12)), hc = S.kind === 'ae' ? '#3d63ff' : '#7c5cff';
    let y = M.box.y + 7;
    MENU.forEach(m => {
      if (!m) { line(M.box.x + 12, y + MSEP / 2, M.box.x + MW - 12, y + MSEP / 2, '#e6e6ec', 1); y += MSEP; return; }
      const tool = m[2], hero = tool === S.kind;
      if (hero && hv > 0) { ctx.fillStyle = rgba(hc, .15 * hv); rr(M.box.x + 6, y + 2, MW - 12, MIH - 4, 7); ctx.fill(); ctx.strokeStyle = rgba(hc, .55 * hv); ctx.lineWidth = 1.5; ctx.stroke(); }
      if (tool) appBadge(M.box.x + 18, y + 11, 24, tool);
      else { ctx.strokeStyle = '#8a8a96'; ctx.lineWidth = 1.5; rr(M.box.x + 22, y + 15, 16, 16, 3); ctx.stroke(); }
      txt(m[0], M.box.x + 56, y + 30, 18, tool ? '#1a1240' : '#1d1d24', { fam: UI, w: tool ? 600 : 400 });
      if (m[1]) { ctx.strokeStyle = '#666'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(M.box.x + MW - 26, y + 17); ctx.lineTo(M.box.x + MW - 20, y + 23); ctx.lineTo(M.box.x + MW - 26, y + 29); ctx.stroke(); }
      y += MIH;
    });
    ctx.restore();
  }
  function cursorPos(t, S) {
    const arc = (a, b, u, bend) => { const e = eio(u); const nx = -(b.y - a.y), ny = b.x - a.x, L = Math.hypot(nx, ny) || 1, k = Math.sin(Math.PI * e) * bend; return { x: lerp(a.x, b.x, e) + nx / L * k, y: lerp(a.y, b.y, e) + ny / L * k }; };
    if (t < S.curMenu[0]) return arc(CUR_OUT, S.click, seg(t, S.curIn[0], S.curIn[1]), 70);
    if (t < S.curRest[0]) return arc(S.click, S.curMenu_, seg(t, S.curMenu[0], S.curMenu[1]), -18);
    return arc(S.curMenu_, S.curRest_, seg(t, S.curRest[0], S.curRest[1]), 30);
  }
  const press = (t, t0) => { const d = seg(t, t0 - .02, t0 + .04), u = seg(t, t0 + .06, t0 + .16); return eo(d) * (1 - eo(u)); };
  // explorer state: part 1 adds the .prproj; part 2 opens the same folder again and adds the .aep above it
  function exState(t) {
    if (t < P2.in[0]) return { insP: seg(t, P1.ins[0], P1.ins[1]), selP: eo(seg(t, P1.sel[0], P1.sel[1])) };
    return { insP: 1, selP: 0, insA: seg(t, P2.ins[0], P2.ins[1]), selA: eo(seg(t, P2.sel[0], P2.sel[1])) };
  }
  function drawFix(t, S) {
    let ox = 0, oy = 0;
    if (S === P1) ox = (1 - eio(seg(t, S.in[0], S.in[1]))) * W;
    else oy = (1 - eo5(seg(t, S.in[0], S.in[1]))) * (H - RG.y + 60);      // part 2: the folder window comes back up from below the frame, opaque
    const al = 1 - seg(t, S.fixOut[0], S.fixOut[1]); if (al <= 0) return;
    const cam = camAt(t, S.FIXCAM);
    ctx.save(); ctx.translate(ox, oy); ctx.globalAlpha *= al;
    camApply(cam); ctx.translate(EX.x, EX.y); ctx.scale(EX.s, EX.s);
    drawExplorer(EXW, EXH, exState(t));
    drawMenu(t, S);
    const cp = cursorPos(t, S), hc = S.kind === 'ae' ? '#3d63ff' : '#7c5cff';
    ripple(S.click.x, S.click.y, t, S.rclick, hc, 34, 3.5); ripple(S.curMenu_.x, S.curMenu_.y, t, S.lclick, hc, 34, 3.5);
    ripple(S.icoL.x, S.icoL.y, t, S.pulse[0], hc, 26, 3); ripple(S.icoL.x, S.icoL.y, t, S.pulse[1], hc, 26, 2.5);
    if (t > S.curIn[0]) cursor(cp.x, cp.y, 30, Math.max(press(t, S.rclick), press(t, S.lclick)));
    ctx.restore();
    const sp = p => { const q = camMap(cam, EX.x + p.x * EX.s, EX.y + p.y * EX.s); return { x: q.x + ox, y: q.y + oy }; };
    badge(t, S.rclick, S.badge1, 'Right-click', '1', sp(S.click), al);
    badge(t, S.lclick, S.badge2, 'Click', '2', sp(S.curMenu_), al);
  }
  function badge(t, t0, t1, label, num, sp, al) {
    const a = seg(t, t0 + .02, t0 + .28), b = seg(t, t1 - .2, t1); if (a <= 0 || b >= 1) return;
    const s = eback(a) * (1 - .2 * b), sz = 28;
    const lw = tw(label, sz, 700) + sz * 2.6, lh = sz * 1.9, low = sp.y + 34 + lh > H - 16;   // no room under the pointer: sit to its left (the menu opens to the right)
    const x = low ? sp.x - 34 - lw : Math.min(sp.x + 34, W - lw - 16), y = low ? sp.y - lh / 2 : sp.y + 34;
    ctx.save(); ctx.globalAlpha *= al * clamp(a * 3) * (1 - b); ctx.translate(x, y); ctx.scale(s, s);
    ctx.shadowColor = 'rgba(0,0,0,.4)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 6;
    ctx.fillStyle = '#14112a'; rr(0, 0, lw, lh, lh / 2); ctx.fill(); ctx.shadowColor = 'transparent';
    ctx.strokeStyle = C.green; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.fillStyle = C.green; ctx.beginPath(); ctx.arc(lh / 2, lh / 2, lh / 2 - 6, 0, 7); ctx.fill();
    txt(num, lh / 2, lh / 2 + sz * .36, sz, '#0b1a14', { w: 700, al: 'center' });
    txt(label, lh + 6, lh / 2 + sz * .36, sz, '#fff', { w: 700 });
    ctx.restore();
  }

  // ───────────────────────── editors ─────────────────────────
  function edGeo(w, h, ae) {
    const g = 8, top = 86; let proj, mon, tl;
    if (!VERT) { proj = { x: g, y: top, w: 420, h: h - top - g }; mon = { x: g * 2 + 420, y: top, w: w - 420 - g * 3, h: 344 }; tl = { x: mon.x, y: top + 344 + g, w: mon.w, h: h - top - 344 - g * 2 }; }
    else { mon = { x: g, y: top, w: w - g * 2, h: 334 }; proj = { x: g, y: top + 334 + g, w: 392, h: h - top - 334 - g * 2 }; tl = { x: g * 2 + 392, y: proj.y, w: w - 392 - g * 3, h: proj.h }; }
    const rows = [];
    if (!ae) {
      let y = proj.y + 96; const bh = VERT ? 42 : 44, sh = VERT ? 56 : 58;
      BINS.forEach(n => { rows.push({ kind: 'bin', name: n, y, h: bh }); y += bh; });
      SEQS.forEach((s, i) => { rows.push({ kind: 'seq', s, i, y, h: sh }); y += sh; });
      return { proj, mon, tl, rows, listTop: proj.y + 96, listBot: y };
    }
    // After Effects: comp info on top, then the tree: 00 Comps (open, the three comps in it), 01 … 05
    let y = proj.y + 150; const rh = VERT ? 37 : 38;
    rows.push({ kind: 'fold', name: '00 Comps', open: 1, y, h: rh }); y += rh;
    SEQS.forEach((s, i) => { rows.push({ kind: 'comp', s, i, y, h: rh }); y += rh; });
    BINS.forEach(n => { rows.push({ kind: 'fold', name: n, y, h: rh }); y += rh; });
    return { proj, mon, tl, rows, listTop: proj.y + 44, listBot: y };
  }
  const EG = edGeo(EDW, EDH, false), AG = edGeo(EDW, EDH, true);
  function panel(r, title, acc) {
    ctx.fillStyle = '#1c1c24'; rr(r.x, r.y, r.w, r.h, 8); ctx.fill();
    ctx.fillStyle = '#22222b'; rr(r.x, r.y, r.w, 38, 8); ctx.fill(); ctx.fillRect(r.x, r.y + 30, r.w, 8);
    txt(title, r.x + 16, r.y + 25, 15, '#e8e8f1', { fam: UI, w: 600 });
    const tw0 = tw(title, 15, 600, UI); ctx.fillStyle = acc || C.purple; ctx.fillRect(r.x + 12, r.y + 35, tw0 + 8, 3);
    txt('≡', r.x + r.w - 22, r.y + 26, 18, '#8e8ea2', { fam: UI, w: 500, al: 'center' });
  }
  function shell(w, h, app, file, menus) {
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.65)'; ctx.shadowBlur = 70; ctx.shadowOffsetY = 30;
    ctx.fillStyle = '#111116'; rr(0, 0, w, h, 14); ctx.fill(); ctx.restore();
    ctx.save(); rr(0, 0, w, h, 14); ctx.clip();
    ctx.fillStyle = '#19191f'; ctx.fillRect(0, 0, w, 44);
    appBadge(14, 10, 24, app === 'After Effects' ? 'ae' : 'pr'); txt(app, 50, 29, 16, '#f1f1f7', { fam: UI, w: 700 });
    txt('—  ' + file, 50 + tw(app, 16, 700, UI) + 12, 29, 15, '#9c9cb0', { fam: UI, w: 500 });
    winButtons(w, 22, '#c9c9d6');
    ctx.fillStyle = '#141419'; ctx.fillRect(0, 44, w, 36);
    let mx = 16; menus.slice(0, VERT ? 7 : 9).forEach(m => { txt(m, mx, 67, 14, '#a8a8ba', { fam: UI, w: 500 }); mx += tw(m, 14, 500, UI) + 22; });
  }
  function shellEnd(w, h) { ctx.restore(); ctx.strokeStyle = 'rgba(255,255,255,.08)'; ctx.lineWidth = 1; rr(.5, .5, w - 1, h - 1, 14); ctx.stroke(); }
  const rowIn = (t, S, i) => eo(seg(t, S.rows0 + i * S.rowStep, S.rows0 + i * S.rowStep + .28));
  function drawEditor(w, h, t) {
    shell(w, h, 'Premiere Pro', FOLDER + '.prproj', ['File', 'Edit', 'Clip', 'Sequence', 'Markers', 'Graphics', 'View', 'Window', 'Help']);
    const { proj, mon, tl, rows } = EG;
    panel(proj, 'Project: ' + FOLDER);
    ctx.fillStyle = '#15151b'; rr(proj.x + 12, proj.y + 50, proj.w - 130, 32, 7); ctx.fill();
    ctx.strokeStyle = '#7d7d92'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(proj.x + 30, proj.y + 65, 6, 0, 7); ctx.stroke(); line(proj.x + 34, proj.y + 69, proj.x + 39, proj.y + 74, '#7d7d92', 1.5);
    txt('8 items', proj.x + proj.w - 18, proj.y + 72, 14, '#8e8ea2', { fam: UI, w: 500, al: 'right' });
    rows.forEach((r, i) => {
      const ea = rowIn(t, P1, i); if (ea <= 0) return;
      const x = proj.x + (1 - ea) * -30;
      ctx.save(); ctx.globalAlpha *= ea; ctx.beginPath(); ctx.rect(proj.x, r.y, proj.w, r.h); ctx.clip();
      if (r.kind === 'bin') { binIcon(x + 18, r.y + 9, 26); txt(r.name, x + 58, r.y + 29, 18, '#e6e6ef', { fam: UI, w: 500 }); }
      else {
        if (r.i === 0) { ctx.fillStyle = 'rgba(140,108,255,.16)'; rr(proj.x + 6, r.y + 3, proj.w - 12, r.h - 6, 7); ctx.fill(); ctx.fillStyle = C.purple; rr(proj.x + 6, r.y + 3, 4, r.h - 6, 2); ctx.fill(); }
        seqIcon(x + 18, r.y + 15, 28);
        txt(r.s[0], x + 58, r.y + 26, 17, '#f0f0f8', { fam: UI, w: 600 });
        txt(r.s[1] + '  ·  30 fps', x + 58, r.y + 47, 14, '#9a9ab0', { fam: UI, w: 500 });
      }
      ctx.restore();
    });
    panel(mon, 'Program: ' + SEQS[0][0]);
    monitorBody(mon, '00:00:00:00', '#4aa3ff');
    panel(tl, SEQS[0][0]);
    txt('00:00:00:00', tl.x + 14, tl.y + 70, 20, '#4aa3ff', { fam: UI, w: 600 });
    const hw = VERT ? 118 : 140, rx = tl.x + hw, rw = tl.w - hw - 8;
    ctx.fillStyle = '#17171e'; ctx.fillRect(rx, tl.y + 46, rw, 30);
    for (let i = 0; i <= 24; i++) { const x = rx + i * rw / 24; line(x, tl.y + (i % 4 ? 66 : 56), x, tl.y + 76, '#5a5a6c', 1); }
    const names = ['V3', 'V2', 'V1', 'A1', 'A2', 'A3'], ty0 = tl.y + 84, lh = (tl.h - 92) / 6;
    names.forEach((n, i) => {
      const y = ty0 + i * lh + (i >= 3 ? 4 : 0), hh = lh - 6;
      ctx.fillStyle = '#22222b'; rr(tl.x + 8, y, hw - 14, hh, 5); ctx.fill();
      txt(n, tl.x + 22, y + hh / 2 + 5, 14, i >= 3 ? '#5fd3a5' : '#a993ff', { fam: UI, w: 700 });
      ctx.fillStyle = '#17171d'; ctx.fillRect(rx, y, rw, hh);
    });
    line(tl.x + 8, ty0 + 3 * lh - 1, tl.x + tl.w - 8, ty0 + 3 * lh - 1, '#3a3a48', 2);
    playhead(rx + 12, tl.y, tl.h);
    shellEnd(w, h);
  }
  function monitorBody(mon, tc, tcCol) {
    const fh = mon.h - 38 - 62, fw = fh * 16 / 9, fx = mon.x + (mon.w - fw) / 2, fy = mon.y + 48;
    ctx.fillStyle = '#000'; ctx.fillRect(fx, fy, fw, fh); ctx.strokeStyle = '#2c2c36'; ctx.lineWidth = 1; ctx.strokeRect(fx + .5, fy + .5, fw - 1, fh - 1);
    txt(tc, mon.x + 16, mon.y + mon.h - 20, 15, tcCol, { fam: UI, w: 600 });
    txt('Fit ⌄', mon.x + mon.w - 18, mon.y + mon.h - 20, 14, '#a0a0b4', { fam: UI, w: 500, al: 'right' });
    const tcx = mon.x + mon.w / 2, tcy = mon.y + mon.h - 25; ctx.fillStyle = '#c9c9d8';
    [-60, -30, 0, 30, 60].forEach((dx, i) => { ctx.beginPath(); if (i === 2) { ctx.moveTo(tcx - 6, tcy - 8); ctx.lineTo(tcx + 9, tcy); ctx.lineTo(tcx - 6, tcy + 8); } else { const d = i < 2 ? -1 : 1; ctx.moveTo(tcx + dx - 5 * d, tcy - 6); ctx.lineTo(tcx + dx + 5 * d, tcy); ctx.lineTo(tcx + dx - 5 * d, tcy + 6); } ctx.closePath(); ctx.fill(); });
  }
  function playhead(phx, ty, th) {
    line(phx, ty + 50, phx, ty + th - 8, '#4aa3ff', 2);
    ctx.fillStyle = '#4aa3ff'; ctx.beginPath(); ctx.moveTo(phx - 8, ty + 48); ctx.lineTo(phx + 8, ty + 48); ctx.lineTo(phx + 8, ty + 58); ctx.lineTo(phx, ty + 66); ctx.lineTo(phx - 8, ty + 58); ctx.closePath(); ctx.fill();
  }
  function drawAE(w, h, t) {
    shell(w, h, 'After Effects', FOLDER + '.aep', ['File', 'Edit', 'Composition', 'Layer', 'Effect', 'Animation', 'View', 'Window', 'Help']);
    const { proj, mon, tl, rows } = AG, acc = '#5b82ff';
    panel(proj, 'Project', acc);
    // info for the open comp (true to the tool: 1920 × 1080, 30 s, 30 fps)
    const ia = rowIn(t, P2, 0);
    ctx.save(); ctx.globalAlpha *= ia;
    ctx.fillStyle = '#000'; rr(proj.x + 14, proj.y + 52, 84, 48, 4); ctx.fill(); ctx.strokeStyle = '#33334a'; ctx.stroke();
    txt(SEQS[0][0] + ' ▾', proj.x + 112, proj.y + 66, 15, '#f0f0f8', { fam: UI, w: 600 });
    txt('1920 × 1080 (1.00)', proj.x + 112, proj.y + 86, 13, '#a8a8bc', { fam: UI, w: 500 });
    txt('Δ 0:00:30:00, 30.00 fps', proj.x + 112, proj.y + 104, 13, '#a8a8bc', { fam: UI, w: 500 });
    ctx.restore();
    ctx.fillStyle = '#22222b'; ctx.fillRect(proj.x + 6, proj.y + 118, proj.w - 12, 26); txt('Name', proj.x + 44, proj.y + 136, 13, '#9a9ab0', { fam: UI, w: 600 });
    rows.forEach((r, i) => {
      const ea = rowIn(t, P2, i + 1); if (ea <= 0) return;
      const ind = r.kind === 'comp' ? 30 : 0, x = proj.x + ind + (1 - ea) * -30;
      ctx.save(); ctx.globalAlpha *= ea; ctx.beginPath(); ctx.rect(proj.x, r.y, proj.w, r.h); ctx.clip();
      if (r.kind === 'fold') {
        ctx.fillStyle = '#9a9ab0'; ctx.beginPath();
        if (r.open) { ctx.moveTo(x + 14, r.y + 15); ctx.lineTo(x + 24, r.y + 15); ctx.lineTo(x + 19, r.y + 22); } else { ctx.moveTo(x + 15, r.y + 13); ctx.lineTo(x + 21, r.y + 19); ctx.lineTo(x + 15, r.y + 25); }
        ctx.closePath(); ctx.fill();
        binIcon(x + 32, r.y + 7, 24); txt(r.name, x + 66, r.y + 26, 17, '#e6e6ef', { fam: UI, w: 500 });
      } else {
        if (r.i === 0) { ctx.fillStyle = 'rgba(91,130,255,.18)'; rr(proj.x + 6, r.y + 2, proj.w - 12, r.h - 4, 6); ctx.fill(); ctx.fillStyle = acc; rr(proj.x + 6, r.y + 2, 4, r.h - 4, 2); ctx.fill(); }
        compIcon(x + 32, r.y + 8, 24); txt(r.s[0], x + 66, r.y + 26, 16, '#f0f0f8', { fam: UI, w: 600 });
      }
      ctx.restore();
    });
    panel(mon, 'Composition: ' + SEQS[0][0], acc);
    monitorBody(mon, '0:00:00:00', '#6f9bff');
    panel(tl, SEQS[0][0], acc);
    txt('0:00:00:00', tl.x + 14, tl.y + 70, 20, '#6f9bff', { fam: UI, w: 600 });
    txt('00000 (30.00 fps)', tl.x + 14, tl.y + 90, 12, '#8e8ea2', { fam: UI, w: 500 });
    const hw = VERT ? 150 : 190, rx = tl.x + hw, rw = tl.w - hw - 8;
    ctx.fillStyle = '#17171e'; ctx.fillRect(rx, tl.y + 46, rw, 30);
    for (let i = 0; i <= 30; i++) { const x = rx + 10 + i * (rw - 24) / 30; line(x, tl.y + (i % 5 ? 68 : 60), x, tl.y + 76, '#5a5a6c', 1); if (i % 5 === 0 && (!VERT || i % 10 === 0)) txt((i < 10 ? '0' : '') + i + 's', x, tl.y + 58, 11, '#9a9ab0', { fam: UI, w: 600, al: 'center' }); }
    ctx.fillStyle = '#22222b'; ctx.fillRect(tl.x + 8, tl.y + 100, hw - 14, 24); txt('Source Name', tl.x + 18, tl.y + 117, 12, '#9a9ab0', { fam: UI, w: 600 });
    ctx.fillStyle = '#17171d'; ctx.fillRect(rx, tl.y + 84, rw, tl.h - 92);
    // the work-area bar spans the whole 30 s
    ctx.fillStyle = 'rgba(91,130,255,.35)'; rr(rx + 10, tl.y + 78, rw - 24, 5, 2); ctx.fill();
    playhead(rx + 10, tl.y, tl.h);
    shellEnd(w, h);
  }
  // editor placement: grows out of the new file's icon, then sits in the window area
  function edXf(t, S) {
    if (t >= S.edGrow[1]) return { s: ED.s, x: ED.x, y: ED.y };
    const cam = camAt(t, S.FIXCAM), ic = camMap(cam, S.icoC.x, S.icoC.y), icoW = 30 * EX.s * cam.s;
    const e = eio(seg(t, S.edGrow[0], S.edGrow[1])), s0 = icoW / EDW;
    const s = Math.exp(lerp(Math.log(s0), Math.log(ED.s), e));
    const fcx = ED.x + EDW * ED.s / 2, fcy = ED.y + EDH * ED.s / 2, cx = lerp(ic.x, fcx, e), cy = lerp(ic.y, fcy, e);
    return { s, x: cx - EDW * s / 2, y: cy - EDH * s / 2, cs: cam.s };
  }
  const edToScreen = (x, y) => ({ x: ED.x + x * ED.s, y: ED.y + y * ED.s });
  const DG = exGeo(DLW, DLH, true);
  const dlToScreen = (x, y) => ({ x: DL.x + x * DL.s, y: DL.y + y * DL.s });
  const aC = dlToScreen(DG.addr.x + DG.addr.w / 2, DG.addr.y + (VERT ? 150 : 130));
  [[P1, EG], [P2, AG]].forEach(([S, G]) => {
    const pc = edToScreen(G.proj.x + G.proj.w / 2, (G.listTop + G.listBot) / 2);
    S.WORKCAM = [{ t0: S.zoomP[0], t1: S.zoomP[1], cx: pc.x, cy: pc.y, s: S === P1 ? (VERT ? 2.0 : 1.55) : (VERT ? 1.75 : 1.4) }];
    if (S.zoomPout) S.WORKCAM.push({ t0: S.zoomPout[0], t1: S.zoomPout[1], cx: RC.x, cy: RC.y, s: 1 });
    if (S.zoomA) S.WORKCAM.push({ t0: S.zoomA[0], t1: S.zoomA[1], cx: aC.x, cy: aC.y, s: VERT ? 1.75 : 1.6 });
  });
  // the three frame shapes (Premiere part)
  const SHL = VERT ? { lab: 26 } : { cy: 560, H0: 420, gap: 90, lab: 30 };
  const SHT = VERT ? (() => {
    const tw0 = 740, th = tw0 * 9 / 16, bh = 318, w1 = bh * 9 / 16, w2 = bh * 4 / 5, gap = 100, x0 = (W - w1 - w2 - gap) / 2, y0 = 322, y1 = y0 + th + 100;
    return [{ x: (W - tw0) / 2, y: y0, w: tw0, h: th }, { x: x0, y: y1, w: w1, h: bh }, { x: x0 + w1 + gap, y: y1, w: w2, h: bh }];
  })() : (() => { const ws = SEQS.map(s => SHL.H0 * s[2]), tot = ws.reduce((a, b) => a + b, 0) + SHL.gap * 2; let x = (W - tot) / 2; return ws.map(w => { const r = { x, y: SHL.cy - SHL.H0 / 2, w, h: SHL.H0 }; x += w + SHL.gap; return r; }); })();
  const SORD = VERT ? [0, 2, 1] : [2, 1, 0];
  const shapeIn = (t, i) => { const d = SORD.indexOf(i) * .16; return eio(seg(t, P1.shapes0 + d, P1.shapes0 + d + .7)); };
  const shapeOut = (t, i) => eio(seg(t, P1.shapesBack + i * .08, P1.shapesBack + i * .08 + .45));
  function drawShapes(t, cam) {
    const pr = [0, 1, 2].map(i => shapeIn(t, i) * (1 - shapeOut(t, i))), mx = Math.max(...pr); if (mx <= 0) return;
    ctx.fillStyle = `rgba(9,7,22,${.8 * clamp(mx * 1.6)})`; ctx.fillRect(0, 0, W, H);
    SEQS.forEach((s, i) => {
      const p = shapeIn(t, i), q = shapeOut(t, i); if (p <= 0 || q >= 1) return;
      const row = EG.rows[5 + i], a = camMap(cam, ED.x + (EG.proj.x + 8) * ED.s, ED.y + row.y * ED.s), b = camMap(cam, ED.x + (EG.proj.x + EG.proj.w - 8) * ED.s, ED.y + (row.y + row.h) * ED.s);
      let r = lerpR({ x: a.x, y: a.y, w: b.x - a.x, h: b.y - a.y }, SHT[i], p);
      if (q > 0) { const k = 1 - .1 * q; r = { x: r.x + r.w * (1 - k) / 2, y: r.y + r.h * (1 - k) / 2 + q * 70, w: r.w * k, h: r.h * k }; }
      const al = clamp(p * 4) * (1 - q), ta = seg(p, .62, 1);
      ctx.save(); const A0 = ctx.globalAlpha; ctx.globalAlpha *= al;
      ctx.shadowColor = 'rgba(120,90,255,.45)'; ctx.shadowBlur = 40 * p;
      const g = ctx.createLinearGradient(r.x, r.y, r.x + r.w, r.y + r.h); g.addColorStop(0, '#2c2166'); g.addColorStop(1, '#130f2e');
      ctx.fillStyle = g; rr(r.x, r.y, r.w, r.h, 14 * p + 4); ctx.fill(); ctx.shadowColor = 'transparent';
      ctx.strokeStyle = '#a58cff'; ctx.lineWidth = 3; ctx.stroke();
      ctx.save(); rr(r.x, r.y, r.w, r.h, 14 * p + 4); ctx.clip();
      ctx.globalAlpha = A0 * al * ta * .5; for (let k = 1; k < 3; k++) { line(r.x + r.w * k / 3, r.y, r.x + r.w * k / 3, r.y + r.h, 'rgba(255,255,255,.18)', 1); line(r.x, r.y + r.h * k / 3, r.x + r.w, r.y + r.h * k / 3, 'rgba(255,255,255,.18)', 1); }
      ctx.restore();
      ctx.globalAlpha = A0 * al * ta; const c = Math.min(r.w, r.h) * .12;
      [[0, 0, 1, 1], [1, 0, -1, 1], [0, 1, 1, -1], [1, 1, -1, -1]].forEach(([u, v, dx, dy]) => { const x = r.x + u * r.w + dx * 14, y = r.y + v * r.h + dy * 14; ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y + dy * c); ctx.lineTo(x, y); ctx.lineTo(x + dx * c, y); ctx.stroke(); });
      const cx = r.x + r.w / 2, cy = r.y + r.h / 2, n1 = Math.min(24, r.w * .11), n2 = Math.min(46, r.w * .2);
      txt(FOLDER, cx, cy - n2 * .35, n1, '#cfc6f5', { fam: UI, w: 500, al: 'center' });
      txt(s[3], cx, cy + n2 * .75, n2, '#ffffff', { fam: UI, w: 800, al: 'center' });
      const ly = r.y + r.h;
      txt(s[1], cx, ly + SHL.lab * 1.75, SHL.lab, '#fff', { fam: UI, w: 700, al: 'center' });
      ctx.save(); ctx.translate(cx, ly + SHL.lab * 3.15); pill(0, 0, '30 fps', SHL.lab * .62, '#120c2c', C.purple2, { fam: UI, w: 700 }); ctx.restore();
      ctx.restore();
    });
  }
  function keycap(x, y, w, h, label, pressAmt, sz) {
    const d = 12 * (1 - pressAmt * .7), yy = y + (12 - d);
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 14;
    ctx.fillStyle = '#9b97b4'; rr(x, yy, w, h, 22); ctx.fill(); ctx.restore();
    const g = ctx.createLinearGradient(0, yy - d, 0, yy - d + h); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#dcd9ea');
    ctx.fillStyle = g; rr(x, yy - d, w, h, 22); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 2; rr(x + 3, yy - d + 3, w - 6, h - 6, 19); ctx.stroke();
    txt(label, x + w / 2, yy - d + h / 2 + sz * .36, sz, '#1a1530', { fam: UI, w: 700, al: 'center' });
  }
  function drawKeys(t, S) {
    const a = seg(t, S.keys, S.keys + .42), b = seg(t, S.dlg[0] + .02, S.dlg[0] + .3); if (a <= 0 || b >= 1) return;
    const s = eback(a) * (1 - eio(b) * .7), k = VERT ? .9 : 1, pr = press(t, S.press + .03);
    ctx.save(); ctx.globalAlpha *= clamp(a * 3) * (1 - b); ctx.translate(RC.x, RC.y - 10); ctx.scale(s * k, s * k);
    keycap(-260, -70, 230, 140, 'Ctrl', pr, 54); txt('+', 0, 24, 70, '#fff', { fam: UI, w: 700, al: 'center' }); keycap(60, -70, 150, 140, 'I', pr, 60);
    ctx.restore();
  }
  function drawDialog(t, S) {
    const a = seg(t, S.dlg[0], S.dlg[1]); if (a <= 0) return;
    const e = eo5(a), s = lerp(.28, 1, e), fcx = DL.x + DLW * DL.s / 2, fcy = DL.y + DLH * DL.s / 2, cx = lerp(RC.x, fcx, e), cy = lerp(RC.y - 10, fcy, e);
    ctx.save(); ctx.globalAlpha *= clamp(a * 2.6); ctx.translate(cx, cy); ctx.scale(DL.s * s, DL.s * s); ctx.translate(-DLW / 2, -DLH / 2);
    const ae = S.kind === 'ae';
    const G = drawExplorer(DLW, DLH, { dialog: true, app: S.kind, title: ae ? 'Import File' : 'Import', insP: 1, insA: ae ? 1 : 0 });
    const A = G.addr, hl = eo(seg(t, S.hl, S.hl + .35));
    if (hl > 0) {
      ctx.save(); ctx.shadowColor = rgba(C.green, .8); ctx.shadowBlur = 18 * hl; ctx.strokeStyle = rgba('#14c98a', hl); ctx.lineWidth = 3.5;
      const g = 8 * (1 - hl) + 3; rr(A.x - g, A.y - g, A.w + g * 2, A.h + g * 2, 10); ctx.stroke(); ctx.restore();
      const ca = seg(t, S.hl + .18, S.hl + .48), cs = eback(ca), bx = A.x + A.w - 22, by = A.y + A.h / 2;
      if (ca > 0) { ctx.save(); ctx.translate(bx, by); ctx.scale(cs, cs); ctx.fillStyle = '#14c98a'; ctx.beginPath(); ctx.arc(0, 0, 15, 0, 7); ctx.fill(); checkMark(0, 1, 22, eo(seg(t, S.hl + .3, S.hl + .55)), '#fff', 3.4); ctx.restore(); }
    }
    ctx.restore();
  }
  let inLayer = false; const LAYER = document.createElement('canvas');
  function drawWork(t, S) {
    if (t < S.edGrow[0] || t > S.out[1]) return;
    const eOut = seg(t, S.out[0], S.out[1]), wal = 1 - eio(eOut), wsc = 1 - .14 * eio(eOut);
    // while the whole layer fades out, draw it on its own canvas first, so the dialog never shows the editor through it
    if (eOut > 0 && !inLayer) {
      const main = ctx, cv = main.canvas, L = LAYER;
      if (L.width !== cv.width || L.height !== cv.height) { L.width = cv.width; L.height = cv.height; }
      const lc = L.getContext('2d'); lc.setTransform(1, 0, 0, 1, 0, 0); lc.clearRect(0, 0, L.width, L.height); lc.setTransform(main.getTransform());
      ctx = lc; inLayer = true; drawWork(t, S); inLayer = false; ctx = main;
      main.save(); main.setTransform(1, 0, 0, 1, 0, 0); main.globalAlpha *= wal; main.drawImage(L, 0, 0); main.restore();
      return;
    }
    const cam = camAt(t, S.WORKCAM), xf = edXf(t, S);
    ctx.save(); ctx.globalAlpha *= (inLayer ? 1 : wal) * seg(t, S.edIn[0], S.edIn[1]);
    ctx.translate(RC.x, RC.y); ctx.scale(wsc, wsc); ctx.translate(-RC.x, -RC.y);
    ctx.save(); camApply(cam); ctx.translate(xf.x, xf.y); ctx.scale(xf.s, xf.s);
    S.kind === 'ae' ? drawAE(EDW, EDH, t) : drawEditor(EDW, EDH, t);
    const og = 1 - seg(t, S.edGrow[1] - .4, S.edGrow[1] + .1), oc = S.kind === 'ae' ? '#7fa8ff' : '#a58cff';   // a coloured edge while the window is still small: it opens out of the icon
    if (og > 0) { ctx.save(); ctx.shadowColor = rgba(oc, .9 * og); ctx.shadowBlur = 24; ctx.strokeStyle = rgba(oc, og); ctx.lineWidth = 3 / (xf.s * cam.s); rr(0, 0, EDW, EDH, 14); ctx.stroke(); ctx.restore(); }
    ctx.restore();
    if (S.dlg) {   // Ctrl+I: only in the second part
      const da = eo(seg(t, S.dlg[0], S.dlg[1]));
      if (da > 0) { ctx.fillStyle = `rgba(8,6,20,${.55 * da})`; ctx.fillRect(-W, -H, W * 3, H * 3); }
      ctx.save(); camApply(cam); drawKeys(t, S); drawDialog(t, S); ctx.restore();
    }
    ctx.restore();
  }

  // ───────────────────────── end card ─────────────────────────
  const EL = VERT
    ? { pre: 320, big: 510, bigSz: 176, pill: 612, pillSz: 30, chips: [[0, 722], [1, 722], [2, 810], [3, 810]], chipSz: 28, cta: 920, ctaW: 940, ctaH: 190, foot: 1196 }
    : { pre: 230, big: 420, bigSz: 190, pill: 520, pillSz: 34, chips: [[0, 636], [1, 636], [2, 636], [3, 636]], chipSz: 28, cta: 772, ctaW: 1000, ctaH: 190, foot: 1036 };
  const CHIPS = ['.prproj / .aep file', 'Bins & folders', '16X9 · 9X16 · 4X5 · 30 fps', 'Ctrl+I → this folder'];
  function drawEnd(t) {
    if (t < P2.out[0] + .2) return;
    const pa = eo(seg(t, T.end - .1, T.end + .4));
    ctx.save(); ctx.globalAlpha *= pa;
    const pre = [['New ', C.mut], ['Premiere Pro', C.purple2], [' / ', C.mut], ['After Effects', C.blue2], [' project in', C.mut]], psz = VERT ? 42 : 48;
    parts(pre, W / 2, EL.pre - (1 - pa) * 30, Math.min(psz, psz * (W - 120) / partsW(pre, psz, 600, BN)), 600, BN);
    ctx.restore();
    const ba = seg(t, T.end, T.end + .6);
    if (ba > 0) {
      const s = lerp(.78, 1, eback(ba));
      ctx.save(); ctx.globalAlpha *= clamp(ba * 2.5); ctx.translate(W / 2, EL.big - EL.bigSz * .32); ctx.scale(s, s);
      const ps = [['just ', '#fff'], ['2 clicks', C.green]], sz = Math.min(EL.bigSz, EL.bigSz * (W - 100) / partsW(ps, EL.bigSz, 800, BN));
      ctx.shadowColor = 'rgba(46,230,160,.35)'; ctx.shadowBlur = 50; parts(ps, 0, sz * .34, sz, 800, BN); ctx.shadowColor = 'transparent';
      ctx.restore();
    }
    const la = eo(seg(t, T.end + .4, T.end + .85));
    if (la > 0) {
      ctx.save(); ctx.globalAlpha *= la; ctx.translate(0, (1 - la) * 26);
      const ps = [['① Right-click   →   ② ', '#e9e6ff'], ['New … project here', '#ffffff']];
      const sz = Math.min(EL.pillSz, EL.pillSz * (W - 140) / partsW(ps, EL.pillSz, 600, BN)), pw = partsW(ps, sz, 600, BN) + sz * 1.6, ph = sz * 2;
      ctx.fillStyle = 'rgba(140,108,255,.2)'; rr(W / 2 - pw / 2, EL.pill - ph / 2, pw, ph, ph / 2); ctx.fill(); ctx.strokeStyle = 'rgba(185,165,255,.55)'; ctx.lineWidth = 2; ctx.stroke();
      parts(ps, W / 2, EL.pill + sz * .36, sz, 600, BN);
      ctx.restore();
    }
    const cw = CHIPS.map(c => tw(c, EL.chipSz, 600) + EL.chipSz * 2.6), gap = 18;
    const rowsX = {}; EL.chips.forEach(([i, y]) => { (rowsX[y] = rowsX[y] || []).push(i); });
    Object.entries(rowsX).forEach(([y, ids]) => {
      const tot = ids.reduce((a, i) => a + cw[i], 0) + gap * (ids.length - 1); let x = W / 2 - tot / 2;
      ids.forEach(i => {
        const a = seg(t, T.chips + i * .12, T.chips + i * .12 + .4);
        if (a > 0) {
          const s = lerp(.6, 1, eback(a)), cx = x + cw[i] / 2, h = EL.chipSz * 2;
          ctx.save(); ctx.globalAlpha *= clamp(a * 2.5); ctx.translate(cx, +y); ctx.scale(s, s);
          ctx.fillStyle = 'rgba(18,15,40,.85)'; rr(-cw[i] / 2, -h / 2, cw[i], h, h / 2); ctx.fill(); ctx.strokeStyle = 'rgba(46,230,160,.45)'; ctx.lineWidth = 2; ctx.stroke();
          ctx.fillStyle = C.green; ctx.beginPath(); ctx.arc(-cw[i] / 2 + h / 2, 0, h * .3, 0, 7); ctx.fill(); checkMark(-cw[i] / 2 + h / 2, 1, h * .42, 1, '#0b1a14', 3);
          txt(CHIPS[i], -cw[i] / 2 + h * .95, EL.chipSz * .36, EL.chipSz, '#fff', { w: 600 });
          ctx.restore();
        }
        x += cw[i] + gap;
      });
    });
    const ca = seg(t, T.cta[0], T.cta[1]);
    if (ca > 0) {
      const e = eo5(ca), y = lerp(H + 40, EL.cta, e), pulse = t > T.cta[1] ? 1 + .014 * Math.sin((t - T.cta[1]) * 4.2) : 1;
      const w = EL.ctaW, h = EL.ctaH;
      ctx.save(); ctx.translate(W / 2, y + h / 2); ctx.scale(pulse, pulse);
      ctx.shadowColor = 'rgba(124,92,255,.55)'; ctx.shadowBlur = 60; ctx.shadowOffsetY = 10;
      const g = ctx.createLinearGradient(-w / 2, 0, w / 2, 0); g.addColorStop(0, '#6a43ff'); g.addColorStop(1, '#13b884');
      ctx.fillStyle = g; rr(-w / 2, -h / 2, w, h, 34); ctx.fill(); ctx.shadowColor = 'transparent';
      ctx.fillStyle = 'rgba(12,9,30,.9)'; rr(-w / 2 + 4, -h / 2 + 4, w - 8, h - 8, 31); ctx.fill();
      const ix = -w / 2 + 100; ctx.fillStyle = 'rgba(46,230,160,.14)'; ctx.beginPath(); ctx.arc(ix, 0, 58, 0, 7); ctx.fill();
      downloadIcon(ix, 0, 64, C.green);
      const tx = ix + 90, avail = w / 2 - tx - 34, m1 = 'Get it on GitHub', m2 = LINK;
      const sz1 = Math.min(VERT ? 52 : 56, avail / tw(m1, 56, 800, UI) * 56), sz2 = Math.min(VERT ? 34 : 36, avail / tw(m2, 36, 700, UI) * 36);
      txt(m1, tx, -10, sz1, '#fff', { w: 800, fam: UI });
      txt(m2, tx, 46, sz2, C.green, { w: 700, fam: UI });
      ctx.restore();
    }
    const fa = eo(seg(t, T.cta[1] + .1, T.cta[1] + .6));
    if (fa > 0) { ctx.save(); ctx.globalAlpha *= fa * .85; txt('Windows 10 / 11  ·  Premiere Pro  ·  After Effects', W / 2, EL.foot, 26, C.mut, { fam: UI, w: 500, al: 'center' }); ctx.restore(); }
  }

  // ───────────────────────── frame ─────────────────────────
  function frame(c, t, opt = {}) {
    ctx = c;
    if (!opt.noBg) background(t);
    if (t < T.push1) { const p = eio(seg(t, T.push0, T.push1)); ctx.save(); ctx.translate(-p * W, 0); drawPain(t); ctx.restore(); }
    ctx.save(); if (!opt.clean) clipWin();
    if (t > P1.in[0] && t < P1.dive[1]) drawFix(t, P1);
    drawWork(t, P1);
    if (t > P2.in[0] && t < P2.dive[1]) drawFix(t, P2);
    drawWork(t, P2);
    ctx.restore();
    if (!opt.clean) { topBand(t); HEADS.forEach(h => drawHead(t, h)); }
    drawEnd(t);
    if (!opt.noVignette) vignette();
  }

  // ───────────────────────── sound (synthesized: clicks, whooshes, thumps; no chimes) ─────────────────────────
  function rng(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  async function synth() {
    const sr = 44100, ac = new OfflineAudioContext(2, Math.ceil(sr * DUR), sr), R = rng(11);
    const noise = ac.createBuffer(1, sr * 2, sr); { const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = R() * 2 - 1; }
    const master = ac.createGain(), comp = ac.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 3.5; comp.attack.value = .004; comp.release.value = .22;
    master.connect(comp).connect(ac.destination);
    master.gain.setValueAtTime(0, 0); master.gain.linearRampToValueAtTime(1, .05); master.gain.setValueAtTime(1, DUR - .7); master.gain.linearRampToValueAtTime(0, DUR);
    const irLen = sr * 1.6, ir = ac.createBuffer(2, irLen, sr);
    for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < irLen; i++) d[i] = (R() * 2 - 1) * Math.pow(1 - i / irLen, 4); }
    const verb = ac.createConvolver(), wet = ac.createGain(); verb.buffer = ir; wet.gain.value = .22; verb.connect(wet).connect(master);
    const out = (node, send = .2, pan = 0) => { let n = node; if (pan) { const p = ac.createStereoPanner(); p.pan.value = pan; node.connect(p); n = p; } n.connect(master); if (send) { const s = ac.createGain(); s.gain.value = send; n.connect(s).connect(verb); } };
    const env = (g, t, a, peak, d) => { g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(1e-4, t + a + d); };
    const osc = (type, f, t, dur) => { const o = ac.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); o.start(t); o.stop(t + dur); return o; };
    const nsrc = (t, dur) => { const s = ac.createBufferSource(); s.buffer = noise; s.loop = true; s.start(t, R() * 1.5); s.stop(t + dur + .05); return s; };
    const filt = (type, f, q = .7) => { const b = ac.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; return b; };
    const swell = (param, t, keys) => {
      const Tt = keys[keys.length - 1][0], N = Math.max(16, Math.ceil(Tt * 400)), c = new Float32Array(N);
      for (let i = 0, k = 0; i < N; i++) { const u = i / (N - 1) * Tt; while (k < keys.length - 2 && u > keys[k + 1][0]) k++; const [ua, a] = keys[k], [ub, b] = keys[k + 1]; c[i] = a * Math.pow(b / a, clamp((u - ua) / (ub - ua))); }
      param.setValueAtTime(keys[0][1], 0); param.setValueCurveAtTime(c, t, Tt);
    };
    const at = t => Math.round(t * sr) / sr;
    const fx = {
      whoosh(t, d = .8, v = .4, pan = 1) {
        t = at(t); const s = nsrc(t, d), f = filt('bandpass', 250, 1.1), g = ac.createGain(), p = ac.createStereoPanner();
        f.frequency.setValueAtTime(260, t); f.frequency.exponentialRampToValueAtTime(2400, t + d * .6); f.frequency.exponentialRampToValueAtTime(420, t + d);
        swell(g.gain, t, [[0, 1e-4], [d * .6, v], [d, 1e-4]]);
        p.pan.setValueAtTime(-.6 * pan, t); p.pan.linearRampToValueAtTime(.6 * pan, t + d);
        s.connect(f).connect(g).connect(p); out(p, .35);
        const s2 = nsrc(t, d), f2 = filt('lowpass', 220), g2 = ac.createGain(); swell(g2.gain, t, [[0, 1e-4], [d * .55, v * .6], [d, 1e-4]]); s2.connect(f2).connect(g2); out(g2, .1);
      },
      thump(t, v = .5) {
        t = at(t); const o = osc('sine', 150, t, .34), g = ac.createGain(); o.frequency.exponentialRampToValueAtTime(46, t + .15); env(g, t, .002, v, .26); o.connect(g); out(g, .12);
        const s = nsrc(t, .1), f = filt('lowpass', 900), g2 = ac.createGain(); env(g2, t, .001, v * .4, .07); s.connect(f).connect(g2); out(g2, .2);
      },
      hit(t, v = .9) {
        t = at(t); const o = osc('sine', 120, t, 1.2), g = ac.createGain(); o.frequency.exponentialRampToValueAtTime(36, t + .5); env(g, t, .003, v, .9); o.connect(g); out(g, .25);
        const s = nsrc(t, .25), f = filt('lowpass', 2400), g2 = ac.createGain(); env(g2, t, .002, v * .45, .18); s.connect(f).connect(g2); out(g2, .35);
      },
      boom(t, v = .8) {
        fx.hit(t, v * .8); t = at(t);
        const o = osc('sine', 56, t, 2.2), g = ac.createGain(); o.frequency.exponentialRampToValueAtTime(28, t + 1.6); env(g, t, .01, v * .7, 1.9); o.connect(g); out(g, .1);
        const s = nsrc(t, 1.6), f = filt('lowpass', 480), g2 = ac.createGain(); env(g2, t, .01, v * .28, 1.4); s.connect(f).connect(g2); out(g2, .5);
      },
      soft(t, v = .5) {
        t = at(t); const t0 = Math.max(0, t - .2), lead = t - t0, s = nsrc(t0, lead + .5), f = filt('bandpass', 700, .8), g = ac.createGain();
        f.frequency.setValueAtTime(700, t0); f.frequency.exponentialRampToValueAtTime(260, t + .4);
        swell(g.gain, t0, [[0, 1e-4], [Math.max(.02, lead), v * .28], [lead + .38, 1e-4]]); s.connect(f).connect(g); out(g, .5);
        const o = osc('sine', 92, t, 1), g2 = ac.createGain(); o.frequency.exponentialRampToValueAtTime(48, t + .45); swell(g2.gain, t, [[0, 1e-4], [.025, v], [.95, 1e-4]]); o.connect(g2); out(g2, .4);
      },
      mclick(t, v = .5, pan = 0) {
        t = at(t);
        [[0, 1, 3800, 3, .014], [.07, .5, 2700, 2.5, .011]].forEach(([dt, a, fc, q, d]) => {
          const s = nsrc(t + dt, .05), f = filt('bandpass', fc, q), g = ac.createGain(); env(g, t + dt, .0006, v * a, d); s.connect(f).connect(g); out(g, .06, pan);
          const s2 = nsrc(t + dt, .05), f2 = filt('lowpass', 700), g2 = ac.createGain(); env(g2, t + dt, .0008, v * a * .8, .022); s2.connect(f2).connect(g2); out(g2, 0, pan);
        });
      },
      key(t, v = .55) {
        t = at(t); const o = osc('sine', 190, t, .14), g = ac.createGain(); o.frequency.exponentialRampToValueAtTime(85, t + .09); env(g, t, .001, v, .09); o.connect(g); out(g, .1);
        [[0, 1, 2200, .03], [.12, .55, 3000, .02]].forEach(([dt, a, fc, d]) => { const s = nsrc(t + dt, .06), f = filt('bandpass', fc, 1.6), g2 = ac.createGain(); env(g2, t + dt, .0008, v * a * .7, d); s.connect(f).connect(g2); out(g2, .08); });
      },
      tick(t, v = .12, pan = 0) { t = at(t); const s = nsrc(t, .05), f = filt('bandpass', 2200, 2), g = ac.createGain(); env(g, t, .0008, v, .025); s.connect(f).connect(g); out(g, .05, pan); },
      clock(t, v = .07) { t = at(t); const s = nsrc(t, .04), f = filt('bandpass', 1300, 4), g = ac.createGain(); env(g, t, .0006, v, .02); s.connect(f).connect(g); out(g, .1, .25); },
      riser(t, d = 1.2, v = .28) {
        t = at(t); const s = nsrc(t, d + .5), f = filt('highpass', 400), g = ac.createGain();
        f.frequency.setValueAtTime(400, t); f.frequency.exponentialRampToValueAtTime(6000, t + d);
        swell(g.gain, t, [[0, 1e-4], [d, v], [d + .4, 1e-4]]); s.connect(f).connect(g); out(g, .35);
        const o = osc('sawtooth', 70, t, d + .45), f2 = filt('lowpass', 260), g2 = ac.createGain(); o.frequency.exponentialRampToValueAtTime(210, t + d); f2.frequency.setValueAtTime(260, t); f2.frequency.exponentialRampToValueAtTime(1500, t + d);
        swell(g2.gain, t, [[0, 1e-4], [d, v * .3], [d + .4, 1e-4]]); o.connect(f2).connect(g2); out(g2, .25);
      }
    };
    // ── cues (on the picture beats) ──
    fx.whoosh(.05, .7, .3); fx.thump(.62, .45);
    for (let i = 0; i < 12; i++) { fx.whoosh(ST[i] - .05, .3, .08 + i * .005, -1); fx.mclick(ST[i] + .24, .4 + i * .01, .25); }
    for (let tt = .5; tt < 3.2; tt += .4) fx.clock(tt, .06);
    fx.riser(2.0, .9, .2); fx.hit(T.stamp + .22, .95);
    fx.whoosh(T.push0 - .05, .85, .5); fx.thump(T.push1 + .02, .35);
    [P1, P2].forEach(S => {
      fx.whoosh(S.curIn[0], .7, .12, -1);
      fx.mclick(S.rclick, .62); fx.whoosh(S.rclick + .03, .25, .1); fx.tick(S.hover, .09);
      fx.mclick(S.lclick, .62); fx.soft(S.ins[0] + .12, .5);
      fx.riser(S.dive[0] - .45, .5, .18); fx.whoosh(S.dive[0] + .03, .75, .5); fx.soft(S.edGrow[1] - .02, .6); fx.thump(S.edGrow[1], .4);
      const n = S.kind === 'ae' ? 10 : 8;
      for (let i = 0; i < n; i++) fx.tick(S.rows0 + i * S.rowStep + .14, .1, (i % 2 ? .2 : -.2));
      if (S.keys) { fx.thump(S.keys + .22, .42); fx.key(S.press + .02, .6); fx.whoosh(S.dlg[0] - .02, .5, .25); fx.mclick(S.hl + .2, .4); }
    });
    fx.whoosh(P1.out[0], .7, .3, -1); fx.thump(P2.in[1] - .05, .35);   // the Premiere window leaves, the folder comes back   // the Premiere window leaves, the folder comes back
    fx.riser(T.end - 1.4, 1.3, .28); fx.boom(T.end + .12, .8);
    for (let i = 0; i < 4; i++) fx.tick(T.chips + i * .12 + .08, .13);
    fx.whoosh(T.cta[0] - .1, .7, .3); fx.thump(T.cta[0] + .5, .48);
    // ── bed: a low tension drone under the long way, then a soft groove ──
    { const o = osc('sawtooth', 55, 0, 6.6), o2 = osc('sawtooth', 55 * 1.5 * 1.003, 0, 6.6), f = filt('lowpass', 260, .6), g = ac.createGain();
      f.frequency.setValueAtTime(220, 0); f.frequency.linearRampToValueAtTime(700, 5.4); f.frequency.linearRampToValueAtTime(200, 6.4);
      g.gain.setValueAtTime(0, 0); g.gain.linearRampToValueAtTime(.05, 1); g.gain.linearRampToValueAtTime(.08, 5.3); g.gain.linearRampToValueAtTime(0, 6.5); o.connect(f); o2.connect(f); f.connect(g); out(g, .2); }
    const beat = 60 / 112, roots = [55, 43.65, 65.41, 49];
    const gaps = [[P1.dive[0] - .1, P1.edGrow[1] - .05], [P2.dive[0] - .1, P2.edGrow[1] - .05], [T.end - 1.6, T.end + .05]];
    for (let t = T.push1; t < DUR - .6; t += beat) {
      if (gaps.some(([a, b]) => t > a && t < b)) continue;
      const tt = at(t), bi = Math.round((t - T.push1) / beat), f0 = roots[Math.floor(bi / 4) % 4];
      const k = osc('sine', 140, tt, .4), kg = ac.createGain(); k.frequency.exponentialRampToValueAtTime(42, tt + .12); env(kg, tt, .002, .17, .3); k.connect(kg); out(kg, 0);
      const b = osc('sine', f0, tt, beat), bg = ac.createGain(); env(bg, tt + .01, .01, .11, beat * .8); b.connect(bg); out(bg, 0);
      if (t > P1.rows0) { const h = nsrc(tt + beat / 2, .05), hf = filt('highpass', 7500), hg = ac.createGain(); env(hg, tt + beat / 2, .001, .035, .03); h.connect(hf).connect(hg); out(hg, .05, .2); }
    }
    const buf = await ac.startRendering();
    const chs = [0, 1].map(c => buf.getChannelData(c));
    let peak = 0; for (const d of chs) for (let i = 0; i < d.length; i++) peak = Math.max(peak, Math.abs(d[i]));
    const k = peak ? .89 / peak : 1; for (const d of chs) for (let i = 0; i < d.length; i++) d[i] *= k;
    return URL.createObjectURL(wav(buf));
  }
  function wav(buf) {
    const ch = buf.numberOfChannels, n = buf.length, dv = new DataView(new ArrayBuffer(44 + n * ch * 2));
    const w = (o, s) => { for (let i = 0; i < s.length; i++) dv.setUint8(o + i, s.charCodeAt(i)); };
    w(0, 'RIFF'); dv.setUint32(4, 36 + n * ch * 2, true); w(8, 'WAVE'); w(12, 'fmt '); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true);
    dv.setUint16(22, ch, true); dv.setUint32(24, buf.sampleRate, true); dv.setUint32(28, buf.sampleRate * ch * 2, true); dv.setUint16(32, ch * 2, true);
    dv.setUint16(34, 16, true); w(36, 'data'); dv.setUint32(40, n * ch * 2, true);
    const data = []; for (let c = 0; c < ch; c++) data.push(buf.getChannelData(c));
    let o = 44; for (let i = 0; i < n; i++) for (let c = 0; c < ch; c++) { const s = Math.max(-1, Math.min(1, data[c][i])); dv.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7FFF, true); o += 2; }
    return new Blob([dv], { type: 'audio/wav' });
  }

  // drawing helpers for other pages (thumbnails): ui.use(ctx) first
  const ui = { use: c => { ctx = c; }, appBadge, pill, parts, partsW, txt, tw, rr, cursor, checkMark, downloadIcon, background, vignette, C, BN, UI };
  return { T, P1, P2, ST, frame, synth, W, H, VERT, DUR, FPS, LINK, ui };
 }
  window.makeFilm = makeFilm;
  window.FILM_FONTS = async () => {
    const fonts = ['400 20px Inter', '500 20px Inter', '600 20px Inter', '700 20px Inter', '800 20px Inter'];
    try { await Promise.race([Promise.all(fonts.map(f => document.fonts.load(f, 'Aa 12'))), new Promise(r => setTimeout(r, 4000))]); } catch (e) {}
  };
  // the video page: one film in the player (a page that sets window.FILM_ONLY = true uses makeFilm itself)
  if (!window.FILM_ONLY) {
    const QS = new URLSearchParams(location.search), film = makeFilm(/^(45|4x5|4:5|v)$/i.test(QS.get('ar') || ''));
    window.__film = film;
    Player({ title: 'New Premiere Pro / After Effects project here', W: film.W, H: film.H, DUR: film.DUR, FPS: film.FPS, VERT: film.VERT, setup: window.FILM_FONTS, draw: film.frame, sound: film.synth });
  }
})();
