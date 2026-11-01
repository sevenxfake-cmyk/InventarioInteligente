import {database} from '@/lib/db';
import {identity,sameOrigin,failure,AccessError} from '@/lib/server-access';
export async function GET(request:Request){try{const user=await identity(request);const data=await database().query<{id:string;name:string;organization_name:string}>(`SELECT c.id,c.name,o.name AS organization_name FROM companies c JOIN organizations o ON o.id=c.organization_id JOIN organization_members om ON om.organization_id=o.id AND om.user_id=$1 AND om.active=true JOIN company_memberships m ON m.company_id=c.id AND m.user_id=$1 AND m.active=true ORDER BY c.name`,[user.id]);return Response.json({companies:data.rows},{headers:{'Cache-Control':'no-store'}})}catch(e){return failure(e)}}
export async function POST(request:Request){
 let client;
 try{sameOrigin(request);const user=await identity(request);const body=await request.json();if(typeof body.name!=='string'||body.name.trim().length<2||body.name.length>100||typeof body.organizationId!=='string')throw new AccessError(400,'Indica una organización y un nombre entre 2 y 100 caracteres.');
 client=await database().connect();await client.query('BEGIN');
 // Organization-level permission, scoped to an active membership; no role-name bypass.
 const access=await client.query('SELECT 1 FROM organization_members WHERE organization_id=$1 AND user_id=$2 AND active=true AND can_manage_companies=true FOR UPDATE',[body.organizationId,user.id]);
 if(!access.rows.length)throw new AccessError(403,'No puedes crear empresas en esta organización.');
 const companyId=crypto.randomUUID();await client.query('INSERT INTO companies(id,organization_id,name) VALUES($1,$2,$3)',[companyId,body.organizationId,body.name.trim()]);
 const mid=crypto.randomUUID();await client.query('INSERT INTO company_memberships(id,company_id,user_id,warehouse_ids) VALUES($1,$2,$3,NULL)',[mid,companyId,user.id]);
 await client.query(`INSERT INTO role_assignments(membership_id,role_id) SELECT $1,id FROM roles WHERE organization_id=$2 AND bootstrap_owner=true`,[mid,body.organizationId]);
 await client.query('INSERT INTO audit_events(id,organization_id,company_id,actor_id,action,resource_id,details) VALUES($1,$2,$3,$4,$5,$3::text,$6)',[crypto.randomUUID(),body.organizationId,companyId,user.id,'company.created',JSON.stringify({name:body.name.trim()})]);
 await client.query('COMMIT');return Response.json({id:companyId,name:body.name.trim()},{status:201});
 }catch(e){if(client)await client.query('ROLLBACK');return failure(e)}finally{client?.release()}
}
