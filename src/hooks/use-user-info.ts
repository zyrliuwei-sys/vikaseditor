import { useQuery } from '@tanstack/react-query';

import { apiGet } from '@/lib/api-client';

export type UserInfo = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  needsInvite?: boolean;
};

// Keep the shared cache shape identical in the layout and profile page.
export function useUserInfo(enabled = true) {
  return useQuery({
    queryKey: ['user-info'],
    queryFn: () => apiGet<UserInfo>('/api/user/info'),
    staleTime: 60_000,
    enabled,
  });
}
