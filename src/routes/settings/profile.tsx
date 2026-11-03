import { createFileRoute } from '@tanstack/react-router';

import { envConfigs } from '@/config';
import { m } from '@/paraglide/messages.js';
import { useUserInfo } from '@/hooks/use-user-info';
import { Button } from '@/components/ui/button';

import { SettingsForm } from './-settings-form';

function SettingsPage() {
  const query = useUserInfo();
  const user = query.data;
  if (query.isError) {
    return (
      <div role="alert" className="space-y-3 p-6">
        <p>{m['settings.profile.load_failed']()}</p>
        <Button variant="outline" onClick={() => void query.refetch()}>
          {m['common.errors.retry']()}
        </Button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-muted-foreground p-6">
        {m['settings.profile.loading']()}
      </div>
    );
  }

  return (
    <SettingsForm
      name={user.name || ''}
      email={user.email || ''}
      image={user.image || ''}
    />
  );
}

export const Route = createFileRoute('/settings/profile')({
  head: () => ({
    meta: [
      { title: `${m['settings.profile.title']()} | ${envConfigs.app_name}` },
    ],
  }),
  component: SettingsPage,
});
