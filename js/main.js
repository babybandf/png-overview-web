/* ============================================================
   PNG Overview · 互动讲义 main.js
   所有演示数据均取自真实文件 demo-sub-multi-idat.png
   ============================================================ */
"use strict";

const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------------- 真实 PNG 数据（tools/verify-png-demo.js 同源校验） ---------------- */
const PNG = {
  name: "demo-sub-multi-idat.png",
  size: 1204, width: 32, height: 32,
  signature: ["89", "50", "4E", "47", "0D", "0A", "1A", "0A"],
  ihdr: {
    hex: "00 00 00 20 00 00 00 20 08 02 00 00 00".split(" "),
    crc: "FC 18 ED A3".split(" "),
  },
  chunks: [
    { id: "sig", label: "Signature", size: 8, off: 0, cls: "sig" },
    { id: "ihdr", label: "IHDR", size: 25, off: 8, cls: "ihdr" },
    { id: "idat1", label: "IDAT #1", size: 386, off: 33, cls: "idat" },
    { id: "idat2", label: "IDAT #2", size: 386, off: 419, cls: "idat" },
    { id: "idat3", label: "IDAT #3", size: 387, off: 805, cls: "idat" },
    { id: "iend", label: "IEND", size: 12, off: 1192, cls: "iend" },
  ],
  // 第 0 行（Sub）：filter type = 1，每像素 3 字节，共 11 像素
  sub: {
    filter: 1,
    filtered: [255, 0, 8, 0, 8, 7, 0, 8, 8, 0, 8, 8, 0, 8, 8, 0, 9, 8, 0, 8, 8, 0, 8, 8, 0, 8, 8, 0, 9, 8, 0, 8, 8],
    recon:    [255, 0, 8, 255, 8, 15, 255, 16, 23, 255, 24, 31, 255, 32, 39, 255, 41, 47, 255, 49, 55, 255, 57, 63, 255, 65, 71, 255, 74, 79, 255, 82, 87],
  },
  // f02n2c08.png 第 1 行（Up）：filter type = 2；upRecon 为其第 0 行已重建数据
  up: {
    filter: 2,
    upRecon:  [255, 0, 8, 255, 8, 15, 255, 16, 23, 255, 24, 31, 255, 32, 39, 255, 41, 47, 255, 49, 55, 255, 57, 63, 255, 65, 71, 255, 74, 79, 255, 82, 87],
    filtered: [239, 29, 255, 0, 23, 249, 0, 22, 248, 0, 21, 248, 0, 20, 248, 0, 18, 248, 0, 18, 248, 0, 17, 248, 0, 16, 248, 0, 14, 248, 0, 14, 248],
    recon:    [238, 29, 7, 255, 31, 8, 255, 38, 15, 255, 45, 23, 255, 52, 31, 255, 59, 39, 255, 67, 47, 255, 74, 55, 255, 81, 63, 255, 88, 71, 255, 96, 79],
  },
  anchorByte: 25, // 像素 8 的 G 通道（讲义锚点）
};

const CHUNK_DETAIL = {
  sig: {
    title: "PNG Signature", tag: "8 bytes · offset 0–7",
    fields: [
      ["内容", "89 50 4E 47 0D 0A 1A 0A"],
      ["0x89", "最高位置 1 —— 可检测文件是否被按 7-bit 通道传输"],
      ["50 4E 47", "ASCII \"PNG\""],
      ["0D 0A 1A 0A", "CRLF + DOS EOF + LF —— 可检测换行符被转换"],
    ],
    note: "Signature 不是 Chunk，任何 PNG 解码器首先校验这 8 个字节。",
    hex: [{ cls: "b-sig", bytes: PNG.signature }],
  },
  ihdr: {
    title: "IHDR · Image Header", tag: "13 B data · offset 8–32",
    fields: [
      ["Width", "32 px"], ["Height", "32 px"],
      ["Bit Depth", "8 bit / channel"], ["Color Type", "2 · Truecolor (RGB)"],
      ["Compression", "0 · zlib/DEFLATE"], ["Filter", "0 · 五种类型逐行自适应"], ["Interlace", "0 · 非交错"],
    ],
    note: "IHDR 必须是第一个 Chunk，Data 固定 13 字节；Color Type + Bit Depth 决定像素如何解释。",
    hex: [
      { cls: "b-len", bytes: "00 00 00 0D".split(" ") },
      { cls: "b-type", bytes: "49 48 44 52".split(" ") },
      { cls: "b-data", bytes: PNG.ihdr.hex },
      { cls: "b-crc", bytes: PNG.ihdr.crc },
    ],
  },
  idat1: {
    title: "IDAT #1 · Image Data", tag: "374 B data · offset 33–418",
    fields: [
      ["Data 长度", "374 bytes"], ["CRC-32", "42 98 1F 60"],
      ["Data 开头", "78 9C —— zlib 头（CMF·FLG）"],
    ],
    note: "zlib 头只在整条流的开头出现一次：证明三个 IDAT 属于同一条 zlib 流，而不是三张压缩图片。",
    hex: [
      { cls: "b-len", bytes: "00 00 01 76".split(" ") },
      { cls: "b-type", bytes: "49 44 41 54".split(" ") },
      { cls: "b-data", bytes: "78 9C AD 96 3F EC 25 55 …".split(" ") },
      { cls: "b-crc", bytes: "42 98 1F 60".split(" ") },
    ],
  },
  idat2: {
    title: "IDAT #2 · Image Data", tag: "374 B data · offset 419–804",
    fields: [
      ["Data 长度", "374 bytes"], ["CRC-32", "73 DE 77 50"],
      ["Data 开头", "41 19 D4 45 —— 没有 zlib 头"],
    ],
    note: "流中段：切换 IDAT 时解码器不会重新开始 zlib，只是继续读同一条流。",
    hex: [
      { cls: "b-len", bytes: "00 00 01 76".split(" ") },
      { cls: "b-type", bytes: "49 44 41 54".split(" ") },
      { cls: "b-data", bytes: "41 19 D4 45 37 F4 19 BB …".split(" ") },
      { cls: "b-crc", bytes: "73 DE 77 50".split(" ") },
    ],
  },
  idat3: {
    title: "IDAT #3 · Image Data", tag: "375 B data · offset 805–1191",
    fields: [
      ["Data 长度", "375 bytes"], ["CRC-32", "58 BF 36 7F"],
      ["Data 末尾", "含整条 zlib 流的 Adler-32（4 字节）"],
    ],
    note: "三个 IDAT 的 Data 按序拼接 = 1123 字节的一条 zlib 流：2 字节头 + DEFLATE 数据 + 4 字节 Adler-32。",
    hex: [
      { cls: "b-len", bytes: "00 00 01 77".split(" ") },
      { cls: "b-type", bytes: "49 44 41 54".split(" ") },
      { cls: "b-data", bytes: "DA B9 20 05 2C 92 23 16 …".split(" ") },
      { cls: "b-crc", bytes: "58 BF 36 7F".split(" ") },
    ],
  },
  iend: {
    title: "IEND · Image Trailer", tag: "0 B data · offset 1192–1203",
    fields: [
      ["Data 长度", "0 bytes"], ["CRC-32", "AE 42 60 82（固定值）"],
    ],
    note: "IEND 没有 Data，标记 PNG 数据流结束；其 Length 与 CRC 是常量。",
    hex: [
      { cls: "b-len", bytes: "00 00 00 00".split(" ") },
      { cls: "b-type", bytes: "49 45 4E 44".split(" ") },
      { cls: "b-crc", bytes: "AE 42 60 82".split(" ") },
    ],
  },
};

const CLS_COLOR = { sig: "#93a3bb", ihdr: "#4db8ff", idat: "#3fce7a", iend: "#b98cff" };
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
};

/* ============================================================
   1. HERO 字节雨
   ============================================================ */
(function hexRain() {
  const canvas = $("#hexRain");
  const ctx = canvas.getContext("2d");
  const HEX = "0123456789ABCDEF";
  let W, H, cols, drops, raf = null, visible = true;
  const FS = 15;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cols = Math.ceil(W / (FS * 2.6));
    drops = Array.from({ length: cols }, () => Math.random() * -40);
  }

  function token(i) {
    // 偶尔撒播 "PNG" 的 hex：50 4E 47
    if (Math.random() < 0.012) return ["50", "4E", "47"][i % 3];
    return HEX[(Math.random() * 16) | 0] + HEX[(Math.random() * 16) | 0];
  }

  function draw() {
    ctx.fillStyle = "rgba(5,8,15,0.14)";
    ctx.fillRect(0, 0, W, H);
    ctx.font = `600 ${FS}px "SF Mono", Consolas, monospace`;
    for (let i = 0; i < cols; i++) {
      const t = token(i);
      const x = i * FS * 2.6;
      const y = drops[i] * (FS + 6);
      const hot = t === "50" || t === "4E" || t === "47";
      ctx.fillStyle = hot ? "rgba(57,213,208,0.85)" : "rgba(77,144,255,0.5)";
      ctx.fillText(t, x, y);
      drops[i] += 0.55 + (i % 5) * 0.06;
      if (y > H + 40) drops[i] = Math.random() * -30;
    }
    if (!REDUCED && visible) raf = requestAnimationFrame(draw);
  }

  new IntersectionObserver((es) => {
    visible = es[0].isIntersecting;
    if (visible && !raf && !REDUCED) raf = requestAnimationFrame(draw);
    if (!visible && raf) { cancelAnimationFrame(raf); raf = null; }
  }).observe(canvas);

  window.addEventListener("resize", resize);
  resize();
  if (REDUCED) { for (let i = 0; i < 30; i++) draw(); } else { raf = requestAnimationFrame(draw); }
})();

/* ============================================================
   2. Reveal / 进度条 / 导航高亮
   ============================================================ */
(function scrollFx() {
  const io = new IntersectionObserver((es) => {
    es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { threshold: 0.18, rootMargin: "0px 0px -6% 0px" });
  $$(".reveal, .decode, .timeline").forEach((n) => io.observe(n));

  const bar = $("#progressBar");
  const navMap = {
    hero: "", why: "", history: "", value: "",
    anatomy: "anatomy", chunk: "anatomy", idat: "anatomy",
    encode: "decode", decode: "decode",
    scanline: "unfilter", filters: "unfilter", unfilter: "unfilter",
    zlib: "lz77", lz77: "lz77", huffman: "lz77",
    compare: "compare",
  };
  const sections = $$("section[id]");
  const so = new IntersectionObserver((es) => {
    es.forEach((e) => {
      if (!e.isIntersecting) return;
      const id = e.target.id;
      $$("#dotnav a").forEach((a) => a.classList.toggle("active", a.dataset.nav === id));
      const top = navMap[id] || "";
      $$(".topnav a").forEach((a) => a.classList.toggle("active", a.dataset.nav === top && top !== ""));
    });
  }, { rootMargin: "-38% 0px -52% 0px" });
  sections.forEach((s) => so.observe(s));

  function onScroll() {
    const h = document.documentElement;
    const p = h.scrollTop / (h.scrollHeight - h.clientHeight || 1);
    bar.style.width = (p * 100).toFixed(2) + "%";
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
})();

/* ============================================================
   3. Chunk 文件解剖浏览器
   ============================================================ */
(function explorer() {
  const strip = $("#chunkStrip");
  const ruler = $("#chunkRuler");
  const fieldsBox = $("#detailFields");
  const hexBox = $("#detailHex");
  if (!strip) return;

  PNG.chunks.forEach((c) => {
    const b = el("button", "chunk-btn", "");
    b.style.setProperty("--c", CLS_COLOR[c.cls]);
    b.style.setProperty("--g", c.size);
    b.dataset.chunk = c.id;
    b.setAttribute("role", "tab");
    b.innerHTML = `${c.label}<small>${c.size} B · @${c.off}</small>`;
    b.addEventListener("click", () => select(c.id));
    strip.appendChild(b);
  });

  ["0", "33", "419", "805", "1192", "1204"].forEach((t) => ruler.appendChild(el("span", "", t)));

  function renderHex(d) {
    hexBox.innerHTML = "";
    const line = el("div", "hex-line");
    d.hex.forEach((part) => {
      part.bytes.forEach((byte) => line.appendChild(el("span", "hex-b " + part.cls, byte)));
    });
    hexBox.appendChild(line);
    const legend = el("div", "hex-legend");
    [["Length", "#ffd166"], ["Type", "#4db8ff"], ["Data", "#3fce7a"], ["CRC", "#b98cff"]].forEach(([t, c]) => {
      const s = el("span", "", "");
      s.innerHTML = `<i style="background:${c}"></i>${t}`;
      legend.appendChild(s);
    });
    hexBox.appendChild(legend);
  }

  function select(id) {
    $$(".chunk-btn", strip).forEach((b) => b.classList.toggle("active", b.dataset.chunk === id));
    const d = CHUNK_DETAIL[id];
    fieldsBox.innerHTML = `<h4>${d.title}<span class="mono">${d.tag}</span></h4>`;
    d.fields.forEach(([k, v]) => {
      const row = el("div", "field-row");
      row.appendChild(el("span", "fk", k));
      row.appendChild(el("span", "fv", v));
      fieldsBox.appendChild(row);
    });
    fieldsBox.appendChild(el("p", "field-note", d.note));
    renderHex(d);
  }

  select("ihdr");
})();

/* ============================================================
   4. 四段式悬停说明
   ============================================================ */
(function quad() {
  const info = $("#quadInfo");
  if (!info) return;
  const DEF = "把鼠标悬停到任意一段上，查看它的规则。";
  $$(".quad-seg").forEach((seg) => {
    seg.addEventListener("mouseenter", () => { info.textContent = seg.dataset.info; });
    seg.addEventListener("mouseleave", () => { info.textContent = DEF; });
  });
})();

/* ============================================================
   5. Filter 示意 SVG
   ============================================================ */
(function filterSvgs() {
  const CELL = 24, GAP = 4, P = CELL + GAP;
  const COLORS = { nb: "#39d5d0", x: "#ff9e4d", dim: "#22314e" };

  function cell(cx, cy, label, color, dashed) {
    return `<rect x="${cx}" y="${cy}" width="${CELL}" height="${CELL}" rx="5"
      fill="${color === COLORS.dim ? "none" : color + "22"}"
      stroke="${color}" stroke-width="1.6" ${dashed ? 'stroke-dasharray="4 3"' : ""}/>
      <text x="${cx + CELL / 2}" y="${cy + CELL / 2 + 4.5}" text-anchor="middle"
      font-size="12" font-family="SF Mono,Consolas,monospace" font-weight="700"
      fill="${color === COLORS.dim ? "#5d6f8a" : color}">${label}</text>`;
  }
  function arrow(x1, y1, x2, y2) {
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#ffd166" stroke-width="1.8"
      stroke-dasharray="3 3" marker-end="url(#fArrow)"/>`;
  }
  const DEFS = `<defs><marker id="fArrow" markerWidth="7" markerHeight="7" refX="5.4" refY="3"
      orient="auto"><path d="M0,0 L6,3 L0,6 z" fill="#ffd166"/></marker></defs>`;

  // 布局：c(0,0) b(1,0) ·(2,0) / a(0,1) x(1,1) ·(2,1)
  const pos = { c: [0, 0], b: [P, 0], a: [0, P], x: [P, P] };
  const W = P * 3 - GAP, H = P * 2 - GAP;
  const xc = pos.x[0] + CELL / 2, yc = pos.x[1] + CELL / 2;

  function svg(kind) {
    let inner = DEFS;
    const dim = (k) => cell(pos[k][0], pos[k][1], "", COLORS.dim, true);
    if (kind === "none") {
      inner += dim("c") + dim("b") + dim("a") + cell(pos.x[0], pos.x[1], "x", COLORS.x);
    } else {
      const show = { sub: ["a"], up: ["b"], average: ["a", "b"], paeth: ["a", "b", "c"] }[kind];
      ["c", "b", "a"].forEach((k) => { inner += show.includes(k) ? cell(pos[k][0], pos[k][1], k, COLORS.nb) : dim(k); });
      inner += cell(pos.x[0], pos.x[1], "x", COLORS.x);
      show.forEach((k) => {
        const sx = pos[k][0] + CELL / 2, sy = pos[k][1] + CELL / 2;
        const dx = Math.sign(xc - sx), dy = Math.sign(yc - sy);
        inner += arrow(sx + dx * (CELL / 2 + 1), sy + dy * (CELL / 2 + 1), xc - dx * (CELL / 2 + 2), yc - dy * (CELL / 2 + 2));
      });
    }
    return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${inner}</svg>`;
  }

  $$(".filter-svg").forEach((box) => { box.innerHTML = svg(box.dataset.filter); });

  const legend = $("#neighborSvg");
  if (legend) legend.innerHTML = svg("paeth");
})();

/* ============================================================
   6. Unfilter 实验室
   ============================================================ */
(function unfilterLab() {
  const grid = $("#labGrid");
  if (!grid) return;
  const upRowBox = $("#labUpRow");
  const upGrid = $("#upGrid");
  const formulaEl = $("#labFormula");
  const calcEl = $("#labCalc");
  const progEl = $("#labProgress");
  const anchorEl = $("#labAnchor");
  const filterTag = $("#labFilterTag");
  const axisEl = $("#labAxis");
  const btnStep = $("#labStep"), btnPlay = $("#labPlay"), btnReset = $("#labReset");
  const tabSub = $("#tabSub"), tabUp = $("#tabUp");

  const N = 33, CH = ["R", "G", "B"];
  let mode = "sub", step = 0, playing = false, timer = null;
  let byteEls = [], pxEls = [], upByteEls = [];

  function buildGrid(container, withIdx) {
    container.innerHTML = "";
    const bytes = [], pxs = [];
    for (let p = 0; p < 11; p++) {
      const px = el("div", "lab-px");
      if (withIdx) px.appendChild(el("span", "lab-px-idx", "P" + p));
      for (let c = 0; c < 3; c++) {
        const b = el("span", "byte", "·");
        b.title = `P${p} · ${CH[c]}`;
        px.appendChild(b);
        bytes[p * 3 + c] = b;
      }
      container.appendChild(px);
      pxs.push(px);
    }
    return { bytes, pxs };
  }

  function setFiltered() {
    const d = PNG[mode];
    byteEls.forEach((b, i) => {
      b.className = "byte f";
      b.textContent = d.filtered[i];
      b.title = `P${(i / 3) | 0} · ${CH[i % 3]} · filtered`;
    });
    if (mode === "up") {
      upByteEls.forEach((b, i) => {
        b.className = "byte r";
        b.textContent = PNG.up.upRecon[i];
        b.title = `上一行 P${(i / 3) | 0} · ${CH[i % 3]} · 已重建`;
      });
    }
  }

  function setMode(m) {
    mode = m;
    tabSub.classList.toggle("active", m === "sub");
    tabUp.classList.toggle("active", m === "up");
    tabSub.setAttribute("aria-selected", m === "sub");
    tabUp.setAttribute("aria-selected", m === "up");
    upRowBox.hidden = m !== "up";
    filterTag.textContent = m === "sub" ? "Filter Type = 1 · Sub" : "Filter Type = 2 · Up";
    formulaEl.textContent = m === "sub"
      ? "Recon[x] = ( Filtered[x] + Recon[x−3] ) mod 256"
      : "Recon[x] = ( Filtered[x] + 上一行同位置已重建值 ) mod 256";
    axisEl.innerHTML = m === "sub" ? "当前行<br><small>重建中 · 上→下 R/G/B</small>" : "第 1 行<br><small>重建中 · 上→下 R/G/B</small>";
    reset();
  }

  function clearMarks() {
    byteEls.forEach((b) => b.classList.remove("cur", "src"));
    upByteEls.forEach((b) => b.classList.remove("cur", "src"));
    pxEls.forEach((p) => p.classList.remove("dep"));
  }

  function stepOnce() {
    if (step >= N) { pause(); calcEl.textContent = "本行 33 个字节全部重建完成 → 可以解释成 11 个 RGB 像素"; return; }
    clearMarks();
    const d = PNG[mode];
    const i = step;
    let srcVal, srcEl = null, srcDesc;
    if (mode === "sub") {
      srcVal = i >= 3 ? d.recon[i - 3] : 0;
      srcEl = i >= 3 ? byteEls[i - 3] : null;
      srcDesc = i >= 3 ? `Recon[x−3] = ${srcVal}` : "行首无左邻 → 0";
      if (i >= 3) pxEls[(i / 3) | 0].classList.add("dep");
    } else {
      srcVal = d.upRecon[i];
      srcEl = upByteEls[i];
      srcDesc = `上一行同位置 = ${srcVal}`;
    }
    if (srcEl) srcEl.classList.add("src");
    const cur = byteEls[i];
    cur.classList.remove("f");
    cur.classList.add("r", "cur");
    cur.textContent = d.recon[i];
    if (i === PNG.anchorByte) cur.classList.add("anchor");
    cur.title = `P${(i / 3) | 0} · ${CH[i % 3]} · reconstructed`;

    calcEl.textContent = `${d.recon[i]} = ( ${d.filtered[i]} + ${srcVal} ) mod 256　·　${srcDesc}`;
    progEl.textContent = `${i + 1} / ${N} bytes`;

    if (i === PNG.anchorByte) {
      anchorEl.hidden = false;
      anchorEl.textContent = mode === "sub"
        ? "★ 讲义锚点：像素 (8,0) 的 G 通道 = 57 + 8 = 65"
        : "★ 讲义锚点：像素 (8,1) 的 G 通道 = 65 + 16 = 81";
    }
    step++;
    if (step >= N) pause();
  }

  function pause() {
    playing = false;
    if (timer) { clearInterval(timer); timer = null; }
    btnPlay.textContent = "▶ 播放";
  }

  function reset() {
    pause();
    step = 0;
    clearMarks();
    setFiltered();
    calcEl.textContent = "按「单步」或「播放」开始";
    progEl.textContent = `0 / ${N} bytes`;
    anchorEl.hidden = true;
  }

  const built = buildGrid(grid, true);
  byteEls = built.bytes; pxEls = built.pxs;
  upByteEls = buildGrid(upGrid, true).bytes;

  btnStep.addEventListener("click", stepOnce);
  btnPlay.addEventListener("click", () => {
    if (playing) { pause(); return; }
    if (step >= N) reset();
    playing = true;
    btnPlay.textContent = "⏸ 暂停";
    stepOnce();
    timer = setInterval(() => { if (playing) stepOnce(); }, REDUCED ? 900 : 430);
  });
  btnReset.addEventListener("click", reset);
  tabSub.addEventListener("click", () => setMode("sub"));
  tabUp.addEventListener("click", () => setMode("up"));

  setMode("sub");
})();

/* ============================================================
   7. LZ77 播放器（三示例标签切换）
   ============================================================ */
(function lz77() {
  const win = $("#lzWindow");
  if (!win) return;
  const arc = $("#lzArc");
  const arcSvg = $("#lzArc svg");
  const arcPath = $("#lzArcPath");
  const arcHead = $("#lzArcHead");
  const arcLabel = $("#lzArcLabel");
  const tokensBox = $("#lzTokens");
  const caption = $("#lzCaption");
  const btn = $("#lzReplay");
  const tabs = $$("#lzTabs .lz-tab");

  // 每个示例：原始字节流 + token 序列（lit 原样输出；ref 回看引用）
  const EXAMPLES = [
    {
      seq: "ABCABCABC",
      toks: [{ t: "lit", p: 0 }, { t: "lit", p: 1 }, { t: "lit", p: 2 },
             { t: "ref", p: 3, len: 6, dist: 3 }],
    },
    {
      seq: "ABCABCAB",
      toks: [{ t: "lit", p: 0 }, { t: "lit", p: 1 }, { t: "lit", p: 2 },
             { t: "ref", p: 3, len: 5, dist: 3 }],
    },
    {
      seq: "ABCDABCABC",
      toks: [{ t: "lit", p: 0 }, { t: "lit", p: 1 }, { t: "lit", p: 2 }, { t: "lit", p: 3 },
             { t: "ref", p: 4, len: 3, dist: 4 },
             { t: "ref", p: 7, len: 3, dist: 3 }],
    },
  ];

  let cur = 0, timers = [], started = false, bytes = [];

  function build(ex) {
    win.innerHTML = "";
    ex.seq.split("").forEach((ch, i) => {
      const b = el("div", "lz-byte");
      b.innerHTML = `<span class="ch">${ch}</span><span class="idx">${i}</span>`;
      win.appendChild(b);
    });
    bytes = $$(".lz-byte", win);
  }

  function clearTimers() { timers.forEach(clearTimeout); timers = []; }
  function later(ms, fn) { timers.push(setTimeout(fn, ms)); }
  function clearMarks(cls) { bytes.forEach((b) => b.classList.remove(cls)); }

  function reset() {
    clearTimers();
    bytes.forEach((b) => { b.className = "lz-byte"; });
    tokensBox.innerHTML = "";
    arc.classList.remove("show");
  }

  function addToken(cls, text) {
    tokensBox.appendChild(el("span", "lz-token " + cls, text));
  }

  // 按字节元素的真实位置绘制回看弧线：从扫描位置弯向匹配源
  function showArc(tok) {
    const W = arc.clientWidth;
    const arcRect = arc.getBoundingClientRect();
    const fromRect = bytes[tok.p].getBoundingClientRect();
    const first = tok.p - tok.dist;
    const last = Math.min(tok.p - 1, tok.p - tok.dist + tok.len - 1);
    const r1 = bytes[first].getBoundingClientRect();
    const r2 = bytes[last].getBoundingClientRect();
    const fromX = fromRect.left + fromRect.width / 2 - arcRect.left;
    const toX = (r1.left + r2.right) / 2 - arcRect.left;
    const span = Math.max(fromX - toX, 60);
    arcSvg.setAttribute("viewBox", `0 0 ${W} 90`);
    arcPath.setAttribute("d", `M ${fromX} 78 C ${fromX - span * 0.3} 8, ${toX + span * 0.3} 8, ${toX} 78`);
    arcHead.setAttribute("d", `M ${toX} 78 l -10 -2 l 4 10 z`);
    arcLabel.textContent = `Length = ${tok.len} · Distance = ${tok.dist}`;
    arc.classList.add("show");
  }

  function play() {
    const ex = EXAMPLES[cur];
    reset();
    const T = REDUCED ? 500 : 850;
    let time = 0;
    caption.textContent = "扫描器从左到右前进……";

    ex.toks.forEach((tok) => {
      if (tok.t === "lit") {
        later(time, () => {
          clearMarks("scan");
          bytes[tok.p].classList.add("lit", "scan");
          addToken("lit", ex.seq[tok.p]);
          caption.textContent = `位置 ${tok.p}：「${ex.seq[tok.p]}」是新内容 → literal 原样输出`;
        });
        time += 620;
      } else {
        const base = time;
        later(base, () => {
          clearMarks("scan"); clearMarks("src");
          arc.classList.remove("show");
          bytes[tok.p].classList.add("scan");
          caption.textContent = `位置 ${tok.p}：往回看 —— 「${ex.seq.slice(tok.p, tok.p + tok.len)}」刚刚出现过`;
        });
        later(base + T * 0.7, () => {
          for (let i = tok.p - tok.dist; i <= Math.min(tok.p - 1, tok.p - tok.dist + tok.len - 1); i++) {
            bytes[i].classList.add("src");
          }
          showArc(tok);
          caption.textContent = `往回 ${tok.dist} 个字节，存在长度 ${tok.len} 的匹配`;
        });
        later(base + T * 1.7, () => {
          for (let i = tok.p; i < tok.p + tok.len; i++) bytes[i].classList.add("match");
          addToken("ref", `⟨ Len ${tok.len} · Dist ${tok.dist} ⟩`);
          caption.textContent = `${tok.len} 个字节，只输出一个引用 token`;
        });
        time += T * 2.3;
      }
    });

    later(time + T * 0.5, () => {
      clearMarks("scan");
      const litN = ex.toks.filter((t) => t.t === "lit").length;
      const refN = ex.toks.filter((t) => t.t === "ref").length;
      caption.textContent = `${ex.seq.length} 个字节 → ${litN} 个 literal + ${refN} 个引用。重复越多，省得越多。`;
    });
  }

  function select(i, autoplay) {
    cur = i;
    tabs.forEach((t, j) => {
      t.classList.toggle("active", j === i);
      t.setAttribute("aria-selected", j === i);
    });
    build(EXAMPLES[i]);
    if (autoplay) play(); else reset();
  }

  tabs.forEach((t, i) => t.addEventListener("click", () => select(i, true)));
  btn.addEventListener("click", play);

  build(EXAMPLES[0]);
  new IntersectionObserver((es, io) => {
    if (es[0].isIntersecting && !started) { started = true; play(); io.disconnect(); }
  }, { threshold: 0.4 }).observe(win);
})();

/* ============================================================
   8. Huffman 频率图
   ============================================================ */
(function huffman() {
  const chart = $("#hfChart");
  if (!chart) return;
  // 频率为本讲义 filtered 数据的近似分布（示意）
  const ROWS = [
    { sym: "0x08", freq: 48, code: "0", len: 1 },
    { sym: "0x00", freq: 26, code: "10", len: 2 },
    { sym: "0xFF", freq: 15, code: "110", len: 3 },
    { sym: "0x1D", freq: 11, code: "111", len: 3 },
  ];
  ROWS.forEach((r) => {
    const row = el("div", "hf-row");
    row.appendChild(el("span", "hf-sym", r.sym));
    const bars = el("div", "hf-bars");
    const f = el("i", "hf-bar freq"); f.dataset.w = (r.freq / 48) * 100;
    const c = el("i", "hf-bar code"); c.dataset.w = (r.len / 4) * 100;
    bars.appendChild(f); bars.appendChild(c);
    row.appendChild(bars);
    const code = el("span", "hf-code", r.code);
    code.innerHTML = `${r.code}<small>码长 ${r.len}</small>`;
    row.appendChild(code);
    chart.appendChild(row);
  });

  new IntersectionObserver((es, io) => {
    if (!es[0].isIntersecting) return;
    $$(".hf-bar", chart).forEach((b, i) => {
      setTimeout(() => { b.style.width = b.dataset.w + "%"; }, REDUCED ? 0 : i * 90);
    });
    io.disconnect();
  }, { threshold: 0.35 }).observe(chart);
})();

/* ============================================================
   9. 回顾翻转卡
   ============================================================ */
(function quiz() {
  $$(".quiz-card").forEach((card) => {
    card.addEventListener("click", () => {
      if (card.classList.contains("open")) return;
      card.classList.add("open");
      const ans = el("span", "quiz-answer", card.dataset.answer);
      card.querySelector(".quiz-flip").textContent = "答案";
      card.appendChild(ans);
    });
  });
})();

/* ============================================================
   10. 键盘 ↑↓←→ 切换章节
   ============================================================ */
(function keyboardNav() {
  const SECTIONS = ["hero", "why", "history", "value", "chunk", "anatomy", "idat",
    "encode", "decode", "scanline", "filters", "unfilter", "zlib", "lz77", "huffman", "compare"];
  const STEP = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };

  function currentIndex() {
    // 用视口相对坐标判定当前章节：offsetTop 相对 <main>（position:relative）会系统性偏小
    const threshold = window.innerHeight * 0.4;
    let idx = 0;
    SECTIONS.forEach((id, i) => {
      const t = document.getElementById(id);
      if (t && t.getBoundingClientRect().top <= threshold) idx = i;
    });
    return idx;
  }

  document.addEventListener("keydown", (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey || !(e.key in STEP)) return;
    const t = e.target;
    if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
    e.preventDefault();
    const next = Math.min(Math.max(currentIndex() + STEP[e.key], 0), SECTIONS.length - 1);
    document.getElementById(SECTIONS[next]).scrollIntoView({
      behavior: REDUCED ? "auto" : "smooth",
      block: "start",
    });
  });
})();
