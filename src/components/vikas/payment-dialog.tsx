import { ArrowRight, CreditCard, LoaderCircle, Wallet } from 'lucide-react';

import type { StudioPaymentProvider } from '@/lib/studio-payment';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function VikasPaymentDialog({
  open,
  onOpenChange,
  title,
  description,
  planName,
  price,
  credits,
  terms,
  options,
  pendingProvider,
  error,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  planName: string;
  price: string;
  credits: string;
  terms: string;
  options: { id: StudioPaymentProvider; label: string; description: string }[];
  pendingProvider?: StudioPaymentProvider;
  error?: string;
  onSelect: (provider: StudioPaymentProvider) => void;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!pendingProvider) onOpenChange(next);
      }}
    >
      <DialogContent
        className="max-h-[90svh] overflow-y-auto sm:max-w-md [&>[data-slot=dialog-close]]:size-11"
        showCloseButton={!pendingProvider}
      >
        <DialogHeader className="pr-10">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="bg-muted/30 rounded-lg border p-4">
          <p className="font-semibold">{planName}</p>
          <p className="mt-1 text-xl font-semibold">{price}</p>
          <p className="text-muted-foreground mt-1 text-sm">{credits}</p>
        </div>
        <div className="grid gap-3" aria-busy={Boolean(pendingProvider)}>
          {options.map((option) => {
            const Icon = option.id === 'stripe' ? CreditCard : Wallet;
            return (
              <Button
                key={option.id}
                type="button"
                variant="outline"
                className="h-auto min-h-16 w-full justify-start gap-3 px-4 py-3 text-left whitespace-normal"
                disabled={Boolean(pendingProvider)}
                onClick={() => onSelect(option.id)}
              >
                <Icon className="size-5 shrink-0" aria-hidden="true" />
                <span className="flex-1">
                  <span className="block font-semibold">{option.label}</span>
                  <span className="text-muted-foreground mt-1 block text-xs font-normal">
                    {option.description}
                  </span>
                </span>
                {pendingProvider === option.id ? (
                  <LoaderCircle
                    className="size-4 animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <ArrowRight className="size-4" aria-hidden="true" />
                )}
              </Button>
            );
          })}
        </div>
        {error && (
          <p role="alert" className="text-destructive text-sm">
            {error}
          </p>
        )}
        <p className="text-muted-foreground text-xs leading-relaxed">{terms}</p>
      </DialogContent>
    </Dialog>
  );
}
