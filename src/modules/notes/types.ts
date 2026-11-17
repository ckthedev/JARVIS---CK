export interface NoteDto {
  id: string;
  title: string;
  content: string;
  isPinned: boolean;
  updatedAt: Date;
  tags: string[];
}
