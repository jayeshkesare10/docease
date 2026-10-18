export type Language = 'en' | 'hi' | 'mr';

export type UserRole = 'citizen' | 'official' | 'admin';

export interface User {
  id: number;
  email: string | null;
  mobile: string | null;
  full_name: string;
  role: UserRole;
  state?: string;
  city?: string;
  locality?: string;
  pin_code?: string;
  preferred_language: Language;
  created_at?: string;
}

export interface OfficialProfile {
  id: number;
  user_id: number;
  department: string;
  designation: string;
  employee_id: string;
  office_id: number | null;
  office_name?: string;
  office_city?: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  created_at: string;
}

export interface ServiceSummary {
  id: number;
  slug: string;
  category: string;
  title_en: string;
  title_hi: string;
  title_mr: string;
  subtitle_en?: string;
  subtitle_hi?: string;
  subtitle_mr?: string;
  description_en: string;
  description_hi: string;
  description_mr: string;
  fees_info_en?: string;
  fees_info_hi?: string;
  fees_info_mr?: string;
  processing_time_en?: string;
  processing_time_hi?: string;
  processing_time_mr?: string;
  official_source_name: string;
  official_source_url: string;
  last_verified_date: string;
  verification_status: string;
  applicable_office_category: string;
  totalRequirements: number;
  stepCount: number;
}

export interface ProcedureStep {
  step: number;
  title_en: string;
  title_hi: string;
  title_mr: string;
  desc_en: string;
  desc_hi: string;
  desc_mr: string;
}

export interface HowToObtain {
  apply_where: string;
  required_docs: string;
  official_url: string;
  fee: string;
  processing_time: string;
  next_action: string;
}

export interface Requirement {
  id: number;
  service_id: number;
  name_en: string;
  name_hi: string;
  name_mr: string;
  purpose_en: string;
  purpose_hi: string;
  purpose_mr: string;
  requirement_type: 'mandatory' | 'conditional' | 'optional';
  accepted_alternatives: string[];
  format_conditions_en?: string;
  format_conditions_hi?: string;
  format_conditions_mr?: string;
  how_to_obtain?: HowToObtain;
  order_num: number;
}

export interface Office {
  id: number;
  name: string;
  category: string;
  address: string;
  city: string;
  state: string;
  pin_code: string;
  phone?: string;
  email?: string;
  lat?: number;
  lng?: number;
  operating_hours: string;
  appointment_required: number;
}

export interface ServiceDetail extends ServiceSummary {
  eligibility_en: string;
  eligibility_hi: string;
  eligibility_mr: string;
  conditions_en?: string;
  conditions_hi?: string;
  conditions_mr?: string;
  procedure_steps: ProcedureStep[];
}

export interface ChecklistItem {
  item_id: number;
  status: 'available' | 'missing' | 'not_applicable';
  user_notes?: string;
  item_updated_at: string;
  requirement_id: number;
  name_en: string;
  name_hi: string;
  name_mr: string;
  purpose_en: string;
  purpose_hi: string;
  purpose_mr: string;
  requirement_type: 'mandatory' | 'conditional' | 'optional';
  accepted_alternatives: string[];
  format_conditions_en?: string;
  format_conditions_hi?: string;
  format_conditions_mr?: string;
  how_to_obtain?: HowToObtain;
  order_num: number;
}

export interface UserChecklist {
  id: number;
  service_id: number;
  service_slug: string;
  service_title_en: string;
  service_title_hi: string;
  service_title_mr: string;
  service_category: string;
  applicable_office_category?: string;
  official_source_url?: string;
  title: string;
  status: 'in_progress' | 'completed';
  notes?: string;
  total_items: number;
  available_items: number;
  missing_items: number;
  progressPercent: number;
  isComplete: boolean;
  created_at: string;
  updated_at: string;
}

export interface VaultDocument {
  id: number;
  original_name: string;
  file_size: number;
  mime_type: string;
  category: string;
  title: string;
  notes?: string;
  created_at: string;
}

export interface Appointment {
  id: number;
  appointment_number: string;
  service_id: number;
  service_title_en: string;
  service_title_hi: string;
  service_title_mr: string;
  service_slug: string;
  office_id: number;
  office_name: string;
  office_address: string;
  office_city: string;
  office_phone?: string;
  appointment_date: string;
  time_slot: string;
  status: 'confirmed' | 'completed' | 'cancelled' | 'rescheduled';
  qr_token: string;
  qr_data_url?: string;
  citizen_notes?: string;
  created_at: string;
}
