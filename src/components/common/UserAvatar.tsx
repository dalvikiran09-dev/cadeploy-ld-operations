import React from 'react';
import { getInitials, getAvatarColorClass } from '../../utils/avatarUtils';

export interface UserAvatarProps {
  name?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'custom';
  className?: string;
  seed?: string;
  title?: string;
}

const SIZE_CLASSES: Record<string, string> = {
  xs: 'w-5 h-5 text-[10px]',
  sm: 'w-6 h-6 text-xs',
  md: 'w-7 h-7 text-xs',
  lg: 'w-9 h-9 text-sm',
  xl: 'w-10 h-10 text-base',
  '2xl': 'w-12 h-12 text-lg',
  custom: ''
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  name,
  size = 'md',
  className = '',
  seed,
  title
}) => {
  const displayName = name || 'User';
  const initials = getInitials(displayName);
  const colorClass = getAvatarColorClass(seed || displayName);
  const sizeClass = size !== 'custom' ? SIZE_CLASSES[size] || SIZE_CLASSES.md : '';

  return (
    <div
      className={`rounded-full flex items-center justify-center font-semibold select-none shrink-0 tracking-tight transition-colors shadow-xs ${colorClass} ${sizeClass} ${className}`}
      title={title || displayName}
      aria-label={displayName}
    >
      <span>{initials}</span>
    </div>
  );
};
