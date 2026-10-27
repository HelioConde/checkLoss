// checkLoss e uma demonstracao offline: sem envio de informacoes para servidores.
const KEY="checkloss:records:v1";
const SECTORS=["Hortifruti","Mercearia","Padaria","Frios","Higiene","Outros"];
const REASONS=["Vencimento","Avaria","Quebra","Qualidade","Outros"];
const $=id=>document.getElementById(id);
const money=n=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(n);
const formatDate=s=>new Date(s+"T12:00:00").toLocaleDateString("pt-BR");
const getDay=offset=>{const d=new Date();d.setDate(d.getDate()+offset);return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");};
const examples=[
  ["Hortifruti","Qualidade",8,74.9,-1],["Mercearia","Avaria",5,125,-2],
  ["Padaria","Vencimento",12,68.4,-3],["Frios","Vencimento",3,98.7,-4],
  ["Higiene","Quebra",2,48.5,-5],["Hortifruti","Qualidade",11,110.5,-6],
  ["Mercearia","Vencimento",7,154.2,-7],["Padaria","Avaria",4,32,-8]
].map((x,i)=>({id:"ex-"+(i+1),data:getDay(x[4]),setor:x[0],motivo:x[1],quantidade:x[2],valor:x[3],observacoes:"Exemplo fictício, sem dados reais."}));
const text=x=>String(x??"").trim();
function isDate(x){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(x))return false;
  const [y,m,d]=x.split("-").map(Number),valid=new Date(Date.UTC(y,m-1,d));
  return valid.getUTCFullYear()===y&&valid.getUTCMonth()+1===m&&valid.getUTCDate()===d&&y>=2000&&y<=2100;
}
function normalize(r){
  if(!r||typeof r!=="object"||Array.isArray(r))throw Error("Registro inválido.");
  const id=text(r.id),data=text(r.data),setor=text(r.setor),motivo=text(r.motivo),observacoes=text(r.observacoes);
  const quantidade=Number(r.quantidade),valor=Number(r.valor);
  if(!id||id.length>100||!isDate(data)||!SECTORS.includes(setor)||!REASONS.includes(motivo))throw Error("Data, setor ou motivo inválido.");
  if(!Number.isInteger(quantidade)||quantidade<1||quantidade>99999||!Number.isFinite(valor)||valor<0||valor>1000000||Math.round(valor*100)/100!==valor)throw Error("Quantidade ou valor inválido.");
  if(observacoes.length>160)throw Error("Observações excedem 160 caracteres.");
  return {id,data,setor,motivo,quantidade,valor,observacoes};
}
let records=[];
let editing=null,previousFocus=null,toastTimeout;
function toast(message){$("toast").textContent=message;clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>$("toast").textContent="",4500);}
function save(){try{localStorage.setItem(KEY,JSON.stringify(records));return true;}catch{toast("O armazenamento local está indisponível. Exporte seu backup.");return false;}}
function load(){
  try{
    const raw=localStorage.getItem(KEY);
    if(raw===null){records=examples.map(normalize);save();return;}
    const parsed=JSON.parse(raw);
    if(!Array.isArray(parsed)||parsed.length>500)throw Error("Dados inválidos");
    records=parsed.map(normalize);
  }catch{records=examples.map(normalize);toast("Dados locais inválidos. Exibindo exemplos fictícios.");}
}
function make(tag,cls,content){
  const n=document.createElement(tag);if(cls)n.className=cls;if(content!==undefined)n.textContent=content;return n;
}
const search=x=>String(x).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("pt-BR");
function render(){
  const term=search($("search").value.trim()),filter=$("sector-filter").value;
  const showing=records.filter(r=>(!filter||r.setor===filter)&&(!term||search([r.setor,r.motivo,r.observacoes,r.data].join(" ")).includes(term)));
  const total=showing.reduce((s,r)=>s+r.valor,0),quantity=showing.reduce((s,r)=>s+r.quantidade,0);
  const sectorTotals=new Map(SECTORS.map(s=>[s,0]));
  for(const r of showing)sectorTotals.set(r.setor,sectorTotals.get(r.setor)+r.valor);
  const sorted=[...sectorTotals.entries()].filter(x=>x[1]>0).sort((a,b)=>b[1]-a[1]);
  $("sum-value").textContent=money(total);
  $("sum-events").textContent=showing.length;
  $("sum-units").textContent=quantity.toLocaleString("pt-BR");
  $("sum-sector").textContent=sorted[0]?.[0]||"—";
  $("result-count").textContent=showing.length+" de "+records.length+" registros";
  const bars=$("bars");bars.replaceChildren();
  if(!sorted.length)bars.append(make("p","hint","Sem valores para exibir."));
  for(const [sector,value] of sorted){
    const item=make("div");item.setAttribute("role","listitem");
    const label=make("div","bar-label");label.append(make("strong","",sector),make("span","",money(value)));
    const track=make("div","bar-track"),fill=make("div","bar-fill");
    fill.style.width=String(Math.round(100*value/sorted[0][1]))+"%";
    track.append(fill);item.append(label,track);bars.append(item);
  }
  const body=$("rows");body.replaceChildren();$("empty").hidden=showing.length!==0;
  const titles=["Data","Setor","Motivo","Quantidade","Valor","Ação"];
  for(const r of showing){
    const tr=make("tr");
    [formatDate(r.data),r.setor,r.motivo,String(r.quantidade),money(r.valor)].forEach((v,i)=>{
      const td=make("td");td.dataset.label=titles[i];
      td.append(i===1?make("strong","",v):i===2?make("span","pill",v):make("span","",v));
      tr.append(td);
    });
    const act=make("td");act.dataset.label="Ação";
    const edit=make("button","secondary","Editar");edit.type="button";edit.setAttribute("aria-label","Editar ocorrência de "+r.setor);edit.addEventListener("click",()=>openForm(r));
    const del=make("button","delete","Excluir");del.type="button";del.setAttribute("aria-label","Excluir ocorrência de "+r.setor);
    del.addEventListener("click",()=>{if(!confirm("Excluir esta ocorrência de demonstração? A ação não pode ser desfeita."))return;records=records.filter(x=>x.id!==r.id);save();render();toast("Ocorrência excluída.");});
    act.append(edit,document.createTextNode(" "),del);tr.append(act);body.append(tr);
  }
}
function openForm(record){
  editing=record?.id??null;previousFocus=document.activeElement;
  $("record-form").reset();$("form-error").hidden=true;
  $("dialog-title").textContent=record?"Editar ocorrência":"Registrar perda";
  $("date").value=record?.data||getDay(0);
  $("sector").value=record?.setor||SECTORS[0];
  $("reason").value=record?.motivo||REASONS[0];
  $("quantity").value=record?.quantidade??1;
  $("value").value=record?.valor??"";
  $("notes").value=record?.observacoes||"";
  $("form-dialog").showModal();$("date").focus();
}
function submit(e){
  e.preventDefault();$("form-error").hidden=true;
  if(!$("record-form").checkValidity()){$("record-form").reportValidity();return;}
  try{
    if(!editing&&records.length>=500)throw Error("Limite de 500 registros nesta demonstração.");
    const entry=normalize({id:editing||("loss-"+Date.now()+"-"+Math.random().toString(36).slice(2,8)),data:$("date").value,setor:$("sector").value,motivo:$("reason").value,quantidade:$("quantity").value,valor:$("value").value,observacoes:$("notes").value});
    const wasEdit=editing!==null;
    if(wasEdit)records=records.map(r=>r.id===editing?entry:r);else records.unshift(entry);
    save();render();$("form-dialog").close();toast(wasEdit?"Ocorrência atualizada.":"Ocorrência criada.");
  }catch(err){$("form-error").textContent=err.message;$("form-error").hidden=false;}
}
function download(name,type,content){
  const url=URL.createObjectURL(new Blob([content],{type})),a=document.createElement("a");
  a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);
}
const quote=x=>'"'+String(x??"").replace(/"/g,'""')+'"';
function exportCsv(){
  const header=["Data","Setor","Motivo","Quantidade","Valor (BRL)","Observacoes"];
  const lines=[header,...records.map(r=>[r.data,r.setor,r.motivo,r.quantidade,r.valor.toFixed(2),r.observacoes])];
  download("checkloss-"+getDay(0)+".csv","text/csv;charset=utf-8","\uFEFF"+lines.map(line=>line.map(quote).join(";")).join("\r\n"));toast("CSV exportado.");
}
function exportJson(){
  download("checkloss-backup-"+getDay(0)+".json","application/json",JSON.stringify({versao:1,exportadoEm:new Date().toISOString(),records},null,2));toast("Backup JSON exportado.");
}
async function importJson(e){
  const file=e.target.files?.[0];e.target.value="";if(!file)return;
  try{
    if(file.size>1_000_000)throw Error("Arquivo acima de 1 MB.");
    const content=JSON.parse(await file.text()),array=Array.isArray(content)?content:content?.records;
    if(!Array.isArray(array)||array.length>500)throw Error("Informe uma lista JSON de até 500 registros.");
    const parsed=array.map(normalize),ids=new Set(parsed.map(r=>r.id));
    if(parsed.length!==ids.size)throw Error("Existem IDs duplicados.");
    if(!confirm("Substituir TODOS os registros locais pelos "+parsed.length+" registros do arquivo? Faça backup antes."))return;
    records=parsed;save();render();toast("Backup restaurado.");
  }catch(err){toast("Importação recusada: "+err.message);}
}
$("add-record").addEventListener("click",()=>openForm());
$("record-form").addEventListener("submit",submit);
$("close-dialog").addEventListener("click",()=>$("form-dialog").close());
$("cancel-dialog").addEventListener("click",()=>$("form-dialog").close());
$("form-dialog").addEventListener("close",()=>previousFocus?.focus());
$("search").addEventListener("input",render);
$("sector-filter").addEventListener("change",render);
$("clear-filters").addEventListener("click",()=>{$("search").value="";$("sector-filter").value="";render();$("search").focus();});
$("export-csv").addEventListener("click",exportCsv);
$("export-json").addEventListener("click",exportJson);
$("import-json").addEventListener("change",importJson);
load();render();
