import { createFileRoute } from '@tanstack/react-router';
import {
  generationCreate,
  generationList,
} from '@/server/generations/handlers';

export const Route = createFileRoute('/api/generations/')({
  server: { handlers: { GET: generationList, POST: generationCreate } },
});
