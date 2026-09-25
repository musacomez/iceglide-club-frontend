import { apiRequest } from './client';
import type {
  AttendanceRecord,
  CreateAttendanceInput,
  DashboardSummary,
  LessonDetail,
  LessonListItem,
  LoginResult,
  Me,
  PackageItem,
  PaymentItem,
  StudentDetail,
  StudentListItem,
} from '@/types/api';

export const api = {
  login: (email: string, password: string) =>
    apiRequest<LoginResult>('/api/auth/login', { method: 'POST', body: { email, password } }),

  me: () => apiRequest<Me>('/api/me'),

  dashboardSummary: () => apiRequest<DashboardSummary>('/api/dashboard/summary'),

  listStudents: (params: { status?: string; search?: string } = {}) =>
    apiRequest<StudentListItem[]>('/api/students', { query: params }),

  getStudent: (id: number) => apiRequest<StudentDetail>(`/api/students/${id}`),

  listLessons: (from: string, to: string) =>
    apiRequest<LessonListItem[]>('/api/lessons', { query: { from, to } }),

  getLesson: (id: number) => apiRequest<LessonDetail>(`/api/lessons/${id}`),

  lessonAttendance: (id: number) => apiRequest<AttendanceRecord[]>(`/api/lessons/${id}/attendance`),

  recordAttendance: (input: CreateAttendanceInput) =>
    apiRequest<AttendanceRecord>('/api/attendance', { method: 'POST', body: input }),

  listStudentPackages: (studentId: number) =>
    apiRequest<PackageItem[]>(`/api/packages/student/${studentId}`),

  listStudentPayments: (studentId: number) =>
    apiRequest<PaymentItem[]>(`/api/payments/student/${studentId}`),
};
