import test from 'node:test';
import assert from 'node:assert/strict';
import {metrics,emptyData,validate} from '../finance.js';
test('recebimentos e despesas quitadas alteram caixa',()=>{
 const d=emptyData();d.settings.openingBalance=100;
 d.incomes=[{id:'1',amount:200,paid:true,date:'2026-10-30',usage:[]}];
 d.expenses=[{id:'1',amount:30,paid:true,date:'2026-10-30'}];
 const m=metrics(d);assert.equal(m.cash,270);assert.equal(m.available,270);
});
test('contas a pagar são reservadas, sem sair do caixa',()=>{
 const d=emptyData();d.settings.openingBalance=200;
 d.expenses=[{id:'1',amount:35,paid:false,date:'2026-10-30'}];
 assert.equal(metrics(d).cash,200);assert.equal(metrics(d).available,165);
});
test('reposição não é descontada duas vezes após compra',()=>{
 const d=emptyData();d.settings.openingBalance=200;
 d.materials=[{id:'m',quantity:0,target:10,min:1,unitPrice:5}];
 assert.equal(metrics(d).available,150);
 d.materials[0].quantity=10;
 d.purchases=[{id:'p',materialId:'m',quantity:10,unitPrice:5,amount:50,paid:true,date:'2026-10-30'}];
 assert.equal(metrics(d).cash,150);assert.equal(metrics(d).available,150);
});
test('compra a prazo aumenta estoque e reserva compromisso',()=>{
 const d=emptyData();d.settings.openingBalance=200;
 d.materials=[{id:'m',quantity:10,target:10,min:1,unitPrice:5}];
 d.purchases=[{id:'p',materialId:'m',quantity:10,unitPrice:5,amount:50,paid:false,date:'2026-10-30'}];
 assert.equal(metrics(d).cash,200);assert.equal(metrics(d).available,150);
});
test('centavos não acumulam erros binários',()=>{
 const d=emptyData();d.incomes=[{id:'a',amount:.1,paid:true,date:'2026-10-30',usage:[]},{id:'b',amount:.2,paid:true,date:'2026-10-30',usage:[]}];
 assert.equal(metrics(d).cash,.3);
});
test('backup incompatível é rejeitado',()=>assert.throws(()=>validate({schemaVersion:2})));
test('estrutura vazia é válida',()=>assert.equal(validate(emptyData()).schemaVersion,1));
test('recebimentos pendentes não entram no caixa',()=>{
 const d=emptyData();d.incomes=[{id:'a',amount:150,paid:false,date:'2026-10-30',usage:[]}];
 assert.equal(metrics(d).cash,0);assert.equal(metrics(d).receivable,150);
});
test('reserva adicional reduz apenas o disponível',()=>{
 const d=emptyData();d.settings.openingBalance=100;d.settings.extraReserve=20;
 assert.equal(metrics(d).cash,100);assert.equal(metrics(d).available,80);
});