import * as React from 'react';
import { cn } from '@/utils/classname';

export interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallback?: string;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  showLoading?: boolean;
  onError?: (error: React.SyntheticEvent<HTMLImageElement, Event>) => void;
  onLoad?: (event: React.SyntheticEvent<HTMLImageElement, Event>) => void;
}

const Image = React.forwardRef<HTMLImageElement, ImageProps>(
  (
    {
      className,
      src,
      alt,
      fallback = '/placeholder.svg',
      rounded = 'none',
      showLoading = true,
      onError,
      onLoad,
      style,
      ...props
    },
    ref
  ) => {
    const [isLoading, setIsLoading] = React.useState(true);
    const [hasError, setHasError] = React.useState(false);
    const [currentSrc, setCurrentSrc] = React.useState(src);

    const roundeds = {
      none: 'rounded-none',
      sm: 'rounded-sm',
      md: 'rounded-md',
      lg: 'rounded-lg',
      full: 'rounded-full',
    };

    React.useEffect(() => {
      setIsLoading(true);
      setHasError(false);
      setCurrentSrc(src);
    }, [src]);

    const handleError = React.useCallback(
      (error: React.SyntheticEvent<HTMLImageElement, Event>) => {
        setIsLoading(false);
        setHasError(true);
        setCurrentSrc(fallback);
        onError?.(error);
      },
      [fallback, onError]
    );

    const handleLoad = React.useCallback(
      (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
        setIsLoading(false);
        onLoad?.(event);
      },
      [onLoad]
    );

    return (
      <div
        className={cn(
          'relative inline-block overflow-hidden',
          roundeds[rounded],
          className
        )}
        style={style}
      >
        {isLoading && showLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-200 animate-pulse">
            <svg
              className="w-8 h-8 text-gray-400 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        )}

        {hasError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100">
            <svg
              className="w-12 h-12 text-gray-400 mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="text-sm text-gray-500">图片加载失败</span>
          </div>
        )}

        <img
          {...props}
          ref={ref}
          src={currentSrc}
          alt={alt}
          loading="lazy"
          className={cn(
            'w-full h-full object-cover',
            roundeds[rounded],
            isLoading && showLoading ? 'opacity-0' : 'opacity-100',
            'transition-opacity duration-300'
          )}
          onError={handleError}
          onLoad={handleLoad}
        />
      </div>
    );
  }
);

Image.displayName = 'Image';

export { Image };
