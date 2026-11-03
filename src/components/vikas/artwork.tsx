import { cn } from '@/lib/utils';

/** Individually optimized panels let off-screen examples load lazily. */
export function VikasArtwork({
  index,
  alt = '',
  className,
  alignment = 'center',
  priority = false,
}: {
  index: number;
  alt?: string;
  className?: string;
  alignment?: 'center' | 'top';
  priority?: boolean;
}) {
  return (
    <img
      src={`/imgs/vikas/portrait-${((index % 6) + 6) % 6}.webp`}
      width={512}
      height={512}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'low'}
      decoding="async"
      className={cn(
        'vikas-artwork h-full w-full object-cover',
        alignment === 'top' ? 'object-top' : 'object-center',
        className
      )}
    />
  );
}
