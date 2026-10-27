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
