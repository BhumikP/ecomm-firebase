
// src/components/layout/scrolling-h1-announcement-bar.tsx
import React from 'react';
import { cn } from '@/lib/utils';

interface ScrollingH1AnnouncementBarProps {
  text: string;
  className?: string;
  h1ClassName?: string;
}

export const ScrollingH1AnnouncementBar: React.FC<ScrollingH1AnnouncementBarProps> = ({
  text,
  className,
  h1ClassName,
}) => {
  return (
    <div className={cn("scrolling-h1-container", className)} aria-label="Scrolling Announcement">
      <div className="scrolling-h1-text">
        <h1 className={cn(h1ClassName)}>
          {text}
        </h1>
      </div>
    </div>
  );
};
