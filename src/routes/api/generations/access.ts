import { createFileRoute } from '@tanstack/react-router';
import { generationAccess } from '@/server/generations/handlers';

export const Route = createFileRoute('/api/generations/access')({
  server: { handlers: { GET: generationAccess } },
});
