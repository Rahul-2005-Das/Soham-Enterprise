import React, { useEffect, useState } from 'react';

export const PRODUCT_IMAGE_FALLBACK = '/images/placeholder.png';

interface ProductImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src?: string | null;
}

export function ProductImage({ src, alt = '', ...props }: ProductImageProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [src]);

  return (
    <img
      {...props}
      src={!failed && src ? src : PRODUCT_IMAGE_FALLBACK}
      alt={alt}
      onError={() => setFailed(true)}
    />
  );
}
