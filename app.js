const $ = (id) => document.getElementById(id);
const KEY = "checkloss-records-v1";
const LOCALE = new Intl.NumberFormat("pt-BR");
const MONEY = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const MAX_ROWS = 5000;
const MAX_BYTES = 5 * 1024 * 1024;
let rows = [];
let source = "demo";
let displayed = [];
const initialFilters = { sector: "", from: "", to: "", query: "" };
function create(tag, className, value) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (value !== undefined) el.textContent = String(value);
  return el;
}
function parseAmount(value) {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return NaN;
  let raw = value.trim().replace(/\s|R\$/gi, "");
  if (raw.includes(",")) raw = raw.replace(/\./g, "").replace(",", ".");
  return Number(raw);
}
function normalize(data) {
  const entries = Array.isArray(data) ? data : data?.records;
  if (!Array.isArray(entries)) throw new Error("O JSON deve ser uma lista de registros ou conter a propriedade records.");
  if (entries.length > MAX_ROWS) throw new Error("Limite excedido: importe até 5.000 registros.");
  return entries.map((item, i) => {
    if (!item || typeof item !== "object") throw new Error("Registro " + (i + 1) + " inválido.");
    const date = String(item.date ?? "").trim();
    const sector = String(item.sector ?? "").trim();
    const reason = String(item.reason ?? "").trim();
    const amount = parseAmount(item.amount);
    const quantity = item.quantity === undefined || item.quantity === "" ? 0 : Number(item.quantity);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date + "T12:00:00")) || new Date(date + "T12:00:00").toISOString().slice(0, 10) !== date) throw new Error("Data inválida no registro " + (i + 1) + ". Use AAAA-MM-DD.");
    if (!sector || !reason || sector.length > 90 || reason.length > 120) throw new Error("Setor ou motivo ausente/inválido no registro " + (i + 1) + ".");
    if (!Number.isFinite(amount) || amount < 0 || amount > 1e12) throw new Error("Valor inválido no registro " + (i + 1) + ".");
    if (!Number.isFinite(quantity) || quantity < 0 || quantity > 1e9) throw new Error("Quantidade inválida no registro " + (i + 1) + ".");
    return { date, sector, reason, amount, quantity };
  });
}
function showError(message = "") { $("errorMessage").textContent = message; $("errorMessage").hidden = !message; }
function showStatus() {
  const label = source === "demo" ? "Modo demonstração · dados inteiramente fictícios" : "Dados importados · salvos somente neste navegador";
  $("datasetStatus").textContent = label + " · " + LOCALE.format(rows.length) + " registros";
}
function setRows(value, origin, save = false) {
  rows = normalize(value);
  source = origin;
  if (save) {
    try { localStorage.setItem(KEY, JSON.stringify(rows)); }
    catch { showError("Não foi possível salvar no armazenamento local. Os dados continuam disponíveis até fechar a página."); }
  }
  refreshSectors();
  render();
  showStatus();
}
function refreshSectors() {
  const previous = $("sectorFilter").value;
  const values = [...new Set(rows.map(r => r.sector))].sort((a, b) => a.localeCompare(b, "pt-BR"));
  $("sectorFilter").replaceChildren(new Option("Todos os setores", ""), ...values.map(s => new Option(s, s)));
  $("sectorFilter").value = values.includes(previous) ? previous : "";
}
function currentFilters() {
  return { sector: $("sectorFilter").value, from: $("fromDate").value, to: $("toDate").value, query: $("searchText").value.trim().toLocaleLowerCase("pt-BR") };
}
function filterRows() {
  const f = currentFilters();
  return rows.filter(r => (!f.sector || r.sector === f.sector) && (!f.from || r.date >= f.from) && (!f.to || r.date <= f.to) && (!f.query || (r.sector + " " + r.reason).toLocaleLowerCase("pt-BR").includes(f.query)))
    .sort((a, b) => b.date.localeCompare(a.date) || b.amount - a.amount);
}
function aggregateBySector(records) {
  const totals = new Map();
  for (const r of records) totals.set(r.sector, (totals.get(r.sector) || 0) + r.amount);
  return [...totals].sort((a, b) => b[1] - a[1]);
}
function renderMetrics(records, groups) {
  const total = records.reduce((sum, r) => sum + r.amount, 0);
  $("totalLoss").textContent = MONEY.format(total);
  $("recordCount").textContent = LOCALE.format(records.length);
  $("quantityCount").textContent = LOCALE.format(records.reduce((sum, r) => sum + r.quantity, 0));
  $("sectorCount").textContent = LOCALE.format(groups.length);
}
function renderChart(groups) {
  const chart = $("sectorChart");
  chart.replaceChildren();
  if (!groups.length) { chart.append(create("p", "empty", "Nenhum registro corresponde aos filtros.")); return; }
  const max = Math.max(...groups.map(group => group[1]), 1);
  for (const [name, total] of groups.slice(0, 10)) {
    const row = create("div", "bar-row");
    const label = create("div", "bar-label");
    label.append(create("span", "", name), create("strong", "", MONEY.format(total)));
    const track = create("div", "bar-track");
    const fill = create("div", "bar-fill");
    fill.style.width = (100 * total / max).toFixed(1) + "%";
    fill.setAttribute("role", "img");
    fill.setAttribute("aria-label", name + ": " + MONEY.format(total));
    track.append(fill); row.append(label, track); chart.append(row);
  }
}
function renderInsights(records, groups) {
  const target = $("insightContent"); target.replaceChildren();
  if (!records.length) { target.append(create("p", "empty", "Ajuste os filtros ou importe registros para ver destaques.")); return; }
  const reasons = new Map();
  for (const r of records) reasons.set(r.reason, (reasons.get(r.reason) || 0) + r.amount);
  const majorReason = [...reasons].sort((a, b) => b[1] - a[1])[0];
  const items = [["Setor com maior valor", groups[0]?.[0] ?? "—"], ["Motivo com maior valor", majorReason?.[0] ?? "—"], ["Maior perda individual", MONEY.format(Math.max(...records.map(r => r.amount)))]];
  for (const [label, value] of items) {
    const card = create("div", "insight-item");
    card.append(create("small", "", label), create("strong", "", value));
    target.append(card);
  }
}
function displayDate(iso) { const [y, m, d] = iso.split("-"); return d + "/" + m + "/" + y; }
function renderTable(records) {
  const body = $("recordsBody"); body.replaceChildren();
  $("tableCount").textContent = LOCALE.format(records.length) + (records.length === 1 ? " registro" : " registros");
  if (!records.length) {
    const tr = create("tr"); const td = create("td", "empty", "Nenhum resultado para os filtros selecionados."); td.colSpan = 5; tr.append(td); body.append(tr); return;
  }
  for (const r of records.slice(0, 500)) {
    const tr = create("tr");
    for (const val of [displayDate(r.date), r.sector, r.reason, LOCALE.format(r.quantity), MONEY.format(r.amount)]) tr.append(create("td", "", val));
    tr.children[3].className = "num"; tr.children[4].className = "num"; body.append(tr);
  }
  if (records.length > 500) {
    const tr = create("tr"), td = create("td", "empty", "Exibindo 500 linhas. Exporte CSV para ver todos os registros filtrados."); td.colSpan = 5; tr.append(td); body.append(tr);
  }
}
function render() {
  displayed = filterRows();
  const groups = aggregateBySector(displayed);
  renderMetrics(displayed, groups); renderChart(groups); renderInsights(displayed, groups); renderTable(displayed);
  $("exportCsv").disabled = !displayed.length;
}
function csvEscape(value, protectFormula = false) {
  const raw = String(value);
  // Defende rótulos importados contra interpretação como fórmulas em planilhas.
  // Valores numéricos e datas permanecem intactos.
  const safe = protectFormula && /^[\s\x00-\x1f]*[=+@-]/u.test(raw) ? "'" + raw : raw;
  return '"' + safe.replace(/"/g, '""') + '"';
}
function exportCsv() {
  if (!displayed.length) return;
  const header = ["Data", "Setor", "Motivo", "Quantidade", "Valor (BRL)"];
  const lines = [header, ...displayed.map(r => [r.date, r.sector, r.reason, r.quantity, r.amount.toFixed(2).replace(".", ",")])].map(line => line.map((field, index) => csvEscape(field, index === 1 || index === 2)).join(";"));
  const url = URL.createObjectURL(new Blob(["\ufeff" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a"); a.href = url; a.download = "checkloss-perdas.csv"; document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
async function example() {
  const response = await fetch("./sample-data.json");
  if (!response.ok) throw new Error("Não foi possível carregar os dados fictícios.");
  return normalize(await response.json());
}
async function restoreDemo() {
  if (source !== "demo" && !confirm("Apagar os dados importados deste navegador e restaurar os exemplos fictícios?")) return;
  showError("");
  try { const sample = await example(); localStorage.removeItem(KEY); resetFilters(); setRows(sample, "demo"); }
  catch (e) { showError(e.message); }
}
function resetFilters() {
  for (const [name, value] of Object.entries({ sectorFilter: "", fromDate: "", toDate: "", searchText: "" })) $(name).value = value;
}
async function importFile(file) {
  if (!file) return;
  showError("");
  if (file.size > MAX_BYTES) { showError("Arquivo acima de 5 MB. Reduza o tamanho antes da importação."); return; }
  try {
    const input = JSON.parse(await file.text());
    const cleaned = normalize(input);
    resetFilters(); setRows(cleaned, "import", true);
  } catch (e) { showError("Não foi possível importar: " + e.message); }
}
$("uploadButton").addEventListener("keydown", event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); $("importFile").click(); } });
for (const id of ["sectorFilter", "fromDate", "toDate", "searchText"]) $(id).addEventListener("input", render);
$("clearFilters").addEventListener("click", () => { resetFilters(); render(); });
$("exportCsv").addEventListener("click", exportCsv);
$("restoreDemo").addEventListener("click", restoreDemo);
$("importFile").addEventListener("change", async event => { await importFile(event.target.files?.[0]); event.target.value = ""; });
(async () => {
  try {
    const stored = localStorage.getItem(KEY);
    if (stored !== null) setRows(JSON.parse(stored), "import");
    else setRows(await example(), "demo");
  } catch {
    showError("Os dados salvos são inválidos ou o exemplo não pôde ser carregado. Use Restaurar exemplo ou importe um JSON válido.");
    setRows([], "demo");
  }
})();