import { createFileRoute } from '@tanstack/react-router';
import { generationConfig } from '@/server/generations/handlers';

export const Route = createFileRoute('/api/generations/config')({
  server: { handlers: { GET: generationConfig } },
});
