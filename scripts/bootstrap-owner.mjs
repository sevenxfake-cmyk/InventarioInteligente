// Run once in a trusted terminal. Supply password via environment, never argv.
import {Pool} from 'pg';
import {hashPassword} from 'better-auth/crypto';
const {DATABASE_URL,BOOTSTRAP_EMAIL,BOOTSTRAP_NAME,BOOTSTRAP_PASSWORD,BOOTSTRAP_ORGANIZATION}=process.env;
if(!DATABASE_URL||!BOOTSTRAP_EMAIL||!BOOTSTRAP_NAME||!BOOTSTRAP_ORGANIZATION||!BOOTSTRAP_PASSWORD||BOOTSTRAP_PASSWORD.length<12)throw new Error('Faltan variables BOOTSTRAP_* o la contraseña tiene menos de 12 caracteres.');
const pool=new Pool({connectionString:DATABASE_URL});const c=await pool.connect();
try{
 await c.query('BEGIN');
 const uid=crypto.randomUUID(),oid=crypto.randomUUID();
 await c.query('INSERT INTO "user"(id,name,email,"emailVerified") VALUES($1,$2,$3,true)',[uid,BOOTSTRAP_NAME,BOOTSTRAP_EMAIL.toLowerCase()]);
 await c.query('INSERT INTO account(id,"accountId","providerId","userId",password) VALUES($1,$2,$3,$2,$4)',[crypto.randomUUID(),uid,'credential',await hashPassword(BOOTSTRAP_PASSWORD)]);
 await c.query('INSERT INTO app_users(user_id) VALUES($1)',[uid]);
 await c.query('INSERT INTO organizations(id,name) VALUES($1,$2)',[oid,BOOTSTRAP_ORGANIZATION]);
 await c.query('INSERT INTO organization_members(organization_id,user_id,is_owner,can_manage_companies) VALUES($1,$2,true,true)',[oid,uid]);
 const keys=['products.read','costs.read','counts.write','deliveries.approve','recounts.request','inventories.manage','inventories.close','reports.read','reports.export','audit.read','users.manage','roles.manage','companies.manage'];
 await c.query('INSERT INTO roles(id,organization_id,name,rules,bootstrap_owner) VALUES($1,$2,$3,$4,true)',[crypto.randomUUID(),oid,'Propietario de la organización',JSON.stringify(keys.map(permission=>({permission,effect:'allow',scope:'company'})))]);
 await c.query('INSERT INTO audit_events(id,organization_id,actor_id,action,resource_id) VALUES($1,$2,$3,$4,$3)',[crypto.randomUUID(),oid,uid,'owner.bootstrapped']);
 await c.query('COMMIT');console.log('Propietario y organización creados. No se muestra la contraseña.');
}catch(e){await c.query('ROLLBACK');throw e}finally{c.release();await pool.end()}
