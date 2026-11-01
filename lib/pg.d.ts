declare module 'pg' {
 export type QueryResult<T=Record<string,unknown>>={rows:T[];rowCount:number|null};
 export interface Client {query<T=Record<string,unknown>>(text:string,values?:unknown[]):Promise<QueryResult<T>>;release():void;}
 export class Pool {constructor(options:{connectionString:string;max?:number;connectionTimeoutMillis?:number;idleTimeoutMillis?:number});query<T=Record<string,unknown>>(text:string,values?:unknown[]):Promise<QueryResult<T>>;connect():Promise<Client>;end():Promise<void>}
}
