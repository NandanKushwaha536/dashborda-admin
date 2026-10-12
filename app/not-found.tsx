import { ButtonLink } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/Feedback';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas p-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white">
        <EmptyState
          title="Page not found"
          description="The link may be old, or the record was deleted."
          action={<ButtonLink href="/admin">Go to dashboard</ButtonLink>}
        />
      </div>
    </div>
  );
}
