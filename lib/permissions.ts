export const permissions = {
 'products.read':'Consultar catálogo', 'costs.read':'Consultar costos',
 'counts.write':'Registrar conteos', 'deliveries.approve':'Aprobar entregas',
 'recounts.request':'Solicitar reconteos', 'inventories.manage':'Administrar inventarios',
 'inventories.close':'Cerrar inventarios', 'reports.read':'Consultar reportes',
 'reports.export':'Exportar reportes', 'audit.read':'Consultar auditoría',
 'users.manage':'Administrar usuarios', 'roles.manage':'Administrar roles',
 'companies.manage':'Administrar empresas',
} as const;
export type Permission=keyof typeof permissions;
export type Rule={permission:Permission;effect:'allow'|'deny';scope:'company'|'warehouse'|'assigned'|'own';warehouseId?:string};
export type Membership={userId:string;organizationId:string;companyId:string;active:boolean;warehouseIds:string[]|null;rules:Rule[]};
export type Resource={organizationId:string;companyId:string;warehouseId?:string;assignedUserId?:string;ownerId?:string;state?:string};
export function can(m:Membership|undefined,p:Permission,r:Resource):boolean {
 if(!m?.active || m.organizationId!==r.organizationId || m.companyId!==r.companyId)return false;
 if(r.warehouseId && m.warehouseIds!==null && !m.warehouseIds.includes(r.warehouseId))return false;
 const applies=(rule:Rule)=>rule.permission===p && (rule.scope==='company' || (rule.scope==='warehouse' && !!r.warehouseId && rule.warehouseId===r.warehouseId) || (rule.scope==='assigned' && r.assignedUserId===m.userId) || (rule.scope==='own' && r.ownerId===m.userId));
 const rules=m.rules.filter(applies);
 if(rules.some(rule=>rule.effect==='deny'))return false;
 return rules.some(rule=>rule.effect==='allow');
}
export function canApprove(m:Membership|undefined,r:Resource,doubleControl=true){return can(m,'deliveries.approve',r)&&r.state==='submitted'&&(!doubleControl||r.ownerId!==m?.userId)}
