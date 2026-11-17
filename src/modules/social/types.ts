export interface SocialPostDto {
  id: string;
  content: string;
  status: string;
  scheduledFor: Date | null;
  accountName: string | null;
  platform: string | null;
}

export interface SocialAccountDto {
  id: string;
  platform: string;
  accountName: string;
  handle: string;
  status: string;
}
