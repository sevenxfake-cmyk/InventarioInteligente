import {getAuth,authReady} from '@/lib/auth';
import {toNextJsHandler} from 'better-auth/next-js';
export const runtime='nodejs';
async function handle(request:Request){
 if(!authReady())return Response.json({error:'El acceso real todavía no está configurado.'},{status:503});
 const handlers=toNextJsHandler(getAuth());
 return request.method==='GET'?handlers.GET(request):handlers.POST(request);
}
export const GET=handle;
export const POST=handle;
