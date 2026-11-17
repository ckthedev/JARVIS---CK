export interface MeetingDto {
  id: string;
  title: string;
  description: string | null;
  startTime: Date;
  endTime: Date;
  location: string | null;
  meetingUrl: string | null;
  status: string;
  attendeesCount: number;
}
