export interface ReminderDto {
  id: string;
  title: string;
  description: string | null;
  dueAt: Date;
  isCompleted: boolean;
  priority: string;
}
