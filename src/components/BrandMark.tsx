import React from 'react';

interface BrandMarkProps {
  className?: string;
  style?: React.CSSProperties;
}

/**
 * LocalMind "Orbit" mark: nested rings, a center point and three bookmark nodes.
 * Source: branding/localmind-brand-kit/logo/mark-currentColor.svg
 * Inherits color from the parent via currentColor.
 */
export const BrandMark: React.FC<BrandMarkProps> = ({ className, style }) => {
  const node = 'M-36,-52 L36,-52 L36,52 L0,22.2 L-36,52Z';
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="88 88 848 848"
      className={className}
      style={style}
      aria-hidden="true"
    >
      <circle cx="512" cy="512" r="320" fill="none" stroke="currentColor" strokeWidth="10" opacity=".35" />
      <g stroke="currentColor" strokeWidth="14" strokeLinecap="round" opacity=".55">
        <line x1="512" y1="347" x2="512" y2="250" />
        <line x1="654.9" y1="594.5" x2="738.9" y2="643" />
        <line x1="369.1" y1="594.5" x2="285.1" y2="643" />
      </g>
      <circle cx="512" cy="512" r="150" fill="none" stroke="currentColor" strokeWidth="30" />
      <circle cx="512" cy="512" r="56" fill="currentColor" />
      {[
        [512, 192],
        [789.1, 672],
        [234.9, 672],
      ].map(([x, y]) => (
        <path
          key={`${x}-${y}`}
          d={node}
          fill="currentColor"
          stroke="currentColor"
          strokeWidth="20"
          strokeLinejoin="round"
          transform={`translate(${x} ${y})`}
        />
      ))}
    </svg>
  );
};
