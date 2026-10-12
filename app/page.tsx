import { redirect } from 'next/navigation';

/** The admin lives under /admin; the shell there sends signed-out visitors to /login. */
export default function RootPage() {
  redirect('/admin');
}
