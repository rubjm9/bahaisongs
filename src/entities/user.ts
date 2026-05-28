export type UserRole = 'user' | 'admin';

export interface Profile {
  id: string;
  displayName?: string;
  avatarPath?: string;
  role: UserRole;
  locale: string;
}
