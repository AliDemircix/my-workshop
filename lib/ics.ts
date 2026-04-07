/**
 * Generates RFC 5545 compliant ICS content for a workshop reservation.
 * No external packages — plain string construction.
 */
export interface ICSParams {
  reservationId: number;
  categoryName: string;
  date: Date;
  startTime: Date;
  endTime: Date;
  location?: string | null;
}

function formatICSDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

export function generateICS(params: ICSParams): string {
  const { reservationId, categoryName, date, startTime, endTime, location } = params;

  // Combine the calendar date with the time-of-day from startTime/endTime
  const dtStart = new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      startTime.getUTCHours(),
      startTime.getUTCMinutes(),
      0,
    ),
  );
  const dtEnd = new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      endTime.getUTCHours(),
      endTime.getUTCMinutes(),
      0,
    ),
  );

  const now = new Date();
  const uid = `reservation-${reservationId}@workshop`;
  const summary = `${categoryName} Workshop`;

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Workshop//Reservation//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${formatICSDate(now)}`,
    `DTSTART:${formatICSDate(dtStart)}`,
    `DTEND:${formatICSDate(dtEnd)}`,
    `SUMMARY:${summary}`,
    ...(location ? [`LOCATION:${location}`] : []),
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  return lines.join('\r\n');
}
