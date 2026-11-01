import {Pool} from 'pg';
const globalDb=globalThis as unknown as {inventoryDb?:Pool};
export function database(){
 if(!process.env.DATABASE_URL)throw new Error('DATABASE_NOT_CONFIGURED');
 if(!globalDb.inventoryDb)globalDb.inventoryDb=new Pool({connectionString:process.env.DATABASE_URL,max:5,connectionTimeoutMillis:8000,idleTimeoutMillis:10000});
 return globalDb.inventoryDb;
}
