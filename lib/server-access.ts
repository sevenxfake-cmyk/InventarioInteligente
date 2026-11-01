import {getAuth,authReady} from './auth';
import {database} from './db';
import {can,type Membership,type Rule,type Permission} from './permissions';
export class AccessError extends Error {constructor(public status:number,message:string){super(message)}}
export async function identity(request:Request){
 if(!authReady())throw new AccessError(503,'Acceso real pendiente de configuración.');
 const session=await getAuth().api.getSession({headers:request.headers});
 if(!session)throw new AccessError(401,'Inicia sesión para continuar.');
 const user=await database().query<{active:boolean}>('SELECT active FROM app_users WHERE user_id=$1',[session.user.id]);
 if(!user.rows[0]?.active)throw new AccessError(403,'Tu acceso está desactivado. Contacta al administrador.');
 return session.user;
}
export async function membershipFor(userId:string,companyId:string):Promise<Membership|undefined>{
 const result=await database().query<{organization_id:string;warehouse_ids:string[]|null;active:boolean;exceptions:Rule[];rules:Rule[]}>(`SELECT c.organization_id,m.warehouse_ids,m.active,m.exceptions,
 COALESCE((SELECT jsonb_agg(rule) FROM role_assignments a JOIN roles r ON r.id=a.role_id AND r.organization_id=c.organization_id CROSS JOIN LATERAL jsonb_array_elements(r.rules) rule WHERE a.membership_id=m.id),'[]'::jsonb) AS rules
 FROM company_memberships m JOIN companies c ON c.id=m.company_id JOIN organization_members om ON om.organization_id=c.organization_id AND om.user_id=m.user_id AND om.active=true
 WHERE m.user_id=$1 AND m.company_id=$2`,[userId,companyId]);
 const row=result.rows[0];if(!row)return;
 return {userId,organizationId:row.organization_id,companyId,warehouseIds:row.warehouse_ids,active:row.active,rules:[...row.rules,...row.exceptions]};
}
export async function authorize(request:Request,companyId:string,permission:Permission){const user=await identity(request);const m=await membershipFor(user.id,companyId);if(!m||!can(m,permission,{organizationId:m.organizationId,companyId}))throw new AccessError(403,'No tienes permiso en esta empresa.');return {user,m};}
export function sameOrigin(request:Request){if(request.headers.get('origin')!==new URL(request.url).origin)throw new AccessError(403,'Origen de solicitud no permitido.');}
export function failure(error:unknown){if(error instanceof AccessError)return Response.json({error:error.message},{status:error.status,headers:{'Cache-Control':'no-store'}});console.error('inventory_operation_failed');return Response.json({error:'No se pudo completar la operación. Verifica la configuración del servicio.'},{status:500});}
