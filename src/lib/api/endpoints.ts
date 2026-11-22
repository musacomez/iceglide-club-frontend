import { apiRequest } from './client';
import type { ClubMessagePage } from '@/types/club-chat';
import type {
  AttendanceRecord,
  CoachInput,
  ManagedCoach,
  CreateAttendanceInput,
  DashboardSummary,
  LessonDetail,
  LessonInput,
  LessonListItem,
  LoginResult,
  Lookups,
  Me,
  LookupOption,
  ManagedPackageType,
  ManualChargeInput,
  PackageTypeInput,
  ReceiptInput,
  StudentCharge,
  PackageItem,
  PackageAssignment,
  PackageTypeOption,
  PaymentItem,
  StudentDetail,
  StudentInput,
  StudentListItem,
} from '@/types/api';

export const api = {
  login: (email: string, password: string) =>
    apiRequest<LoginResult>('/api/auth/login', { method: 'POST', body: { email, password } }),

  changePassword: (currentPassword: string, newPassword: string) =>
    apiRequest<{ changed: true }>('/api/auth/change-password', {
      method: 'POST',
      body: { current_password: currentPassword, new_password: newPassword },
    }),

  me: () => apiRequest<Me>('/api/me'),

  listClubMessages: (before?: number) =>
    apiRequest<ClubMessagePage>('/api/club-chat/messages', { query: { before } }),

  sendClubMessage: (message: string) =>
    apiRequest<{ id: number }>('/api/club-chat/messages', { method: 'POST', body: { message } }),

  hideClubMessage: (id: number) =>
    apiRequest<{ id: number }>(`/api/club-chat/messages/${id}`, { method: 'DELETE' }),

  dashboardSummary: () => apiRequest<DashboardSummary>('/api/dashboard/summary'),

  listStudents: (params: { status?: string; search?: string } = {}) =>
    apiRequest<StudentListItem[]>('/api/students', { query: params }),

  getStudent: (id: number) => apiRequest<StudentDetail>(`/api/students/${id}`),

  getStudentAccount: (id: number) =>
    apiRequest<{ email: string | null; active: boolean | null }>(`/api/students/${id}/account`),

  saveStudentAccount: (id: number, create: boolean, body: { email: string; password?: string }) =>
    apiRequest<{ email: string; active: boolean }>(`/api/students/${id}/account`, {
      method: create ? 'POST' : 'PATCH', body,
    }),

  listLessons: (from: string, to: string) =>
    apiRequest<LessonListItem[]>('/api/lessons', { query: { from, to } }),

  getLesson: (id: number) => apiRequest<LessonDetail>(`/api/lessons/${id}`),

  lessonAttendance: (id: number) => apiRequest<AttendanceRecord[]>(`/api/lessons/${id}/attendance`),

  recordAttendance: (input: CreateAttendanceInput) =>
    apiRequest<AttendanceRecord>('/api/attendance', { method: 'POST', body: input }),

  listStudentPackages: (studentId: number) =>
    apiRequest<PackageItem[]>(`/api/packages/student/${studentId}`),

  adjustPackageLessons: (studentId: number, packageId: number, body: {
    quantity_delta: number;
    expected_remaining_lessons: number;
    reason: string;
    request_id: string;
  }) => apiRequest<{ remaining_lessons: number }>(
    `/api/packages/student/${studentId}/${packageId}/lesson-adjustments`, { method: 'POST', body },
  ),

  listPackageTypes: () => apiRequest<PackageTypeOption[]>('/api/packages/types'),

  assignStudentPackage: (studentId: number, body: PackageAssignment) =>
    apiRequest<{ id: number; charge_id: number | null }>(`/api/packages/student/${studentId}`, {
      method: 'POST', body,
    }),

  listStudentPayments: (studentId: number) =>
    apiRequest<PaymentItem[]>(`/api/payments/student/${studentId}`),

  // ---- Yönetim (admin / head_coach) ----
  saveGroup: (name: string, id?: number) =>
    apiRequest<LookupOption>(id === undefined ? '/api/groups' : `/api/groups/${id}`, {
      method: id === undefined ? 'POST' : 'PATCH', body: { name },
    }),

  listManagedPackageTypes: () => apiRequest<ManagedPackageType[]>('/api/manage/package-types'),

  savePackageType: (body: PackageTypeInput, id?: number) =>
    apiRequest<ManagedPackageType>(id === undefined ? '/api/manage/package-types' : `/api/manage/package-types/${id}`, {
      method: id === undefined ? 'POST' : 'PATCH', body,
    }),

  listCharges: (studentId: number) =>
    apiRequest<StudentCharge[]>(`/api/finance/student/${studentId}/charges`),

  createCharge: (studentId: number, body: ManualChargeInput) =>
    apiRequest<{ id: number }>(`/api/finance/student/${studentId}/charges`, { method: 'POST', body }),

  cancelCharge: (studentId: number, chargeId: number) =>
    apiRequest<{ id: number }>(`/api/finance/student/${studentId}/charges/${chargeId}/cancel`, { method: 'POST' }),

  receivePayment: (studentId: number, chargeId: number, body: ReceiptInput) =>
    apiRequest<{ id: number }>(`/api/finance/student/${studentId}/charges/${chargeId}/payments`, { method: 'POST', body }),

  listCoaches: () => apiRequest<ManagedCoach[]>('/api/manage/coaches'),

  saveCoach: (body: CoachInput, id?: number) =>
    apiRequest<{ id: number }>(id === undefined ? '/api/manage/coaches' : `/api/manage/coaches/${id}`, {
      method: id === undefined ? 'POST' : 'PATCH', body,
    }),

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
