export const toCents = n => Math.round((Number(n) || 0) * 100);
export const fromCents = n => Math.round(n) / 100;
export const brl = n => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(n);
export const localDate = () => { const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-'); };
export const id = () => globalThis.crypto?.randomUUID?.() || String(Date.now())+'-'+Math.random().toString(36).slice(2);
export const clean = s => String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const emptyData = () => ({schemaVersion:1,incomes:[],materials:[],purchases:[],expenses:[],settings:{openingBalance:0,extraReserve:0}});
const total = (a,filter=()=>true) => a.filter(filter).reduce((s,r)=>s+toCents(r.amount),0);
export function metrics(d){
 const inc=d.incomes||[],exp=d.expenses||[],pur=d.purchases||[],mat=d.materials||[],settings=d.settings||{};
 const received=total(inc,x=>x.paid),receivable=total(inc,x=>!x.paid);
 const expensesPaid=total(exp,x=>x.paid),expensesDue=total(exp,x=>!x.paid);
 const purchasePaid=total(pur,x=>x.paid),purchaseDue=total(pur,x=>!x.paid);
 const replenish=mat.reduce((s,m)=>s+toCents(Math.max(0,Number(m.target)-Number(m.quantity))*Number(m.unitPrice)),0);
 const reserve=toCents(settings.extraReserve);
 const cash=toCents(settings.openingBalance)+received-expensesPaid-purchasePaid;
 const available=cash-expensesDue-purchaseDue-replenish-reserve;
 const month=localDate().slice(0,7);
 const receivedMonth=total(inc,x=>x.paid&&(x.paymentDate||x.date).startsWith(month));
 const expensesMonth=total(exp,x=>x.paid&&(x.paymentDate||x.date).startsWith(month));
 const purchasesMonth=total(pur,x=>x.paid&&(x.paymentDate||x.date).startsWith(month));
 return Object.fromEntries(Object.entries({received,receivable,expensesPaid,expensesDue,purchasePaid,purchaseDue,replenish,reserve,cash,available,receivedMonth,expensesMonth,purchasesMonth}).map(([k,v])=>[k,fromCents(v)]));
}
export function validate(data){
 if(!data||typeof data!=='object'||data.schemaVersion!==1) throw Error('Arquivo de backup incompatível.');
 for(const k of ['incomes','expenses','materials','purchases']){
  if(!Array.isArray(data[k])||data[k].length>100000)throw Error('Registros inválidos: '+k);
  if(new Set(data[k].map(x=>x.id)).size!==data[k].length)throw Error('Há registros duplicados.');
  for(const x of data[k])if(!x||typeof x!=='object'||typeof x.id!=='string')throw Error('Registro sem identificação.');
 }
 if(!data.settings||typeof data.settings!=='object')throw Error('Configurações inválidas.');
 const validNum=x=>typeof x==='number'&&Number.isFinite(x)&&x>=0&&x<=1e12;
 for(const k of ['openingBalance','extraReserve'])if(!validNum(data.settings[k]))throw Error('Valor inválido em configurações.');
 const check=(xs,keys)=>{for(const x of xs)for(const key of keys)if(!validNum(x[key]))throw Error('Valor financeiro inválido: '+key);};
 check(data.incomes,['amount']);check(data.expenses,['amount']);check(data.purchases,['amount','quantity','unitPrice']);check(data.materials,['quantity','target','min','unitPrice']);
 for(const key of ['incomes','expenses','purchases']) for(const x of data[key]) if(typeof x.paid!=='boolean'||!(/^\d{4}-\d{2}-\d{2}$/.test(x.date||''))) throw Error('Data ou situação de pagamento inválida.');
 const ids=new Set(data.materials.map(x=>x.id));
 for(const p of data.purchases)if(!ids.has(p.materialId))throw Error('Compra ligada a material inexistente.');
 for(const i of data.incomes){
  if(!Array.isArray(i.usage))throw Error('Consumo de materiais inválido.');
  for(const u of i.usage) if(!ids.has(u.materialId)||!validNum(u.quantity)||!validNum(u.unitPrice))throw Error('Consumo inválido.');
 }
 return data;
}