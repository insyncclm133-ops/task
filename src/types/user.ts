export type AppRole = 'platform_admin' | 'admin' | 'sales_manager' | 'sales_agent' | 'support_manager' | 'support_agent' | 'analyst';

export interface Organization {
  id: string;
  name: string;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  org_id: string;
  role: AppRole;
  is_active: boolean;
  created_at: string;
  profiles?: UserProfile;
}

export interface UserProfile {
  id: string;
  full_name: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  org_id: string | null;
  designation_id: string | null;
  department: string | null;
  is_platform_admin: boolean;
  is_active: boolean;
  onboarding_completed: boolean;
  designation?: Designation | null;
}

export interface Designation {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  role: AppRole;
  is_active: boolean;
  created_at: string;
  employee_count?: number;
}

export interface ReportingRelation {
  id: string;
  org_id: string;
  designation_id: string;
  reports_to_designation_id: string | null;
}

export interface DesignationPermission {
  feature_key: string;
  can_view: boolean | null;
  can_create: boolean | null;
  can_edit: boolean | null;
  can_delete: boolean | null;
  custom_permissions: unknown;
}

export interface DesignationAccess {
  feature_key: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

export interface FeaturePermission {
  id: string;
  feature_key: string;
  feature_name: string;
  feature_description: string | null;
  category: string;
  is_premium: boolean;
}

export const APP_ROLES: { value: AppRole; label: string }[] = [
  { value: 'platform_admin', label: 'Platform Admin' },
  { value: 'admin', label: 'Admin' },
  { value: 'sales_manager', label: 'Sales Manager' },
  { value: 'sales_agent', label: 'Sales Agent' },
  { value: 'support_manager', label: 'Support Manager' },
  { value: 'support_agent', label: 'Support Agent' },
  { value: 'analyst', label: 'Analyst' },
];

export function getRoleBadgeColor(role: string): string {
  const colors: Record<string, string> = {
    platform_admin: 'bg-violet-100 text-violet-800 border-violet-200',
    admin: 'bg-red-100 text-red-800 border-red-200',
    sales_manager: 'bg-blue-100 text-blue-800 border-blue-200',
    sales_agent: 'bg-green-100 text-green-800 border-green-200',
    support_manager: 'bg-amber-100 text-amber-800 border-amber-200',
    support_agent: 'bg-orange-100 text-orange-800 border-orange-200',
    analyst: 'bg-gray-100 text-gray-800 border-gray-200',
  };
  return colors[role] || 'bg-gray-100 text-gray-800 border-gray-200';
}
