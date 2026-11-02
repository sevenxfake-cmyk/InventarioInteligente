import test from 'node:test';
import assert from 'node:assert/strict';
import {createSeed} from '../lib/console/seed.ts';
import {validateBranch,validateWarehouseBranch,warehousesInContext} from '../lib/console/model.ts';
test('el filtro de sucursal respeta también el límite de empresa',()=>{const d=createSeed();assert.equal(warehousesInContext(d,'company-norte').length,2);assert.equal(warehousesInContext(d,'company-norte','branch-norte-recepcion')[0].id,'wh-reserva');assert.equal(warehousesInContext(d,'company-sur','branch-norte-recepcion').length,0)});
test('una sucursal necesita código único en su empresa',()=>{const d=createSeed(),b=d.branches[0];assert.throws(()=>validateBranch({...b,id:'new',code:' prin '},d),/ya existe/);assert.doesNotThrow(()=>validateBranch({...b,name:'Principal editada'},d));assert.throws(()=>validateBranch({...b,companyId:'otra'},d),/existente/)});
test('un almacén no puede asignarse a una sucursal de otra empresa',()=>{const d=createSeed(),w=d.warehouses[0];assert.throws(()=>validateWarehouseBranch({...w,branchId:'branch-sur-principal'},d),/esta empresa/);assert.doesNotThrow(()=>validateWarehouseBranch(w,d))});
