import React, { useState } from 'react';

const fallback = '/placeholder.png';

export default function SafeImage({ src, alt, className, style }) {
  const [error, setError] = useState(false);
  const isHttp = src && (src.startsWith('http') || src.startsWith('data:'));
  const finalSrc = !error && isHttp ? src : fallback;
  return (
    <img
      loading="lazy"
      src={finalSrc}
      alt={alt || ''}
      className={className}
      style={style}
      onError={() => setError(true)}
    />
  );
}
