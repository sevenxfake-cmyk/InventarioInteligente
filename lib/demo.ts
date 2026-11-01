import {Membership,Permission,Rule} from './permissions';
const grants=(ps:Permission[],scope:Rule['scope']='company'):Rule[]=>ps.map(permission=>({permission,effect:'allow',scope}));
export const people=[
 {id:'ana',name:'Ana Torres',role:'Operaria de conteo',initials:'AT',companies:['a'],warehouses:['Norte'],rules:grants(['products.read','counts.write'],'assigned')},
 {id:'luis',name:'Luis Mendoza',role:'Supervisor de inventario',initials:'LM',companies:['a'],warehouses:['Norte','Sur'],rules:grants(['products.read','deliveries.approve','recounts.request','reports.read'])},
 {id:'marta',name:'Marta Rojas',role:'Administradora de inventario',initials:'MR',companies:['a','b'],warehouses:['Norte','Sur'],rules:grants(['products.read','inventories.manage','inventories.close','reports.read'])},
 {id:'auditor',name:'Carlos Vega',role:'Auditor de consulta',initials:'CV',companies:['a'],warehouses:['Norte','Sur'],rules:grants(['reports.read','audit.read'])}
];
export function membership(id:string,companyId:string):Membership|undefined{const person=people.find(p=>p.id===id);if(!person?.companies.includes(companyId))return;return {userId:id,organizationId:'demo',companyId,active:true,warehouseIds:person.warehouses,rules:id==='marta'&&companyId==='b'?grants(['reports.read']):person.rules}}
export const tasks=[{id:'INV-001',name:'Conteo de noviembre',warehouse:'Norte',space:'Andamio A · Nivel 1',owner:'Ana Torres',status:'En proceso',done:8,total:12}, {id:'INV-002',name:'Revisión de limpieza',warehouse:'Sur',space:'Andamio B · Nivel 2',owner:'Luis Mendoza',status:'Pendiente de revisión',done:6,total:6}, {id:'INV-003',name:'Control de accesorios',warehouse:'Norte',space:'Andamio C · Nivel 1',owner:'Ana Torres',status:'Por iniciar',done:0,total:10}];
