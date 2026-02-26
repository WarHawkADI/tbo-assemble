"use client";

import { CalendarPlus } from "lucide-react";
import { useState } from "react";

interface CalendarExportProps {
  eventName: string;
  venue: string;
  location: string;
  checkIn: Date | string;
  checkOut: Date | string;
  description?: string;
  primaryColor?: string;
}

export function CalendarExport({
  eventName,
  venue,
  location,
  checkIn,
  checkOut,
  description,
  primaryColor = "#3B82F6",
}: CalendarExportProps) {
  const [downloading, setDownloading] = useState(false);

  const generateICS = () => {
    setDownloading(true);
    
    const startDate = new Date(checkIn);
    const endDate = new Date(checkOut);
    
    // Format dates for ICS (YYYYMMDD format for all-day events)
    const formatICSDate = (date: Date) => {
      return date.toISOString().split('T')[0].replace(/-/g, '');
    };

    // Escape special characters for ICS
    const escapeICS = (str: string) => {
      return str
        .replace(/\\/g, '\\\\')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,')
        .replace(/\n/g, '\\n');
    };

    const uid = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}@tboassemble`;
    const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//TBO Assemble//Event Booking//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${now}`,
      `DTSTART;VALUE=DATE:${formatICSDate(startDate)}`,
      `DTEND;VALUE=DATE:${formatICSDate(endDate)}`,
      `SUMMARY:${escapeICS(eventName)}`,
      `LOCATION:${escapeICS(`${venue}, ${location}`)}`,
      description ? `DESCRIPTION:${escapeICS(description)}` : '',
      'STATUS:CONFIRMED',
      'TRANSP:OPAQUE',
      // Add reminder 1 day before
      'BEGIN:VALARM',
      'TRIGGER:-P1D',
      'ACTION:DISPLAY',
      `DESCRIPTION:Reminder: ${escapeICS(eventName)} starts tomorrow!`,
      'END:VALARM',
      // Add reminder 1 week before
      'BEGIN:VALARM',
      'TRIGGER:-P7D',
      'ACTION:DISPLAY',
      `DESCRIPTION:Reminder: ${escapeICS(eventName)} is in 1 week!`,
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR',
    ].filter(Boolean).join('\r\n');

    // Create and download the file
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${eventName.replace(/[^a-z0-9]/gi, '_')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    setTimeout(() => setDownloading(false), 1000);
  };

  return (
    <button
      onClick={generateICS}
      disabled={downloading}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm border shadow-sm hover:scale-105 transition-all duration-200 disabled:opacity-50"
      style={{ 
        backgroundColor: `${primaryColor}15`, 
        borderColor: `${primaryColor}30`, 
        color: primaryColor 
      }}
      title="Add to your calendar"
    >
      <CalendarPlus className={`h-3.5 w-3.5 ${downloading ? 'animate-bounce' : ''}`} />
      {downloading ? 'Adding...' : 'Add to Calendar'}
    </button>
  );
}
