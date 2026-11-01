import LoginForm from '@/components/login-form';
import {authReady} from '@/lib/auth';
export const dynamic='force-dynamic';
export default function Page(){return <LoginForm configured={authReady()} recovery={!!(process.env.RESEND_API_KEY&&process.env.EMAIL_FROM)}/>;}
