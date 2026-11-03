import type { ComponentProps } from 'react';

import { m } from '@/paraglide/messages.js';
import { ImageUploader as Uploader } from '@/components/image-uploader';

export type { ImageUploaderValue } from '@/components/image-uploader';

export function ImageUploader(props: ComponentProps<typeof Uploader>) {
  return (
    <Uploader
      {...props}
      labels={{
        upload: m['common.upload.upload'](),
        limit: (size) => m['common.upload.limit']({ size }),
        replace: m['common.upload.replace'](),
        remove: m['common.upload.remove'](),
        preview: m['common.upload.preview'](),
        uploading: m['common.upload.uploading'](),
        failed: m['common.upload.failed'](),
        error: m['common.upload.error'](),
        typeError: m['common.upload.type_error'](),
        sizeError: (size) => m['common.upload.size_error']({ size }),
        count: (count) => m['common.upload.count']({ count }),
        ...props.labels,
      }}
    />
  );
}
