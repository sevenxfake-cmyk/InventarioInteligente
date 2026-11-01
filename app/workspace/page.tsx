import {headers} from 'next/headers';
import {redirect} from 'next/navigation';
import {authReady,getAuth} from '@/lib/auth';
import {database} from '@/lib/db';
import Workspace from '@/components/workspace';
export const dynamic='force-dynamic';
export default async function Page(){
 if(!authReady())redirect('/login');
 const session=await getAuth().api.getSession({headers:await headers()});
 if(!session)redirect('/login');
 const user=await database().query<{active:boolean}>('SELECT active FROM app_users WHERE user_id=$1',[session.user.id]);
 if(!user.rows[0]?.active)redirect('/login');
 const organizations=await database().query<{id:string;name:string;can_manage_companies:boolean}>('SELECT o.id,o.name,m.can_manage_companies FROM organizations o JOIN organization_members m ON m.organization_id=o.id WHERE m.user_id=$1 AND m.active=true',[session.user.id]);
 return <Workspace name={session.user.name} organizations={organizations.rows}/>;
}
