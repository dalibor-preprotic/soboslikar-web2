"use strict";

/* ---------- helpers ---------- */
function parseNumber(s) {
  const t = (s ?? "").trim().replace(",", ".");
  if (t === "") throw new Error("Prazan unos.");
  const v = Number(t);
  if (!Number.isFinite(v)) throw new Error("Unos mora biti broj.");
  return v;
}
function pos(v, name) {
  if (v <= 0) throw new Error(`${name} mora biti veća od 0.`);
}
function money(x){ return Number(x).toFixed(2); }
function area(x){ return Number(x).toFixed(2); }

/* ---------- UI ---------- */
const ui = {
  homeBtn: document.getElementById("homeBtn"),
  viewMenu: document.getElementById("viewMenu"),
  viewCalc: document.getElementById("viewCalc"),
  viewFinal: document.getElementById("viewFinal"),
  calcStandard: document.getElementById("calcStandard"),

  btnPainter: document.getElementById("btnPainter"),
  btnBoth: document.getElementById("btnBoth"),

  calcTitle: document.getElementById("calcTitle"),
  promptLine1: document.getElementById("promptLine1"),
  promptLine2: document.getElementById("promptLine2"),
  display: document.getElementById("display"),

  stopRoomsBtn: document.getElementById("stopRoomsBtn"),
  stopOpeningsBtn: document.getElementById("stopOpeningsBtn"),
  stopNoParquetBtn: document.getElementById("stopNoParquetBtn"),

  modeToggle: document.getElementById("modeToggle"),
  formBox: document.getElementById("formBox"),
  formParquet: document.getElementById("formParquet"),

  finalText: document.getElementById("finalText"),
  pdfBtn: document.getElementById("pdfBtn"),
  restartBtn: document.getElementById("restartBtn"),
};

/* ---------- app state ---------- */
const STEPS = {
  ROOM_W: "ROOM_W",
  ROOM_L: "ROOM_L",
  ROOM_H: "ROOM_H",
  OPEN_W: "OPEN_W",
  OPEN_H: "OPEN_H",
  NO_PARKET_W: "NO_PARKET_W",
  NO_PARKET_L: "NO_PARKET_L",
  PRICE_PAINT: "PRICE_PAINT",
  PRICE_PARKET: "PRICE_PARKET",
};

const state = {
  mode: "BOTH", // "PAINT" or "BOTH"
  step: STEPS.ROOM_W,

  // totals
  paint_total: 0,
  floor_total: 0,

  // temp
  room_w: null,
  room_l: null,
  room_h: null,
  open_w: null,
  no_parquet_w: null,

  // prices
  painter_price: 0,
  parquet_price: 0,

  // form mode arrays
  rooms: [],
  opens: [],
  nop: [],
};

/* ---------- localStorage (zadnje cijene) ---------- */
const LS_PAINT = "soboslikar_price_paint";
const LS_PARKET = "soboslikar_price_parquet";

function loadPrices() {
  const p = localStorage.getItem(LS_PAINT);
  const k = localStorage.getItem(LS_PARKET);
  state.painter_price = p ? Number(p) : 0;
  state.parquet_price = k ? Number(k) : 0;
}

function savePrices() {
  localStorage.setItem(LS_PAINT, String(state.painter_price));
  localStorage.setItem(LS_PARKET, String(state.parquet_price));
}

/* ---------- view helpers ---------- */
function show(view) {
  ui.viewMenu.classList.add("hidden");
  ui.viewCalc.classList.add("hidden");
  ui.viewFinal.classList.add("hidden");
  view.classList.remove("hidden");
}

function setPrompt(a, b="") {
  ui.promptLine1.textContent = a;
  ui.promptLine2.textContent = b;
}

function clearDisplay() {
  ui.display.value = "";
  ui.display.focus();
}
function addChar(ch) {
  ui.display.value = (ui.display.value ?? "") + ch;
  ui.display.focus();
}
function backspace() {
  ui.display.value = (ui.display.value ?? "").slice(0, -1);
  ui.display.focus();
}

function prefillPriceIfExists() {
  if (state.step === STEPS.PRICE_PAINT && state.painter_price > 0) {
    ui.display.value = String(state.painter_price);
  }

  if (state.step === STEPS.PRICE_PARKET && state.parquet_price > 0) {
    ui.display.value = String(state.parquet_price);
  }
}

/* ---------- prompts ---------- */
function updatePrompt() {
  const isPaintOnly = state.mode === "PAINT";

  // dostupnost stop tipki po fazama
  ui.stopRoomsBtn.disabled = !(state.step === STEPS.ROOM_W);
  ui.stopOpeningsBtn.disabled = !(state.step === STEPS.OPEN_W);
  ui.stopNoParquetBtn.disabled = !(state.step === STEPS.NO_PARKET_W);

  // ako je samo soboslikar, bez-parketa i parketar cijena nisu relevantni
  ui.stopNoParquetBtn.classList.toggle("hidden", isPaintOnly);

  switch (state.step) {
    case STEPS.ROOM_W:
      setPrompt("Unesi širinu prostorije (m):", "Dodaj prostorije pa klikni 'Završi prostorije'.");
      break;
    case STEPS.ROOM_L:
      setPrompt("Unesi dužinu prostorije (m):");
      break;
    case STEPS.ROOM_H:
      setPrompt("Unesi visinu prostorije (m):");
      break;
    case STEPS.OPEN_W:
      setPrompt("Otvori: unesi širinu (m):", "Dodaj otvore pa klikni 'Završi otvore'.");
      break;
    case STEPS.OPEN_H:
      setPrompt("Otvori: unesi visinu (m):");
      break;
    case STEPS.NO_PARKET_W:
      setPrompt("Bez parketa: unesi širinu (m):", "Dodaj pa klikni 'Završi bez parketa'.");
      break;
    case STEPS.NO_PARKET_L:
      setPrompt("Bez parketa: unesi dužinu (m):");
      break;
    case STEPS.PRICE_PAINT:
      setPrompt("Cijena soboslikar (€/m²):", "Sprema se automatski za sljedeći put.");
      break;
    case STEPS.PRICE_PARKET:
      setPrompt("Cijena parketar (€/m²):", "Sprema se automatski za sljedeći put.");
      break;
  }
  prefillPriceIfExists();
}

/* ---------- reset / start ---------- */
function resetForNew(mode) {
  state.mode = mode;                 // "PAINT" or "BOTH"
  // sakrij parketarski dio forme ako je samo soboslikar
  if (state.mode === "PAINT") {
    ui.formParquet.classList.add("hidden");
  } else {
    ui.formParquet.classList.remove("hidden");
  }
  state.step = STEPS.ROOM_W;

  state.paint_total = 0;
  state.floor_total = 0;

  state.room_w = state.room_l = state.room_h = null;
  state.open_w = null;
  state.no_parquet_w = null;

  // form arrays
  state.rooms = [];
  state.opens = [];
  state.nop = [];

  loadPrices();

  ui.calcTitle.textContent = (mode === "PAINT")
    ? "Izračun: soboslikar"
    : "Izračun: soboslikar + parketar";

  // inicijalne cijene u formi (ako je forma uključena)
  const fp = document.getElementById("fPricePaint");
  const fk = document.getElementById("fPriceParquet");
  if (fp) fp.value = state.painter_price ? String(state.painter_price) : "";
  if (fk) fk.value = state.parquet_price ? String(state.parquet_price) : "";

  ui.modeToggle.checked = false;
  ui.formBox.classList.add("hidden");
  ui.calcStandard.classList.remove("hidden"); // vrati kalkulator
  // (opcionalno) reset focus na display
  ui.display.blur();

  clearDisplay();
  updatePrompt();
  show(ui.viewCalc);
}

/* ---------- step-by-step OK ---------- */
function ok() {
  let x;
  try { x = parseNumber(ui.display.value); }
  catch { alert("Neispravan unos: Unos mora biti broj."); return; }

  try {
    if (state.step === STEPS.ROOM_W) {
      pos(x, "Širina");
      state.room_w = x;
      state.step = STEPS.ROOM_L;

    } else if (state.step === STEPS.ROOM_L) {
      pos(x, "Dužina");
      state.room_l = x;
      state.step = STEPS.ROOM_H;

    } else if (state.step === STEPS.ROOM_H) {
      pos(x, "Visina");
      state.room_h = x;

      // zidovi + strop
      state.paint_total += 2 * (state.room_w + state.room_l) * state.room_h + state.room_w * state.room_l;
      // pod
      state.floor_total += state.room_w * state.room_l;

      state.step = STEPS.OPEN_W;

    } else if (state.step === STEPS.OPEN_W) {
      pos(x, "Širina otvora");
      state.open_w = x;
      state.step = STEPS.OPEN_H;

    } else if (state.step === STEPS.OPEN_H) {
      pos(x, "Visina otvora");
      state.paint_total = Math.max(0, state.paint_total - state.open_w * x);
      state.step = STEPS.OPEN_W;

    } else if (state.step === STEPS.NO_PARKET_W) {
      pos(x, "Širina bez parketa");
      state.no_parquet_w = x;
      state.step = STEPS.NO_PARKET_L;

    } else if (state.step === STEPS.NO_PARKET_L) {
      pos(x, "Dužina bez parketa");
      state.floor_total = Math.max(0, state.floor_total - state.no_parquet_w * x);
      state.step = STEPS.NO_PARKET_W;

    } else if (state.step === STEPS.PRICE_PAINT) {
      if (x < 0) throw new Error("Cijena ne smije biti negativna.");
      state.painter_price = x;
      savePrices();

      // ako je samo soboslikar, odmah rezultat
      if (state.mode === "PAINT") {
        showFinal();
        clearDisplay();
        return;
      }

      state.step = STEPS.PRICE_PARKET;

    } else if (state.step === STEPS.PRICE_PARKET) {
      if (x < 0) throw new Error("Cijena ne smije biti negativna.");
      state.parquet_price = x;
      savePrices();

      showFinal();
      clearDisplay();
      return;
    }

    clearDisplay();
    updatePrompt();
  } catch (e) {
    alert("Neispravan unos: " + e.message);
  }
}

/* ---------- stop buttons (prekid unosa umjesto 0) ---------- */
function stopRooms() {
  // Dozvoli završetak unosa prostorija i ako si već na otvaranju (OPEN_W),
  // npr. nakon zadnje sobe.
  if (state.step !== STEPS.ROOM_W && state.step !== STEPS.OPEN_W) return;

  // Nakon prostorija ide: otvori (ako smo još u ROOM_W) ili dalje (ako smo u OPEN_W)
  // Ako smo u ROOM_W, prvo ide na OPEN_W (otvori za sobu koja će se unijeti sljedeće),
  // ali u praksi "završi prostorije" znači da više ne unosimo sobe, pa idemo na fazu otvora završetka:
  // Najjednostavnije: prebaci na OPEN_W pa odmah dalje pomoću stopOpeningsBtn ako nema otvora.
  // Međutim, ovdje ćemo direktno završiti otvore i ići dalje:

  if (state.mode === "PAINT") {
    state.step = STEPS.PRICE_PAINT;
  } else {
    state.step = STEPS.NO_PARKET_W;
  }

  clearDisplay();
  updatePrompt();
}
function stopOpenings() {
  if (state.step !== STEPS.OPEN_W) return;

  // Nema otvora za ovu prostoriju / završetak otvora za trenutnu prostoriju
  // -> ide se na unos sljedeće prostorije
  state.step = STEPS.ROOM_W;

  clearDisplay();
  updatePrompt();
}
function stopNoParquet() {
  if (state.step !== STEPS.NO_PARKET_W) return;
  state.step = STEPS.PRICE_PAINT;
  clearDisplay();
  updatePrompt();
}

/* ---------- final ---------- */
function showFinal() {
  const paint = Math.max(0, state.paint_total);
  const floor = Math.max(0, state.floor_total);

  const pc = paint * (state.painter_price ?? 0);
  const fc = (state.mode === "PAINT") ? 0 : floor * (state.parquet_price ?? 0);
  const total = pc + fc;

  const lines = [];
  lines.push("OBRAČUN");
  lines.push("────────────────────");
  lines.push(`Površina bojanje: ${area(paint)} m²`);
  if (state.mode !== "PAINT") lines.push(`Površina parket:  ${area(floor)} m²`);
  lines.push("");
  lines.push(`Ukupno soboslikar: ${money(pc)} €`);
  if (state.mode !== "PAINT") lines.push(`Ukupno parketar:   ${money(fc)} €`);
  lines.push("────────────────────");
  lines.push(`SVEUKUPNO: ${money(total)} €`);

  ui.finalText.textContent = lines.join("\n");
  show(ui.viewFinal);
}

/* ---------- PDF export ---------- */
function downloadPDF() {
  window.print(); // Browser export → Save as PDF
}

/* ---------- keypad clicks ---------- */
document.querySelector(".pad").addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;

  const key = btn.getAttribute("data-key");
  const action = btn.getAttribute("data-action");

  if (key) addChar(key);
  if (action === "clear") clearDisplay();
  if (action === "back") backspace();
  if (action === "ok") ok();
});

/* ---------- keyboard ---------- */
document.addEventListener("keydown", (e) => {
  if (ui.viewCalc.classList.contains("hidden")) return;

  if (e.key === "Enter") { e.preventDefault(); ok(); }
  if (e.key === "Escape") { e.preventDefault(); clearDisplay(); }
  if (e.key === "Backspace" && document.activeElement !== ui.display) {
    e.preventDefault();
    backspace();
  }
});

/* ---------- menu ---------- */
ui.btnPainter.addEventListener("click", () => resetForNew("PAINT"));
ui.btnBoth.addEventListener("click", () => resetForNew("BOTH"));
ui.homeBtn.addEventListener("click", () => show(ui.viewMenu));

/* ---------- stop buttons ---------- */
ui.stopRoomsBtn.addEventListener("click", stopRooms);
ui.stopOpeningsBtn.addEventListener("click", stopOpenings);
ui.stopNoParquetBtn.addEventListener("click", stopNoParquet);

/* ---------- final buttons ---------- */
ui.restartBtn.addEventListener("click", () => resetForNew(state.mode));
ui.pdfBtn.addEventListener("click", downloadPDF);

/* ---------- classic form mode ---------- */
const form = {
  fRoomW: document.getElementById("fRoomW"),
  fRoomL: document.getElementById("fRoomL"),
  fRoomH: document.getElementById("fRoomH"),
  addRoomBtn: document.getElementById("addRoomBtn"),
  roomsList: document.getElementById("roomsList"),

  fOpenW: document.getElementById("fOpenW"),
  fOpenH: document.getElementById("fOpenH"),
  addOpenBtn: document.getElementById("addOpenBtn"),
  opensList: document.getElementById("opensList"),

  fNoPW: document.getElementById("fNoPW"),
  fNoPL: document.getElementById("fNoPL"),
  addNoPBtn: document.getElementById("addNoPBtn"),
  nopList: document.getElementById("nopList"),

  fPricePaint: document.getElementById("fPricePaint"),
  fPriceParquet: document.getElementById("fPriceParquet"),
  calcFormBtn: document.getElementById("calcFormBtn"),
};

function renderList(container, items, labelFn, removeFn) {
  container.innerHTML = "";
  items.forEach((it, idx) => {
    const row = document.createElement("div");
    row.className = "item";
    row.innerHTML = `<div>${labelFn(it, idx)}</div>`;
    const del = document.createElement("button");
    del.textContent = "Obriši";
    del.addEventListener("click", () => removeFn(idx));
    row.appendChild(del);
    container.appendChild(row);
  });
}

function recalcFromForm() {
  let paint = 0;
  let floor = 0;

  for (const r of state.rooms) {
    const w = r.w, l = r.l, h = r.h;
    paint += 2 * (w + l) * h + w * l;
    floor += w * l;
  }

  for (const o of state.opens) {
    paint = Math.max(0, paint - o.w * o.h);
  }

  for (const a of state.nop) {
    floor = Math.max(0, floor - a.w * a.l);
  }

  state.paint_total = paint;
  state.floor_total = floor;

  state.painter_price = parseNumber(form.fPricePaint.value);
  if (state.painter_price < 0) throw new Error("Cijena soboslikar ne smije biti negativna.");

  if (state.mode !== "PAINT") {
    state.parquet_price = parseNumber(form.fPriceParquet.value);
    if (state.parquet_price < 0) throw new Error("Cijena parketar ne smije biti negativna.");
  } else {
    state.parquet_price = 0;
  }

  savePrices();
}

ui.modeToggle.addEventListener("change", () => {
  const on = ui.modeToggle.checked;

  // forma
  ui.formBox.classList.toggle("hidden", !on);

  // standardni kalkulator
  ui.calcStandard.classList.toggle("hidden", on);

  if (on) {
    // učitaj zadnje cijene u formu
    loadPrices();
    form.fPricePaint.value = state.painter_price ? String(state.painter_price) : "";
    form.fPriceParquet.value = state.parquet_price ? String(state.parquet_price) : "";
  } else {
    // povratak na standardni unos
    clearDisplay();
    updatePrompt();
  }

  // forma se prilagođava odabranom modu
  if (state.mode === "PAINT") {
    ui.formParquet.classList.add("hidden");
  } else {
    ui.formParquet.classList.remove("hidden");
  }
});


/* add room/open/nop */
form.addRoomBtn.addEventListener("click", () => {
  try {
    const w = parseNumber(form.fRoomW.value); pos(w, "Širina");
    const l = parseNumber(form.fRoomL.value); pos(l, "Dužina");
    const h = parseNumber(form.fRoomH.value); pos(h, "Visina");

    state.rooms.push({ w, l, h });

    form.fRoomW.value = ""; form.fRoomL.value = ""; form.fRoomH.value = "";

    renderList(form.roomsList, state.rooms,
      (r, i) => `Prostorija ${i+1}: ${r.w} × ${r.l} × ${r.h} m`,
      (idx) => { state.rooms.splice(idx, 1); renderAllLists(); }
    );
  } catch (e) {
    alert("Greška (prostorija): " + e.message);
  }
});

form.addOpenBtn.addEventListener("click", () => {
  try {
    const w = parseNumber(form.fOpenW.value); pos(w, "Širina otvora");
    const h = parseNumber(form.fOpenH.value); pos(h, "Visina otvora");

    state.opens.push({ w, h });

    form.fOpenW.value = ""; form.fOpenH.value = "";

    renderList(form.opensList, state.opens,
      (o, i) => `Otvor ${i+1}: ${o.w} × ${o.h} m`,
      (idx) => { state.opens.splice(idx, 1); renderAllLists(); }
    );
  } catch (e) {
    alert("Greška (otvor): " + e.message);
  }
});

form.addNoPBtn.addEventListener("click", () => {
  try {
    if (state.mode === "PAINT") {
      alert("U modu 'samo soboslikar' područje bez parketa nije potrebno.");
      return;
    }
    const w = parseNumber(form.fNoPW.value); pos(w, "Širina");
    const l = parseNumber(form.fNoPL.value); pos(l, "Dužina");

    state.nop.push({ w, l });

    form.fNoPW.value = ""; form.fNoPL.value = "";

    renderList(form.nopList, state.nop,
      (a, i) => `Bez parketa ${i+1}: ${a.w} × ${a.l} m`,
      (idx) => { state.nop.splice(idx, 1); renderAllLists(); }
    );
  } catch (e) {
    alert("Greška (bez parketa): " + e.message);
  }
});

function renderAllLists() {
  renderList(form.roomsList, state.rooms,
    (r, i) => `Prostorija ${i+1}: ${r.w} × ${r.l} × ${r.h} m`,
    (idx) => { state.rooms.splice(idx, 1); renderAllLists(); }
  );
  renderList(form.opensList, state.opens,
    (o, i) => `Otvor ${i+1}: ${o.w} × ${o.h} m`,
    (idx) => { state.opens.splice(idx, 1); renderAllLists(); }
  );
  renderList(form.nopList, state.nop,
    (a, i) => `Bez parketa ${i+1}: ${a.w} × ${a.l} m`,
    (idx) => { state.nop.splice(idx, 1); renderAllLists(); }
  );
}

form.calcFormBtn.addEventListener("click", () => {
  try {
    if (state.rooms.length === 0) {
      alert("Dodaj barem jednu prostoriju.");
      return;
    }
    recalcFromForm();
    showFinal();
  } catch (e) {
    alert("Greška (izračun): " + e.message);
  }
});

/* ---------- init ---------- */
show(ui.viewMenu);
