import { format, parseISO } from "date-fns";

export function formatDate(date: string | Date, formatStr: string = "dd/MM/yyyy"): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, formatStr);
}

export function formatTime(time: string): string {
  return time.substring(0, 5); // HH:mm format
}

export function calculateWorkHours(checkIn: string, checkOut: string): number {
  const [inHours, inMinutes] = checkIn.split(":").map(Number);
  const [outHours, outMinutes] = checkOut.split(":").map(Number);
  
  const inTotalMinutes = inHours * 60 + inMinutes;
  const outTotalMinutes = outHours * 60 + outMinutes;
  
  return (outTotalMinutes - inTotalMinutes) / 60;
}
