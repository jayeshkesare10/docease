const BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api';

export function getToken(): string | null {
  return localStorage.getItem('docease_token');
}

export function setToken(token: string): void {
  localStorage.setItem('docease_token', token);
}

export function clearToken(): void {
  localStorage.removeItem('docease_token');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const errorMsg = data.error || `Request failed with status ${res.status}`;
    const error: any = new Error(errorMsg);
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data as T;
}

export const api = {
  // Auth
  auth: {
    registerCitizen: (body: any) => request<any>('/auth/register-citizen', { method: 'POST', body: JSON.stringify(body) }),
    verifyOtp: (userId: number, otp: string) => request<any>('/auth/verify-otp', { method: 'POST', body: JSON.stringify({ userId, otp }) }),
    resendOtp: (userId: number) => request<any>('/auth/resend-otp', { method: 'POST', body: JSON.stringify({ userId }) }),
    registerOfficial: (body: any) => request<any>('/auth/register-official', { method: 'POST', body: JSON.stringify(body) }),
    login: (identifier: string, password: string) => request<any>('/auth/login', { method: 'POST', body: JSON.stringify({ identifier, password }) }),
    getMe: () => request<any>('/auth/me'),
    updateProfile: (body: any) => request<any>('/auth/profile', { method: 'PUT', body: JSON.stringify(body) }),
  },

  // Services & Guidance
  services: {
    list: (q = '', category = '') => {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (category && category !== 'all') params.set('category', category);
      return request<{ services: any[]; total: number }>(`/services?${params.toString()}`);
    },
    categories: () => request<Array<{ category: string; count: number }>>('/services/categories'),
    getDetail: (slug: string) => request<any>(`/services/${slug}`),
    toggleSave: (serviceId: number) => request<{ saved: boolean; message: string }>(`/services/${serviceId}/toggle-save`, { method: 'POST' }),
    getSaved: () => request<any[]>('/services/saved'),
    reportIssue: (body: any) => request<any>('/services/report-issue', { method: 'POST', body: JSON.stringify(body) }),
  },

  // Checklists
  checklists: {
    list: () => request<any[]>('/checklists'),
    start: (serviceId: number, title?: string) => request<{ success: boolean; checklistId: number }>('/checklists/start', { method: 'POST', body: JSON.stringify({ serviceId, title }) }),
    getDetail: (id: number) => request<any>(`/checklists/${id}`),
    updateItem: (itemId: number, status: string, userNotes?: string) => request<any>(`/checklists/items/${itemId}`, { method: 'PUT', body: JSON.stringify({ status, userNotes }) }),
    delete: (id: number) => request<any>(`/checklists/${id}`, { method: 'DELETE' }),
  },

  // Vault
  vault: {
    list: () => request<any[]>('/vault'),
    upload: (formData: FormData) => request<any>('/vault/upload', { method: 'POST', body: formData }),
    delete: (id: number) => request<any>(`/vault/${id}`, { method: 'DELETE' }),
    getDownloadUrl: (id: number) => `${BASE_URL}/vault/download/${id}`,
    getViewUrl: (id: number) => `${BASE_URL}/vault/view/${id}`,
  },

  // Appointments
  appointments: {
    getOffices: (params: { category?: string; city?: string; pinCode?: string; q?: string } = {}) => {
      const sp = new URLSearchParams();
      if (params.category && params.category !== 'all') sp.set('category', params.category);
      if (params.city) sp.set('city', params.city);
      if (params.pinCode) sp.set('pinCode', params.pinCode);
      if (params.q) sp.set('q', params.q);
      return request<any[]>(`/appointments/offices?${sp.toString()}`);
    },
    getSlots: (officeId: number, date: string) => request<any>(`/appointments/slots?officeId=${officeId}&date=${date}`),
    book: (body: any) => request<any>('/appointments/book', { method: 'POST', body: JSON.stringify(body) }),
    myAppointments: () => request<any[]>('/appointments/my'),
    cancel: (id: number) => request<any>(`/appointments/${id}/cancel`, { method: 'PUT' }),
    reschedule: (id: number, appointmentDate: string, timeSlot: string) => request<any>(`/appointments/${id}/reschedule`, { method: 'PUT', body: JSON.stringify({ appointmentDate, timeSlot }) }),
  },

  // Official
  official: {
    getDashboard: () => request<any>('/official/dashboard'),
    getAppointments: (params: { date?: string; status?: string; search?: string } = {}) => {
      const sp = new URLSearchParams();
      if (params.date) sp.set('date', params.date);
      if (params.status && params.status !== 'all') sp.set('status', params.status);
      if (params.search) sp.set('search', params.search);
      return request<any[]>(`/official/appointments?${sp.toString()}`);
    },
    verifyQR: (qrToken: string) => request<any>('/official/verify-qr', { method: 'POST', body: JSON.stringify({ qrToken }) }),
    recordOutcome: (body: { appointmentId: number; status: string; notes?: string }) => request<any>('/official/record-outcome', { method: 'POST', body: JSON.stringify(body) }),
    getAuditLogs: () => request<any[]>('/official/audit-logs'),
  },

  // Admin CMS
  admin: {
    getPendingOfficials: () => request<any[]>('/admin/officials/pending'),
    approveOfficial: (profileId: number) => request<any>(`/admin/officials/${profileId}/approve`, { method: 'POST' }),
    rejectOfficial: (profileId: number, reason: string) => request<any>(`/admin/officials/${profileId}/reject`, { method: 'POST', body: JSON.stringify({ reason }) }),
    addService: (body: any) => request<any>('/admin/services', { method: 'POST', body: JSON.stringify(body) }),
    updateService: (id: number, body: any) => request<any>(`/admin/services/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    getFeedback: () => request<any[]>('/admin/feedback'),
  }
};
