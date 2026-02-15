export enum UserRole {
  Admin = 'Admin',
  Pharmacist = 'Pharmacist',
  Cashier = 'Cashier',
}

export interface User {
  id: string;
  username: string;
  passwordHash: string; // In a real app, this would be a hashed password
  role: UserRole;
}