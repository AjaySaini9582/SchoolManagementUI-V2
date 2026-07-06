/** Mirrors .NET's `DayOfWeek` numeric value (0=Sunday .. 6=Saturday), used
 * directly by the backend — keep this ordering (week starts Monday for
 * display) but the `value`s must stay the .NET numbers. */
export const DAYS_OF_WEEK = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 0, label: 'Sunday' },
] as const;

export interface TimetablePeriod {
  id: number;
  classSectionId: number;
  dayOfWeek: number;
  periodNumber: number;
  subjectId: number;
  teacherId: number | null;
  /** "HH:mm" — matches an HTML `<input type="time">` value directly. */
  startTime: string | null;
  endTime: string | null;
}

export interface TimetablePeriodListItem extends TimetablePeriod {
  subjectName: string | null;
  teacherName: string | null;
}
