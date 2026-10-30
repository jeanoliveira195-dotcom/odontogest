import {load,save} from './db.js';
import {metrics,brl,localDate,id,clean,emptyData,validate} from './finance.js';

let data=emptyData(),page='home',editingMaterial=null;
const titles={home:'Visão geral',incomes:'Atendimentos e diárias',materials:'Materiais e estoque',purchases:'Compras e reposição',expenses:'Despesas e contas',settings:'Configurações e backup'};
const links=[['home','⌂','Início'],['incomes','▤','Recebimentos'],['materials','▣','Materiais'],['purchases','↻','Compras'],['expenses','▦','Despesas'],['settings','⚙','Ajustes']];
const root=document.getElementById('screen');
const showMoney=n=>brl(n||0),text=x=>clean(x);
const prettyDate=d=>d?d.split('-').reverse().join('/'):'—';
function notify(message){const el=document.createElement('div');el.className='notice';el.textContent=message;document.getElementById('notices').replaceChildren(el);setTimeout(()=>el.remove(),4200);}
function nav(){
 for(const key of ['nav-desktop','nav-mobile'])document.getElementById(key).innerHTML=links.map(([k,i,label])=>'<button type="button" data-page="'+k+'" class="'+(page===k?'active':'')+'" aria-current="'+(page===k?'page':'false')+'"><span>'+i+'</span>'+label+'</button>').join('');
 document.getElementById('screen-title').textContent=titles[page];
}
function heading(eyebrow,title,desc){return '<div class="eyebrow">'+eyebrow+'</div><h1 class="page-title">'+title+'</h1><p class="page-desc">'+desc+'</p>';}
function stat(label,value,note,feature=false){return '<article class="card metric'+(feature?' feature':'')+(value<0?' negative':'')+'"><small>'+label+'</small><strong>'+showMoney(value)+'</strong><span class="tag">'+note+'</span></article>';}
function table(headers,rows){
 if(!rows.length)return '<div class="empty"><strong>Nenhum lançamento ainda.</strong>Seu histórico aparecerá aqui depois do primeiro registro.</div>';
 return '<div class="table-scroll"><table class="activity"><thead><tr>'+headers.map(h=>'<th>'+h+'</th>').join('')+'</tr></thead><tbody>'+rows.join('')+'</tbody></table></div>';
}
function pill(paid){return '<span class="pill'+(paid?'':' wait')+'">'+(paid?'Recebido / pago':'Pendente')+'</span>';}
function toggle(type,r){return '<button class="button button-small" data-action="toggle" data-type="'+type+'" data-id="'+text(r.id)+'">'+(r.paid?'Desfazer':'Marcar pago')+'</button>';}
function remove(type,r){return '<button class="button button-small button-danger" data-action="remove" data-type="'+type+'" data-id="'+text(r.id)+'">Excluir</button>';}
function billActions(type,r){return '<div class="actions">'+toggle(type,r)+remove(type,r)+'</div>';}
function moneyField(name,label,required=true,value=''){return '<div class="field"><label for="'+name+'">'+label+'</label><input id="'+name+'" name="'+name+'" type="number" step="0.01" min="0" '+(required?'required':'')+' value="'+text(value)+'"></div>';}
function dateField(){return '<div class="field"><label for="date">Data</label><input id="date" name="date" type="date" value="'+localDate()+'" required></div>';}
function paidField(label='Valor já recebido / pago'){return '<label class="checkline"><input type="checkbox" name="paid" checked> '+label+'</label>';}
function renderHome(){
 const m=metrics(data);
 const recent=[...data.incomes].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,6);
 const lines=recent.map(r=>'<tr><td><b>'+text(r.description)+'</b><small>'+text(r.clinic||r.kind)+'</small></td><td class="hide-mobile">'+prettyDate(r.date)+'</td><td>'+pill(r.paid)+'</td><td class="num">'+showMoney(r.amount)+'</td></tr>');
 const low=data.materials.filter(x=>x.quantity<=x.min);
 return heading('PAINEL FINANCEIRO','Suas finanças, com clareza.','Receitas, compromissos e quanto está realmente disponível para uso pessoal.')+
 '<div class="grid metrics">'+stat('Dinheiro em caixa',m.cash,'Entradas recebidas − saídas pagas')+stat('A receber',m.receivable,'Atendimentos e diárias pendentes')+stat('Compromissos e reservas',m.expensesDue+m.purchaseDue+m.replenish+m.reserve,'Contas, estoque e reserva adicional')+stat('Disponível estimado',m.available,'Após custos e valores comprometidos',true)+'</div>'+
 '<div class="grid columns"><section class="card"><div class="card-head"><h2>Últimos recebimentos</h2><button class="button button-small" data-page="incomes">Ver todos</button></div><div class="card-body">'+table(['Procedimento / diária','Data','Situação','Valor'],lines)+'</div></section>'+
 '<section class="card"><div class="card-head"><h2>Composição do saldo</h2></div><div class="card-body stack">'+
 line('Saldo em caixa',m.cash)+line('Contas a pagar',-m.expensesDue)+line('Compras pendentes',-m.purchaseDue)+line('Reserva para reposição',-m.replenish)+line('Reserva adicional',-m.reserve)+
 '<div class="outline-stat"><strong>Disponível estimado</strong><b class="'+(m.available<0?'red':'green')+'">'+showMoney(m.available)+'</b></div>'+
 (low.length?'<div class="warning">Estoque baixo: '+low.map(x=>text(x.name)).join(', ')+'</div>':'')+
 '<p class="help">O saldo é gerencial e não substitui o extrato bancário ou a apuração de impostos. Informe o caixa inicial em Ajustes. Registre materiais consumidos para atualizar a necessidade de reposição.</p></div></section></div>';
}
function line(label,n){return '<div class="outline-stat"><span>'+label+'</span><b>'+showMoney(n)+'</b></div>';}
function renderIncomes(){
 const materials=data.materials.map(m=>'<label class="material-usage"><span>'+text(m.name)+'<small>Em estoque: '+m.quantity+' '+text(m.unit)+'</small></span><input type="number" data-materialqty="'+text(m.id)+'" min="0" max="'+m.quantity+'" step="0.01" placeholder="0" aria-label="Quantidade '+text(m.name)+'"></label>').join('');
 const rows=[...data.incomes].sort((a,b)=>b.date.localeCompare(a.date)).map(r=>'<tr><td><b>'+text(r.description)+'</b><small>'+text(r.clinic||r.kind)+(r.usage?.length?' · '+r.usage.length+' material(is)':'')+'</small></td><td class="hide-mobile">'+prettyDate(r.date)+'</td><td>'+pill(r.paid)+'</td><td class="num">'+showMoney(r.amount)+'</td><td>'+billActions('incomes',r)+'</td></tr>');
 return heading('RECEITAS','Atendimentos e diárias','Lance os valores combinados, recebidos ou pendentes, e os insumos consumidos.')+
 '<section class="card form-card"><h2>Novo recebimento</h2><form id="income-form"><div class="form-grid">'+
 '<div class="field"><label>Modalidade</label><select name="kind"><option value="procedimento">Procedimento</option><option value="diaria">Diária</option></select></div>'+
 '<div class="field wide"><label>Descrição</label><input name="description" placeholder="Ex.: Limpeza, restauração ou diária" maxlength="100" required></div>'+
 '<div class="field"><label>Clínica / local</label><input name="clinic" placeholder="Opcional" maxlength="100"></div>'+dateField()+moneyField('amount','Valor a receber (R$)')+
 '<div class="field full">'+paidField('Pagamento já recebido')+'</div>'+
 (materials?'<div class="field full"><label>Materiais consumidos neste atendimento (quantidades)</label><div class="materials-usage">'+materials+'</div><small class="help">As quantidades são abatidas do estoque ao salvar, mesmo se o pagamento estiver pendente.</small></div>':'<p class="help">Cadastre materiais na aba Materiais para registrar consumo.</p>')+
 '</div><div class="form-actions"><button class="button button-primary">Registrar atendimento</button></div></form></section>'+
 '<section class="card"><div class="card-head"><h2>Histórico de receitas</h2><small>'+data.incomes.length+' lançamentos</small></div><div class="card-body">'+table(['Serviço / clínica','Data','Situação','Valor','Ações'],rows)+'</div></section>';
}
function renderMaterials(){
 const m=editingMaterial?data.materials.find(x=>x.id===editingMaterial):null;
 const rows=data.materials.map(r=>'<tr><td><b>'+text(r.name)+'</b><small>'+text(r.unit)+'</small></td><td>'+r.quantity+' / '+r.target+'</td><td class="hide-mobile">'+showMoney(r.unitPrice)+'</td><td>'+((r.quantity<=r.min)?'<span class="pill wait">Baixo estoque</span>':'<span class="pill">Normal</span>')+'</td><td><div class="actions"><button class="button button-small" data-action="editmaterial" data-id="'+text(r.id)+'">Editar</button>'+remove('materials',r)+'</div></td></tr>');
 return heading('INVENTÁRIO','Materiais e estoque','Acompanhe o custo unitário, a quantidade disponível e o estoque desejado.')+
 '<section class="card form-card"><h2>'+(m?'Editar material':'Cadastrar material')+'</h2><form id="material-form"><div class="form-grid">'+
 '<div class="field wide"><label>Material</label><input name="name" maxlength="100" required placeholder="Ex.: Luvas descartáveis" value="'+text(m?.name||'')+'"></div>'+
 '<div class="field"><label>Unidade de consumo</label><input name="unit" required maxlength="30" placeholder="Unidade, par, ml..." value="'+text(m?.unit||'un')+'"></div>'+
 moneyField('quantity','Estoque atual',true,m?.quantity??0)+moneyField('target','Quantidade desejada',true,m?.target??0)+moneyField('min','Alerta quando atingir',true,m?.min??0)+moneyField('unitPrice','Custo unitário (R$)',true,m?.unitPrice??0)+
 '</div><div class="form-actions">'+(m?'<button type="button" class="button" data-action="cancelmaterial">Cancelar</button>':'')+'<button class="button button-primary">'+(m?'Salvar alterações':'Cadastrar material')+'</button></div></form></section>'+
 '<section class="card"><div class="card-head"><h2>Inventário</h2><small>'+data.materials.length+' itens</small></div><div class="card-body">'+table(['Material','Atual / desejado','Custo unit.','Situação','Ações'],rows)+'</div></section>';
}
function renderPurchases(){
 const opts=data.materials.map(m=>'<option value="'+text(m.id)+'">'+text(m.name)+'</option>').join('');
 const rows=[...data.purchases].sort((a,b)=>b.date.localeCompare(a.date)).map(r=>{const m=data.materials.find(x=>x.id===r.materialId);return '<tr><td><b>'+text(m?.name||'Material')+'</b><small>'+r.quantity+' × '+showMoney(r.unitPrice)+'</small></td><td class="hide-mobile">'+prettyDate(r.date)+'</td><td>'+pill(r.paid)+'</td><td class="num">'+showMoney(r.amount)+'</td><td>'+billActions('purchases',r)+'</td></tr>';});
 return heading('REPOSIÇÃO','Compras de materiais','Toda compra aumenta o estoque. Compras a prazo são reservadas até o pagamento.')+
 (opts?'<section class="card form-card"><h2>Nova compra</h2><form id="purchase-form"><div class="form-grid">'+
 '<div class="field wide"><label>Material</label><select name="materialId" required>'+opts+'</select></div>'+dateField()+moneyField('quantity','Quantidade comprada')+moneyField('unitPrice','Custo unitário (R$)')+'<div class="field full">'+paidField('Compra já paga')+'</div>'+
 '</div><div class="form-actions"><button class="button button-primary">Registrar compra</button></div></form></section>':'<div class="warning">Cadastre um material antes de registrar a primeira compra.</div>')+
 '<section class="card"><div class="card-head"><h2>Histórico de compras</h2></div><div class="card-body">'+table(['Material','Data','Situação','Total','Ações'],rows)+'</div></section>';
}
function renderExpenses(){
 const rows=[...data.expenses].sort((a,b)=>b.date.localeCompare(a.date)).map(r=>'<tr><td><b>'+text(r.description)+'</b><small>'+text(r.category)+'</small></td><td class="hide-mobile">'+prettyDate(r.date)+'</td><td>'+pill(r.paid)+'</td><td class="num">'+showMoney(r.amount)+'</td><td>'+billActions('expenses',r)+'</td></tr>');
 return heading('DESPESAS','Despesas e contas','Separe compromissos futuros do dinheiro que já saiu do caixa.')+
 '<section class="card form-card"><h2>Nova despesa</h2><form id="expense-form"><div class="form-grid">'+
 '<div class="field wide"><label>Descrição</label><input name="description" maxlength="100" placeholder="Ex.: Transporte, aluguel, internet..." required></div>'+
 '<div class="field"><label>Categoria</label><select name="category"><option>Profissional</option><option>Pessoal</option><option>Transporte</option><option>Tributos</option><option>Outros</option></select></div>'+
 dateField()+moneyField('amount','Valor da despesa (R$)')+'<div class="field full">'+paidField('Despesa já paga')+'</div>'+
 '</div><div class="form-actions"><button class="button button-primary">Registrar despesa</button></div></form></section>'+
 '<section class="card"><div class="card-head"><h2>Histórico de despesas</h2></div><div class="card-body">'+table(['Despesa','Data','Situação','Valor','Ações'],rows)+'</div></section>';
}
function renderSettings(){
 return heading('PREFERÊNCIAS','Ajustes e segurança','Controle seu saldo inicial e mantenha cópias dos seus dados.')+
 '<section class="card form-card widebox"><h2>Configurações financeiras</h2><form id="settings-form"><div class="form-grid">'+moneyField('openingBalance','Saldo inicial de caixa (R$)',true,data.settings.openingBalance)+moneyField('extraReserve','Reserva financeira adicional (R$)',true,data.settings.extraReserve)+'</div><div class="form-actions"><button class="button button-primary">Salvar configurações</button></div></form><p class="help">O saldo inicial é o dinheiro profissional disponível antes dos lançamentos cadastrados. Para reservar impostos ou despesas futuras, use a reserva adicional ou registre a obrigação em Despesas.</p></section>'+
 '<section class="card form-card widebox"><h2>Backup e recuperação</h2><p class="page-desc">Seus dados ficam apenas neste navegador. Para transferir ao Android ou Chromebook, exporte o JSON e importe-o no outro dispositivo.</p>'+
 '<div class="summarybar"><button class="button button-primary" data-action="export">Exportar backup JSON</button><button class="button" data-action="import">Importar backup JSON</button></div>'+
 '<div class="warning">A importação substitui todos os registros atuais deste dispositivo. Salve antes um backup. O arquivo não é criptografado; guarde-o em local seguro.</div></section>'+
 '<section class="card form-card widebox"><h2>Privacidade</h2><p class="page-desc">Este aplicativo não exige conta e não envia os registros para um servidor. Não registre nomes de pacientes nem informações clínicas identificáveis; o OdontoGest é um controle financeiro, não um prontuário.</p><p class="help">Versão experimental para validação em Chromebook e Android. Exclusão de dados do navegador pode apagar seu histórico local.</p></section>';
}
function render(){
 nav();root.innerHTML={home:renderHome,incomes:renderIncomes,materials:renderMaterials,purchases:renderPurchases,expenses:renderExpenses,settings:renderSettings}[page]();
}
function num(fd,key){const n=Number(fd.get(key));if(!Number.isFinite(n)||n<0||n>1e12)throw Error('Informe um valor válido para '+key+'.');return Math.round(n*100)/100;}
async function persist(){validate(data);await save(data);render();}
function find(type,recordId){return data[type].find(x=>x.id===recordId);}
function required(fd,key){const value=String(fd.get(key)||'').trim();if(!value)throw Error('O campo '+key+' é obrigatório.');return value.slice(0,100);}
async function handleSubmit(form){
 const fd=new FormData(form),date=String(fd.get('date')||localDate()),paid=fd.has('paid');
 if(form.id==='income-form'){
  const usage=[];
  for(const field of form.querySelectorAll('[data-materialqty]')){
   const quantity=Number(field.value||0);
   if(!Number.isFinite(quantity)||quantity<0)throw Error('Quantidade inválida.');
   if(!quantity)continue;
   const material=find('materials',field.dataset.materialqty);
   if(!material||quantity>material.quantity+1e-8)throw Error('Estoque insuficiente para '+(material?.name||'material')+'.');
   usage.push({materialId:material.id,quantity,unitPrice:material.unitPrice});
  }
  const income={id:id(),date,kind:String(fd.get('kind')),description:required(fd,'description'),clinic:String(fd.get('clinic')||'').slice(0,100),amount:num(fd,'amount'),paid,paymentDate:paid?date:null,usage};
  for(const item of usage){const material=find('materials',item.materialId);material.quantity=Math.round((material.quantity-item.quantity)*100)/100;}
  data.incomes.push(income);notify('Atendimento registrado.');
 } else if(form.id==='expense-form'){
  data.expenses.push({id:id(),date,description:required(fd,'description'),category:String(fd.get('category')),amount:num(fd,'amount'),paid,paymentDate:paid?date:null});notify('Despesa registrada.');
 } else if(form.id==='purchase-form'){
  const material=find('materials',String(fd.get('materialId')));
  if(!material)throw Error('Selecione um material válido.');
  const quantity=num(fd,'quantity'),unitPrice=num(fd,'unitPrice');
  if(!quantity)throw Error('Informe a quantidade comprada.');
  const amount=Math.round(quantity*unitPrice*100)/100;
  data.purchases.push({id:id(),date,materialId:material.id,quantity,unitPrice,amount,paid,paymentDate:paid?date:null});
  material.quantity=Math.round((material.quantity+quantity)*100)/100;material.unitPrice=unitPrice;notify('Compra registrada e estoque atualizado.');
 } else if(form.id==='material-form'){
  const update=editingMaterial?find('materials',editingMaterial):null;
  const fields={name:required(fd,'name'),unit:required(fd,'unit'),quantity:num(fd,'quantity'),target:num(fd,'target'),min:num(fd,'min'),unitPrice:num(fd,'unitPrice')};
  if(update)Object.assign(update,fields);else data.materials.push({id:id(),...fields});
  editingMaterial=null;notify('Material salvo.');
 } else if(form.id==='settings-form'){
  data.settings={openingBalance:num(fd,'openingBalance'),extraReserve:num(fd,'extraReserve')};notify('Configurações salvas.');
 }else return;
 await persist();
}
async function doAction(el){
 const action=el.dataset.action,type=el.dataset.type,recordId=el.dataset.id,record=type&&find(type,recordId);
 if(action==='toggle'&&record){
  record.paid=!record.paid;record.paymentDate=record.paid?localDate():null;await persist();notify('Situação financeira atualizada.');
 }else if(action==='remove'&&record){
  if(!confirm('Excluir este registro?'))return;
  if(type==='materials'){
   if(data.purchases.some(x=>x.materialId===recordId)||data.incomes.some(x=>x.usage.some(u=>u.materialId===recordId)))throw Error('Não é possível excluir um material utilizado em lançamentos.');
  }
  if(type==='incomes')for(const u of record.usage){const material=find('materials',u.materialId);if(material)material.quantity=Math.round((material.quantity+u.quantity)*100)/100;}
  if(type==='purchases'){
   const material=find('materials',record.materialId);
   if(material&&material.quantity+1e-8<record.quantity)throw Error('Não é possível excluir a compra: parte do estoque já foi consumida.');
   if(material)material.quantity=Math.round((material.quantity-record.quantity)*100)/100;
  }
  data[type]=data[type].filter(x=>x.id!==recordId);await persist();notify('Registro excluído.');
 }else if(action==='editmaterial'){
  editingMaterial=recordId;render();window.scrollTo({top:0,behavior:'smooth'});
 }else if(action==='cancelmaterial'){editingMaterial=null;render();}
 else if(action==='export'){const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='odontogest-backup-'+localDate()+'.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);notify('Backup criado. Guarde o arquivo com segurança.');}
 else if(action==='import')document.getElementById('import-file').click();
}
document.addEventListener('click',async e=>{
 const btn=e.target.closest('button');if(!btn)return;
 try{
  if(btn.dataset.page){page=btn.dataset.page;editingMaterial=null;render();window.scrollTo(0,0);return;}
  if(btn.dataset.action)await doAction(btn);
 }catch(error){notify('Erro: '+error.message);console.error(error);}
});
document.addEventListener('submit',async e=>{
 if(!['income-form','expense-form','purchase-form','material-form','settings-form'].includes(e.target.id))return;
 e.preventDefault();const button=e.target.querySelector('button[type=submit],button:not([type])');if(button)button.disabled=true;
 try{await handleSubmit(e.target);}catch(error){notify('Erro: '+error.message);console.error(error);if(button)button.disabled=false;}
});
document.getElementById('quick-new').addEventListener('click',()=>{page='incomes';render();window.scrollTo(0,0);});
document.getElementById('import-file').addEventListener('change',async e=>{
 const file=e.target.files?.[0];e.target.value='';if(!file)return;
 try{
  if(file.size>8_000_000)throw Error('Backup maior que o permitido (8 MB).');
  const proposed=validate(JSON.parse(await file.text()));
  if(!confirm('IMPORTANTE: importar substituirá todos os registros deste dispositivo. Continuar?'))return;
  await save(proposed);data=proposed;page='home';render();notify('Backup restaurado com sucesso.');
 }catch(error){notify('Não foi possível importar: '+error.message);console.error(error);}
});
(async()=>{try{data=validate((await load())||emptyData());render();if('serviceWorker' in navigator){navigator.serviceWorker.register('./sw.js').catch(e=>console.warn('Offline indisponível',e));}}catch(err){root.innerHTML='<div class="warning">Erro ao abrir o banco de dados local: '+text(err.message)+'. Habilite o armazenamento do navegador.</div>';console.error(err);}})();