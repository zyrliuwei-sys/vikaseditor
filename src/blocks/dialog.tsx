import type { ComponentProps } from 'react';
import { X } from 'lucide-react';

import { m } from '@/paraglide/messages.js';
import { Button } from '@/components/ui/button';
import { DialogContent as Content, DialogClose } from '@/components/ui/dialog';

export * from '@/components/ui/dialog';

/** Localized close control without modifying the shadcn primitive. */
export function DialogContent({
  children,
  showCloseButton = true,
  ...props
}: ComponentProps<typeof Content>) {
  return (
    <Content {...props} showCloseButton={false}>
      {children}
      {showCloseButton && (
        <DialogClose
          render={
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 size-11"
            />
          }
          aria-label={m['common.close']()}
        >
          <X />
        </DialogClose>
      )}
    </Content>
  );
}
