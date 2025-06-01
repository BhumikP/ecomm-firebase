
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
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
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true); // Component has mounted, safe to use client-side APIs
  }, []);

  useEffect(() => {
    if (!isClient) return; // Guard against running fetch/localStorage logic on server or before mount

    const fetchAnnouncement = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/settings');
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Failed to fetch announcement settings and parse error' }));
          throw new Error(errorData.message || 'Failed to fetch announcement settings');
        }
        const data: AnnouncementData = await response.json();
        setAnnouncement(data);
        
        const currentText = data.announcementText || ""; // Ensure currentText is a string
        // Dismissed if localStorage has the same non-empty text
        const dismissed = localStorage.getItem('announcementDismissed') === currentText && currentText !== ""; 

        if (data.isAnnouncementActive && currentText && !dismissed) {
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
  }, [isClient]); // Re-run when isClient becomes true

  const handleDismiss = () => {
    if (!isClient) return;
    setIsVisible(false);
    if (announcement?.announcementText) { // Only store if text exists
      localStorage.setItem('announcementDismissed', announcement.announcementText);
    }
  };
  
  if (!isClient || isLoading) {
    return <div className="h-0" aria-busy="true"></div>;
  }

  if (error) {
    // In a real app, you might log this to an error reporting service
    // For the user, it's often better to just not show the bar if it errors.
    return null; 
  }

  if (!isVisible || !announcement || !announcement.isAnnouncementActive || !announcement.announcementText) {
    return null;
  }

  const BarContent = () => (
    <>
      {/* Added px-8 to give text space from absolute positioned close button */}
      <span className="text-sm text-center flex-grow px-8">{announcement.announcementText}</span>
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
