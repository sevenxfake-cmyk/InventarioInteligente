import test from 'node:test';
import assert from 'node:assert/strict';
import {createSeed} from '../lib/console/seed.ts';
import {upgradeDraft} from '../lib/console/migrations.ts';
import {validateBranch,validateWarehouseBranch,warehousesInContext} from '../lib/console/model.ts';
test('actualizar v2 conserva imágenes, productos, ubicaciones y revisión sin mutar el original',()=>{
 const seed=createSeed();const {branches,...rest}=seed;const old={...rest,version:2,revision:9,companies:seed.companies.map(c=>({...c,logo:'data:image/webp;base64,example'})),warehouses:seed.warehouses.map(({branchId,...w})=>w)};
 const previous=JSON.stringify(old),next=upgradeDraft(old)!;
 assert.equal(next.version,3);assert.equal(next.revision,9);assert.deepEqual(next.products,old.products);assert.deepEqual(next.placements,old.placements);assert.equal(next.companies[0].logo,old.companies[0].logo);assert.equal(JSON.stringify(old),previous);assert.equal(next.branches.length,seed.companies.length);for(const w of next.warehouses)assert.doesNotThrow(()=>validateWarehouseBranch(w,next));
});
test('v3 es idempotente y no se descarta silenciosamente una versión desconocida',()=>{const d=createSeed();assert.equal(upgradeDraft(d),d);assert.equal(upgradeDraft(null),null);assert.throws(()=>upgradeDraft({...d,version:99}),/otra versión/);assert.throws(()=>upgradeDraft({version:2,revision:0}),/incompleto/)});
test('el filtro de sucursal respeta también el límite de empresa',()=>{const d=createSeed();assert.equal(warehousesInContext(d,'company-norte').length,2);assert.equal(warehousesInContext(d,'company-norte','branch-norte-recepcion')[0].id,'wh-reserva');assert.equal(warehousesInContext(d,'company-sur','branch-norte-recepcion').length,0)});
test('una sucursal necesita código único en su empresa',()=>{const d=createSeed(),b=d.branches[0];assert.throws(()=>validateBranch({...b,id:'new',code:' prin '},d),/ya existe/);assert.doesNotThrow(()=>validateBranch({...b,name:'Principal editada'},d));assert.throws(()=>validateBranch({...b,companyId:'otra'},d),/existente/)});
test('un almacén no puede asignarse a una sucursal de otra empresa',()=>{const d=createSeed(),w=d.warehouses[0];assert.throws(()=>validateWarehouseBranch({...w,branchId:'branch-sur-principal'},d),/esta empresa/);assert.doesNotThrow(()=>validateWarehouseBranch(w,d))});
