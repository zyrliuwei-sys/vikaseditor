import { createFileRoute } from '@tanstack/react-router';
import { generationDownload } from '@/server/generations/handlers';

export const Route = createFileRoute('/api/generations/$id/download')({
  server: { handlers: { GET: generationDownload } },
});
