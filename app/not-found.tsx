import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center text-white">
      <h1 className="text-4xl font-bold tracking-tight mb-2">404 - Page Not Found</h1>
      <p className="text-slate-400 text-sm max-w-md mb-6">
        The requested administrative route does not exist or has been relocated.
      </p>
      <Link
        href="/admin"
        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors"
      >
        Return to Admin Dashboard
      </Link>
    </div>
  );
}
