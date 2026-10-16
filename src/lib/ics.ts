// Minimal iCalendar file for "Add to calendar" — the customer's own phone
// then delivers the reminder, at zero messaging cost.

function stamp(iso: string): string {
  return iso.replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function escape(text: string): string {
  return text.replace(/[\;,]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");
}

export function buildIcs(event: {
  uid: string;
  startsAt: string;
  endsAt: string;
  title: string;
  description?: string;
}): string {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Waqt//Booking//EN",
    "BEGIN:VEVENT",
    `UID:${event.uid}@waqt`,
    `DTSTAMP:${stamp(new Date().toISOString())}`,
    `DTSTART:${stamp(event.startsAt)}`,
    `DTEND:${stamp(event.endsAt)}`,
    `SUMMARY:${escape(event.title)}`,
    ...(event.description ? [`DESCRIPTION:${escape(event.description)}`] : []),
    "BEGIN:VALARM",
    "TRIGGER:-PT2H",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escape(event.title)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}
