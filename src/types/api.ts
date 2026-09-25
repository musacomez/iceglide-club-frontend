// Types mirrored directly from the Worker's actual SQL selects and response
// shapes (src/routes/*.ts, src/lib/response.ts). Nothing here is invented -
// every field corresponds to a column the backend actually returns.

export type UserRole = 'admin' | 'head_coach' | 'instructor' | 'parent' | 'student';

export interface ApiOk<T> {
  success: true;
  data: T;
}

export interface ApiFail {
  success: false;
  message: string;
  details?: unknown;
}

export type ApiResponse<T> = ApiOk<T> | ApiFail;

export interface AuthUser {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  active: number;
}

export interface LoginResult {
  token: string;
  user: AuthUser;
}

export interface Me {
  id: number;
  email: string;
  full_name: string;
  phone: string | null;
  role: UserRole;
  active: number;
  last_login_at: string | null;
  created_at: string;
}

export interface DashboardSummary {
  active_students: number;
  exhausted_packages: number;
  low_packages: number;
  today_lessons: number;
  pending_private_lesson_requests: number;
}

export interface StudentListItem {
  id: number;
  full_name: string;
  status: string;
  birth_date: string | null;
  phone: string | null;
  email: string | null;
  photo_url: string | null;
  registration_date: string | null;
  current_level: string | null;
  current_group: string | null;
  account_email: string | null;
}

export interface StudentParent {
  parent_user_id: number;
  student_id: number;
  is_primary: number;
  full_name: string;
  email: string;
  phone: string | null;
}

export interface StudentInstructor {
  student_id: number;
  instructor_user_id: number;
  is_primary: number;
  end_date: string | null;
  full_name: string;
  email: string;
}

export interface PackageItem {
  id: number;
  student_id: number;
  package_type_id: number;
  package_number: string | null;
  status: string;
  remaining_lessons: number;
  starts_at: string | null;
  expires_at: string | null;
  purchased_at: string | null;
  updated_at: string;
  package_type_name: string;
  package_type_lesson_count?: number;
}

export interface StudentDetail {
  student: StudentListItem & Record<string, unknown>;
  parents: StudentParent[];
  instructors: StudentInstructor[];
  packages: PackageItem[];
}

export type LessonStatus = 'scheduled' | 'completed' | 'cancelled' | string;

export interface LessonListItem {
  id: number;
  template_id: number | null;
  private_request_id: number | null;
  title: string;
  lesson_type: string | null;
  group_id: number | null;
  instructor_user_id: number | null;
  location_id: number | null;
  lesson_date: string; // YYYY-MM-DD
  start_time: string | null; // HH:MM
  end_time: string | null;
  status: LessonStatus;
  cancellation_reason: string | null;
  notes: string | null;
  instructor_name: string | null;
  group_name: string | null;
  location_name: string | null;
}

export interface LessonRosterStudent {
  id: number;
  full_name: string;
  status: string;
  enrollment_status: string;
  attendance_id: number | null;
  attendance_status: 'present' | 'absent' | 'late' | 'excused' | null;
  attendance_note: string | null;
}

export interface LessonDetail {
  lesson: LessonListItem & Record<string, unknown>;
  students: LessonRosterStudent[];
}

export interface AttendanceRecord {
  student_id: number;
  full_name: string;
  student_status: string;
  attendance_id: number | null;
  attendance_status: 'present' | 'absent' | 'late' | 'excused' | null;
  attendance_note: string | null;
  recorded_by_user_id: number | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface PaymentItem {
  id: number;
  student_id: number;
  package_id: number | null;
  amount: number;
  payment_date: string;
  package_number: string | null;
}

export interface CreateAttendanceInput {
  lesson_instance_id: number;
  student_id: number;
  status: 'present' | 'absent' | 'late' | 'excused';
  note?: string | null;
}
