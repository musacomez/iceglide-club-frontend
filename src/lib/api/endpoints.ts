import { apiRequest } from './client';
import type {
  AttendanceRecord,
  CreateAttendanceInput,
  DashboardSummary,
  LessonDetail,
  LessonInput,
  LessonListItem,
  LoginResult,
  Lookups,
  Me,
  PackageItem,
  PaymentItem,
  StudentDetail,
  StudentInput,
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

  // ---- Yönetim (admin / head_coach) ----
  getLookups: () => apiRequest<Lookups>('/api/lookups'),

  createStudent: (input: StudentInput) =>
    apiRequest<{ id: number }>('/api/students', { method: 'POST', body: input }),

  updateStudent: (id: number, input: StudentInput) =>
    apiRequest<{ id: number }>(`/api/students/${id}`, { method: 'PATCH', body: input }),

  createLesson: (input: LessonInput) =>
    apiRequest<{ ids: number[]; count: number }>('/api/lessons', { method: 'POST', body: input }),

  updateLesson: (id: number, input: LessonInput) =>
    apiRequest<{ id: number }>(`/api/lessons/${id}`, { method: 'PATCH', body: input }),
};
