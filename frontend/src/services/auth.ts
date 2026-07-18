const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  code?: string;
}

async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit,
  accessToken?: string
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>)
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  try {
    const res = await fetch(`${BACKEND_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include' // Send cookies (refresh token)
    });

    const data = await res.json();
    return data;
  } catch (err) {
    return { success: false, error: 'Network error. Please check your connection.' };
  }
}

// ─── Singleton Refresh Guard ──────────────────────────────────────────────────
// Prevents multiple simultaneous refresh calls (race condition that breaks session rotation)
let _refreshPromise: Promise<ApiResponse<{ accessToken: string; user: any }>> | null = null;

function singletonRefresh(): Promise<ApiResponse<{ accessToken: string; user: any }>> {
  if (_refreshPromise) return _refreshPromise;
  _refreshPromise = apiFetch<{ accessToken: string; user: any }>('/api/auth/refresh', { method: 'POST' })
    .finally(() => { _refreshPromise = null; });
  return _refreshPromise;
}

// ─── Register ────────────────────────────────────────────────────────────────
export async function registerUser(payload: {
  fullName: string;
  email: string;
  mobile: string;
  password: string;
  targetExam?: string;
}) {
  return apiFetch<{ accessToken: string; user: any }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

// ─── Login ───────────────────────────────────────────────────────────────────
export async function loginUser(email: string, password: string) {
  return apiFetch<{ accessToken: string; user: any }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
}

// ─── Send OTP ────────────────────────────────────────────────────────────────
export async function sendOTP(identifier: string, type: 'email' | 'mobile', purpose: 'login' | 'register' | 'reset' | 'verify') {
  return apiFetch<any>('/api/auth/send-otp', {
    method: 'POST',
    body: JSON.stringify({ identifier, type, purpose })
  });
}

// ─── Verify OTP ──────────────────────────────────────────────────────────────
export async function verifyOTP(identifier: string, type: 'email' | 'mobile', otp: string, purpose: 'login' | 'register' | 'reset' | 'verify') {
  return apiFetch<{ accessToken: string; user: any }>('/api/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ identifier, type, otp, purpose })
  });
}

// ─── Refresh Token ───────────────────────────────────────────────────────────
export async function refreshAccessToken() {
  return singletonRefresh();
}

// ─── Logout ──────────────────────────────────────────────────────────────────
export async function logoutUser(accessToken: string) {
  return apiFetch<any>('/api/auth/logout', { method: 'POST' }, accessToken);
}

// ─── Get Profile ─────────────────────────────────────────────────────────────
export async function getProfile(accessToken: string) {
  return apiFetch<any>('/api/auth/me', {}, accessToken);
}

// ─── Update Profile ──────────────────────────────────────────────────────────
export async function updateProfile(accessToken: string, payload: { fullName: string; mobile?: string; targetExam?: string; avatarUrl?: string }) {
  return apiFetch<any>('/api/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(payload)
  }, accessToken);
}

// ─── Forgot Password ─────────────────────────────────────────────────────────
export async function forgotPassword(email: string) {
  return apiFetch('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email })
  });
}

// ─── Reset Password ──────────────────────────────────────────────────────────
export async function resetPassword(email: string, otp: string, newPassword: string) {
  return apiFetch('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ email, otp, newPassword })
  });
}

// ─── LMS: Get Enrollments ────────────────────────────────────────────────────
export async function getMyEnrollments(accessToken: string) {
  return apiFetch<any[]>('/api/lms/enrollments/me', {}, accessToken);
}

// ─── LMS: Check Enrollment ───────────────────────────────────────────────────
export async function checkEnrollment(courseId: string, accessToken: string) {
  return apiFetch<{ enrolled: boolean }>(`/api/lms/enrollments/check/${courseId}`, {}, accessToken);
}

// ─── LMS: Get Course Progress ────────────────────────────────────────────────
export async function getCourseProgress(courseId: string, accessToken: string) {
  return apiFetch(`/api/lms/progress/${courseId}`, {}, accessToken);
}

// ─── LMS: Save Lesson Progress ───────────────────────────────────────────────
export async function saveLessonProgress(
  accessToken: string,
  data: { courseId: string; lessonId: string; completed?: boolean; watchedSeconds?: number; lastPosition?: number }
) {
  return apiFetch('/api/lms/progress', {
    method: 'POST',
    body: JSON.stringify(data)
  }, accessToken);
}

// ─── Payments: Create Order ──────────────────────────────────────────────────
export async function createRazorpayOrder(courseId: string, accessToken: string) {
  return apiFetch<{ id: string; amount: number; currency: string; key: string }>('/api/payments/create-order', {
    method: 'POST',
    body: JSON.stringify({ courseId })
  }, accessToken);
}

// ─── Payments: Verify Payment ────────────────────────────────────────────────
export async function verifyRazorpayPayment(
  payload: { razorpayPaymentId: string; razorpayOrderId: string; razorpaySignature: string; courseId: string },
  accessToken: string
) {
  return apiFetch<any>('/api/payments/verify', {
    method: 'POST',
    body: JSON.stringify(payload)
  }, accessToken);
}

// ─── Quizzes: Get Details ────────────────────────────────────────────────────
export async function getQuizDetails(quizId: string, accessToken: string) {
  return apiFetch<any>(`/api/quizzes/${quizId}`, {}, accessToken);
}

// ─── Quizzes: Start Quiz ─────────────────────────────────────────────────────
export async function startQuiz(quizId: string, accessToken: string) {
  return apiFetch<{ quiz: any; questions: any[] }>(`/api/quizzes/${quizId}/start`, {}, accessToken);
}

// ─── Quizzes: Submit Answers ──────────────────────────────────────────────────
export async function submitQuizAnswers(
  quizId: string,
  payload: { answers: Record<string, string>; timeTakenSecs: number },
  accessToken: string
) {
  return apiFetch<any>(`/api/quizzes/${quizId}/submit`, {
    method: 'POST',
    body: JSON.stringify(payload)
  }, accessToken);
}

// ─── Quizzes: Get Leaderboard ────────────────────────────────────────────────
export async function getQuizLeaderboard(quizId: string, accessToken: string) {
  return apiFetch<any[]>(`/api/quizzes/${quizId}/leaderboard`, {}, accessToken);
}

// ─── Chats: Get Rooms ────────────────────────────────────────────────────────
export async function getChatRooms(courseId: string, accessToken: string) {
  return apiFetch<any[]>(`/api/chats/rooms/${courseId}`, {}, accessToken);
}

// ─── Chats: Get Messages History ─────────────────────────────────────────────
export async function getChatMessages(roomId: string, accessToken: string) {
  return apiFetch<any[]>(`/api/chats/messages/${roomId}`, {}, accessToken);
}

// ─── Analytics: Get Metrics ──────────────────────────────────────────────────
export async function getStudentAnalytics(accessToken: string) {
  return apiFetch<{ courseCompletion: any[]; quizAnalytics: any[] }>('/api/lms/analytics/me', {}, accessToken);
}
