import type { ReactNode } from 'react';
import { Navigate } from '@tanstack/react-router';

import { m } from '@/paraglide/messages.js';
import { usePublicConfig } from '@/hooks/use-public-config';
import {
  useUserFeatures,
  type UserFeatureKey,
} from '@/hooks/use-user-features';
import { QueryError } from '@/blocks/query-error';

/**
 * Renders a user-center page only while an admin has it switched on;
 * otherwise sends the user to the overview. Redirect rather than a notice,
 * because payment flows land on these pages (success → payments, cancel →
 * billing).
 */
export function FeatureGate({
  feature,
  children,
}: {
  feature: UserFeatureKey;
  children: ReactNode;
}) {
  const features = useUserFeatures();
  const config = usePublicConfig();
  if (config.isError) return <QueryError retry={config.refetch} />;
  if (!features.loaded)
    return (
      <p role="status" className="p-6">
        {m['common.loading']()}
      </p>
    );
  if (!features[feature]) return <Navigate to="/settings" replace />;
  return children;
}
