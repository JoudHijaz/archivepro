import React from 'react';

interface Props {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };

export function LoadingSpinner({ size = 'md', className = '' }: Props) {
  return (
    <div
      className={`border-4 border-indigo-500 border-t-transparent rounded-full animate-spin ${sizeMap[size]} ${className}`}
    />
  );
}
