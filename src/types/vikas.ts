export type MediaMode = 'image' | 'video';
export type TemplateCategory =
  'all' | 'cinematic' | 'fashion' | 'festival' | 'couple' | 'video';

export interface VikasTemplate {
  id: string;
  title: string;
  description: string;
  category: Exclude<TemplateCategory, 'all'>;
  mediaType: MediaMode;
  artwork: number;
  prompt: string;
  tag?: string;
}

export interface StudioSelection {
  mode: MediaMode;
  templateId?: string;
  prompt?: string;
  revision: number;
}

export interface GenerationCapabilities {
  configured: boolean;
  imageCredits: number;
  videoCredits: number;
}

export interface GenerationAccess {
  paidCredits: number;
  freeImageAvailable: boolean;
  trialPaused: boolean;
}

export interface GenerationResult {
  id: string;
  status: 'pending' | 'processing' | 'success' | 'failed' | 'canceled';
  mediaType: MediaMode;
  prompt: string;
  url?: string;
  error?: string;
  createdAt: string;
}
