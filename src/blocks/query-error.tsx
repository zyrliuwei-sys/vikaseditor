import { m } from '@/paraglide/messages.js';
import { Button } from '@/components/ui/button';

export function QueryError({ retry }: { retry: () => unknown }) {
  return (
    <div role="alert" className="space-y-3 rounded-lg border p-6">
      <p>{m['common.errors.data_unavailable']()}</p>
      <Button variant="outline" onClick={() => void retry()}>
        {m['common.errors.retry']()}
      </Button>
    </div>
  );
}
