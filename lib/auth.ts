import {betterAuth} from 'better-auth';
import {nextCookies} from 'better-auth/next-js';
import {database} from './db';
export const authReady=()=>!!(process.env.DATABASE_URL&&process.env.BETTER_AUTH_SECRET&&process.env.BETTER_AUTH_SECRET.length>=32&&process.env.BETTER_AUTH_URL);
function createAuth(){
 return betterAuth({
  database:database(),secret:process.env.BETTER_AUTH_SECRET,baseURL:process.env.BETTER_AUTH_URL,
  emailAndPassword:{enabled:true,disableSignUp:true,minPasswordLength:12,
   sendResetPassword:process.env.RESEND_API_KEY&&process.env.EMAIL_FROM?async ({user,url})=>{
    const result=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({from:process.env.EMAIL_FROM,to:user.email,subject:'Recupera tu acceso a Inventario Inteligente',text:`Puedes restablecer tu contraseña en: ${url}`})});
    if(!result.ok)throw new Error('EMAIL_DELIVERY_FAILED');
   }:undefined,
   revokeSessionsOnPasswordReset:true},
  rateLimit:{enabled:true,storage:'database',window:60,max:30,customRules:{'/sign-in/email':{window:60,max:5}}},
  session:{cookieCache:{enabled:false},expiresIn:60*60*8,updateAge:60*15},
  plugins:[nextCookies()]
 });
}
let instance:ReturnType<typeof createAuth>|undefined;
export function getAuth(){
 if(!authReady())throw new Error('AUTH_NOT_CONFIGURED');
 return instance??=createAuth();
}
