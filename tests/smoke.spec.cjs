const { test, expect } = require("@playwright/test");
test("exibe a demonstração e captura imagem sem overflow nem erros JS", async ({ page }, testInfo) => {
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/");
  await expect(page.locator("#datasetStatus")).toContainText("dados inteiramente fictícios");
  await expect(page.locator("#recordCount")).toHaveText("10");
  await expect(page.locator("#recordsBody tr")).toHaveCount(10);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("inicio.png"), fullPage: true, animations: "disabled" });
  expect(errors).toEqual([]);
});
test("filtra por setor e remove filtros", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#recordCount")).toHaveText("10");
  await page.locator("#sectorFilter").selectOption("Açougue");
  await expect(page.locator("#recordCount")).toHaveText("2");
  await page.getByRole("button", { name: "Limpar filtros" }).click();
  await expect(page.locator("#recordCount")).toHaveText("10");
});
test("importa JSON local e calcula indicadores", async ({ page }) => {
  await page.goto("/");
  const fixture = [{ date: "2026-10-27", sector: "Teste", reason: "Avaria", quantity: 3, amount: 25.5 }];
  await page.locator("#importFile").setInputFiles({
    name: "teste.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(fixture))
  });
  await expect(page.locator("#recordCount")).toHaveText("1");
  await expect(page.locator("#totalLoss")).toContainText("25,50");
  await expect(page.locator("#datasetStatus")).toContainText("Dados importados");
  await page.reload();
  await expect(page.locator("#recordCount")).toHaveText("1");
});
test("rejeita arquivo inválido sem substituir dados", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#recordCount")).toHaveText("10");
  await page.locator("#importFile").setInputFiles({
    name: "invalido.json", mimeType: "application/json", buffer: Buffer.from('{"secrets":"nao"}')
  });
  await expect(page.locator("#errorMessage")).toContainText("Não foi possível importar");
  await expect(page.locator("#recordCount")).toHaveText("10");
});
test("acessibilidade: foco e movimento reduzido", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Filtros" })).toBeVisible();
  const duration = await page.locator(".btn.primary").evaluate(el => getComputedStyle(el).transitionDuration);
  expect(Number.parseFloat(duration)).toBeLessThan(0.02);
});

test("exportação CSV trata textos que parecem fórmulas como texto seguro", async ({ page }) => {
  await page.goto("/");
  const fixture = [{
    date: "2026-10-27", sector: "=1+1", reason: "@SUM(1,2)",
    quantity: 2, amount: 19.99
  }];
  await page.locator("#importFile").setInputFiles({
    name: "formula.json", mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(fixture))
  });
  await expect(page.locator("#sectorChart")).toContainText("=1+1");
  const downloadPromise = page.waitForEvent("download");
  await page.locator("#exportCsv").click();
  const download = await downloadPromise;
  const csv = require("node:fs").readFileSync(await download.path(), "utf8");
  expect(csv).toContain("\"'=1+1\"");
  expect(csv).toContain("\"'@SUM(1,2)\"");
  expect(csv).toContain("\"19,99\"");
});

test("importação por teclado funciona com Enter e Espaço sem foco duplicado", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#recordCount")).toHaveText("10");
  const upload = page.getByRole("button", { name: "Importar arquivo JSON" });
  await upload.focus();
  await expect(upload).toBeFocused();
  expect(await page.locator("#importFile").evaluate(input => input.tabIndex)).toBe(-1);
  const firstPicker = page.waitForEvent("filechooser");
  await page.keyboard.press("Enter");
  await (await firstPicker).setFiles({
    name: "teclado-enter.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify([{ date: "2026-10-27", sector: "Teclado Enter", reason: "Exemplo", quantity: 2, amount: 15 }]))
  });
  await expect(page.locator("#recordCount")).toHaveText("1");
  await expect(page.locator("#datasetStatus")).toContainText("Dados importados");

  await upload.focus();
  const secondPicker = page.waitForEvent("filechooser");
  await page.keyboard.press("Space");
  await (await secondPicker).setFiles({
    name: "teclado-espaco.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify([{ date: "2026-10-27", sector: "Teclado Espaço", reason: "Exemplo", quantity: 1, amount: 29.9 }]))
  });
  await expect(page.locator("#recordCount")).toHaveText("1");
  await expect(page.locator("#sectorChart")).toContainText("Teclado Espaço");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});

test("data inicial maior que a final mostra erro e bloqueia CSV filtrado", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#recordCount")).toHaveText("10");
  await page.locator("#fromDate").fill("2026-10-20");
  await page.locator("#toDate").fill("2026-10-01");
  await expect(page.locator("#dateRangeError")).toBeVisible();
  await expect(page.locator("#dateRangeError")).toContainText("data inicial deve ser anterior");
  await expect(page.locator("#fromDate")).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator("#toDate")).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator("#recordCount")).toHaveText("0");
  await expect(page.locator("#exportCsv")).toBeDisabled();

  await page.locator("#toDate").fill("2026-10-23");
  await expect(page.locator("#dateRangeError")).toBeHidden();
  await expect(page.locator("#fromDate")).toHaveAttribute("aria-invalid", "false");
  await expect(page.locator("#recordCount")).toHaveText("2");
  await expect(page.locator("#exportCsv")).toBeEnabled();
  await page.locator("#clearFilters").click();
  await expect(page.locator("#recordCount")).toHaveText("10");
  await expect(page.locator("#dateRangeError")).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});
