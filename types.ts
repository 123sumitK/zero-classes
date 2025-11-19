
export enum UserRole {
  STUDENT = 'STUDENT',
  INSTRUCTOR = 'INSTRUCTOR',
  ADMIN = 'ADMIN'
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  enrolledCourseIds?: string[]; // List of course IDs
}

export interface ClassSession {
  id: string;
  title: string;
  description: string;
  date: string; // ISO string
  meetLink: string;
  instructorName: string;
  price?: number; // Price in USD/INR base unit
  duration?: string; // e.g., "8 weeks", "2 hours"
  status?: 'ACTIVE' | 'ARCHIVED';
}

export interface CourseMaterial {
  id: string;
  title: string;
  type: 'PDF' | 'SLIDE' | 'DOC' | 'VIDEO';
  url: string; // Mock URL
  size: string;
  uploadedAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
}
