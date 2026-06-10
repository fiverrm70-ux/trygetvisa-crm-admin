export type UserRole =
  | 'SUPER_ADMIN'
  | 'LEADS_EXECUTIVE'
  | 'SALES_EXECUTIVE'
  | 'PROCESS_EXECUTIVE';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};
