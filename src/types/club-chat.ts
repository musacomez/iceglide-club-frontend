import type { UserRole } from './api';

export interface ClubMessage {
  id: number;
  author_id: number;
  author_name: string;
  author_role: UserRole;
  message: string;
  created_at: string;
}

export interface ClubMessagePage {
  messages: ClubMessage[];
  next_before: number | null;
}
