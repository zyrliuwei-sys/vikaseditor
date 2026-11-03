import { createFileRoute } from '@tanstack/react-router';
import { generationGet } from '@/server/generations/handlers';

export const Route = createFileRoute('/api/generations/$id')({
  server: { handlers: { GET: generationGet } },
});
