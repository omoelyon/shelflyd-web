import { FileWarning } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

/** The grey placeholder shown while a document loads. */
export function DocumentSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-9 w-48" />
      <Skeleton className="h-[520px] rounded-2xl" />
    </div>
  );
}

/** A document that could not be opened, with the server's reason when there is one. */
export function DocumentError({ message, children }: { message: string; children?: React.ReactNode }) {
  return (
    <div role="alert" className="rounded-2xl bg-white p-8 text-center shadow-card-md">
      <FileWarning className="mx-auto h-9 w-9 text-[#94a3b8]" />
      <p className="mt-3 text-sm font-medium text-[#091426]">{message}</p>
      {children && <div className="mt-4 flex justify-center gap-2">{children}</div>}
    </div>
  );
}
