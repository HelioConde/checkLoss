const {chromium}=require("playwright");
const {spawn}=require("node:child_process");
const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");
const screenshots="screenshots";fs.mkdirSync(screenshots,{recursive:true});
const server=spawn("python3",["-m","http.server","8444","--bind","127.0.0.1"],{stdio:"ignore"});
const sleep=t=>new Promise(r=>setTimeout(r,t));
async function open(browser,viewport){
 const context=await browser.newContext({viewport,reducedMotion:"reduce",acceptDownloads:true}),page=await context.newPage(),errors=[];
 page.on("pageerror",x=>errors.push(x.message));
 page.on("console",x=>{if(x.type()==="error")errors.push(x.text());});
 let ok=false;for(let i=0;i<20;i++){try{await page.goto("http://127.0.0.1:8444/",{waitUntil:"networkidle",timeout:3500});ok=true;break;}catch{await sleep(500);}}
 assert(ok,"Servidor nao inicializou");
 await page.getByRole("heading",{name:/Entenda suas perdas/}).waitFor();
 return {page,context,errors};
}
async function run(){
 const browser=await chromium.launch({headless:true});
 try{
  const {page,context,errors}=await open(browser,{width:1280,height:900});
  assert.equal(await page.locator("#rows tr").count(),8);
  await page.getByRole("button",{name:/Nova ocorrência/}).click();
  await page.locator("#sector").selectOption("Mercearia");
  await page.locator("#reason").selectOption("Quebra");
  await page.locator("#quantity").fill("4");
  await page.locator("#value").fill("44.90");
  await page.getByRole("button",{name:"Salvar ocorrência"}).click();
  assert.equal(await page.locator("#rows tr").count(),9,"Criacao falhou");
  await page.reload({waitUntil:"networkidle"});
  assert.equal(await page.locator("#rows tr").count(),9,"Persistencia falhou");
  await page.locator("#sector-filter").selectOption("Mercearia");
  assert.equal(await page.locator("#rows tr").count(),3,"Filtro falhou");
  await page.locator("#search").fill("Quebra");
  assert.equal(await page.locator("#rows tr").count(),1,"Busca falhou");
  const [csv]=await Promise.all([page.waitForEvent("download"),page.getByRole("button",{name:"CSV"}).click()]);
  assert(csv.suggestedFilename().endsWith(".csv"));
  await page.locator("#clear-filters").click();
  const before=await page.locator("#rows tr").count();
  page.once("dialog",d=>d.accept());
  await page.getByRole("button",{name:/Excluir ocorrência/}).last().click();
  assert.equal(await page.locator("#rows tr").count(),before-1,"Exclusao falhou");
  assert.deepEqual(errors,[],"Erros JavaScript apos CRUD");
  await page.screenshot({path:path.join(screenshots,"1280-crud.png"),fullPage:true});
  await context.close();
  for(const width of [360,390,768,1366,1600]){
   const {page:p,context:ctx,errors:errs}=await open(browser,{width,height:width<500?844:900});
   const measure=await p.evaluate(()=>({scroll:document.documentElement.scrollWidth,viewport:innerWidth}));
   assert(measure.scroll<=measure.viewport+2,"Overflow: "+JSON.stringify({width,measure}));
   assert.deepEqual(errs,[],"Erros JS em "+width+"px");
   await p.screenshot({path:path.join(screenshots,width+".png"),fullPage:true});
   await ctx.close();
  }
  console.log("QA OK: CRUD, persistencia, filtro, busca, CSV, exclusao, 5 viewports e screenshots.");
 }finally{await browser.close();}
}
run().catch(err=>{console.error(err);process.exitCode=1;}).finally(()=>server.kill("SIGTERM"));
