import { Suspense } from 'react';
import ResetForm from '@/components/reset-form';
import AppStatus from '@/components/app-status';
export default function Page() { return <Suspense fallback={<AppStatus/>}><ResetForm/></Suspense>; }
