
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { X, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnnouncementData {
  announcementText?: string;
  announcementLink?: string;
  isAnnouncementActive?: boolean;
}

export function AnnouncementBar() {
  const [announcement, setAnnouncement] = useState<AnnouncementData | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnnouncement = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/settings');
        if (!response.ok) {
          throw new Error('Failed to fetch announcement settings');
        }
        const data: AnnouncementData = await response.json();
        setAnnouncement(data);

        // Check local storage for dismissal
        const dismissed = localStorage.getItem('announcementDismissed') === data.announcementText;
        if (data.isAnnouncementActive && data.announcementText && !dismissed) {
          setIsVisible(true);
        } else {
          setIsVisible(false);
        }
      } catch (err: any) {
        console.error("Error fetching announcement:", err);
        setError(err.message);
        setIsVisible(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnnouncement();
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    if (announcement?.announcementText) {
      // Store the specific text of the dismissed announcement.
      // This way, if the announcement text changes, the new one will show.
      localStorage.setItem('announcementDismissed', announcement.announcementText);
    }
  };

  if (isLoading) {
    // Optional: render a slim skeleton or nothing during load to avoid layout shift
    return <div className="h-0" aria-busy="true"></div>;
  }

  if (error) {
    // Optional: render a small error indicator or log, but usually best to fail silently for non-critical UI like this
    console.warn("Announcement bar error:", error);
    return null; 
  }

  if (!isVisible || !announcement || !announcement.isAnnouncementActive || !announcement.announcementText) {
    return null;
  }

  const BarContent = () => (
    <>
      <span className="text-sm text-center flex-grow">{announcement.announcementText}</span>
      <button
        onClick={handleDismiss}
        aria-label="Dismiss announcement"
        className="p-1 rounded-full hover:bg-primary/20 transition-colors absolute right-2 top-1/2 -translate-y-1/2"
      >
        <X className="h-4 w-4" />
      </button>
    </>
  );

  return (
    <div
      className={cn(
        "bg-primary text-primary-foreground px-4 py-2.5 flex items-center justify-center relative transition-all duration-300 ease-in-out",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-full h-0 py-0 overflow-hidden"
      )}
      role="alert"
      aria-live="polite"
    >
      {announcement.announcementLink ? (
        <Link href={announcement.announcementLink} className="flex items-center justify-center w-full hover:underline focus:underline focus:outline-none focus:ring-1 focus:ring-primary-foreground rounded">
          <BarContent />
        </Link>
      ) : (
        <div className="flex items-center justify-center w-full">
           <BarContent />
        </div>
      )}
    </div>
  );
}
