import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import type { Profile } from '@/types/task';
import { supabase } from '@/lib/supabase';

export type AppRole = 'platform_admin' | 'admin' | 'sales_manager' | 'sales_agent' | 'support_manager' | 'support_agent' | 'analyst';

interface DesignationPermission {
  feature_key: string;
  can_view: boolean | null;
  can_create: boolean | null;
  can_edit: boolean | null;
  can_delete: boolean | null;
  custom_permissions: unknown;
}

interface Organization {
  id: string;
  name: string;
  logo_url: string | null;
}

interface AuthContextType {
  // Auth state
  session: Session | null;
  user: User | null;
  isAuthenticated: boolean;

  // Profile
  profile: Profile | null;
  orgId: string | null;
  userName: string;

  // Organization
  organization: Organization | null;
  orgName: string;
  orgLogo: string;

  // Roles & permissions
  userRole: AppRole | null;
  isPlatformAdmin: boolean;
  isAdmin: boolean;
  isManager: boolean;
  designationPermissions: DesignationPermission[];

  // Loading
  isLoading: boolean;
  isInitialized: boolean;
  profileError: string | null;

  // Permission helpers
  hasPermission: (featureKey: string, permission: 'view' | 'create' | 'edit' | 'delete') => boolean;
  canAccessFeature: (featureKey: string) => boolean;

  // Actions
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ needsConfirmation: boolean }>;
  signOut: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [userRole, setUserRole] = useState<AppRole | null>(null);
  const [designationPermissions, setDesignationPermissions] = useState<DesignationPermission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [pendingSignInUser, setPendingSignInUser] = useState<User | null>(null);

  const isInitializingRef = useRef(true);
  const fetchInProgressRef = useRef(false);

  const fetchUserData = useCallback(async (currentUser: User) => {
    if (fetchInProgressRef.current) return;
    fetchInProgressRef.current = true;

    try {
      setProfileError(null);

      // Fetch profile first
      const profileRes = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      if (profileRes.error || !profileRes.data) {
        setProfileError('Failed to load your profile.');
        return;
      }

      setProfile(profileRes.data);

      // Fetch role
      const roleRes = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', currentUser.id)
        .eq('is_active', true)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      const role = (roleRes.data?.role as AppRole) ?? null;
      setUserRole(role);

      // Platform admin: skip org/designation fetching (they have no org)
      if (role === 'platform_admin') {
        setOrganization(null);
        setDesignationPermissions([]);
        return;
      }

      // Org user: fetch org and permissions in parallel
      const orgId = profileRes.data.org_id;
      const designationId = profileRes.data.designation_id;

      const [orgRes, permissionsRes] = await Promise.all([
        orgId
          ? supabase
              .from('organizations')
              .select('id, name, logo_url')
              .eq('id', orgId)
              .single()
          : Promise.resolve({ data: null, error: null }),
        designationId
          ? supabase
              .from('designation_feature_access')
              .select('feature_key, can_view, can_create, can_edit, can_delete, custom_permissions')
              .eq('designation_id', designationId)
          : Promise.resolve({ data: [], error: null }),
      ]);

      if (orgRes.data) {
        setOrganization(orgRes.data);
      }

      if (permissionsRes.data) {
        setDesignationPermissions(permissionsRes.data as DesignationPermission[]);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setProfileError('An error occurred while loading your account.');
    } finally {
      fetchInProgressRef.current = false;
    }
  }, []);

  const refreshAuth = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        await fetchUserData(currentSession.user);
      }
    } catch (error) {
      console.error('Error refreshing auth:', error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchUserData]);

  useEffect(() => {
    let mounted = true;
    isInitializingRef.current = true;

    const initAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();

        if (!mounted) return;

        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          await fetchUserData(currentSession.user);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        if (mounted) {
          isInitializingRef.current = false;
          setIsLoading(false);
          setIsInitialized(true);
        }
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!mounted) return;

        if (isInitializingRef.current) return;

        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (event === 'TOKEN_REFRESHED' && currentSession?.user) return;

        if (event === 'SIGNED_IN' && currentSession?.user) {
          setPendingSignInUser(currentSession.user);
        } else if (event === 'SIGNED_OUT') {
          setProfile(null);
          setOrganization(null);
          setUserRole(null);
          setDesignationPermissions([]);
          setIsLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUserData]);

  // Process pending sign-in outside onAuthStateChange
  useEffect(() => {
    if (!pendingSignInUser) return;

    const processPendingSignIn = async () => {
      if (!fetchInProgressRef.current) {
        await fetchUserData(pendingSignInUser);
      }
      setPendingSignInUser(null);
    };

    processPendingSignIn();
  }, [pendingSignInUser, fetchUserData]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          first_name: fullName.split(' ')[0],
          last_name: fullName.split(' ').slice(1).join(' '),
        },
      },
    });
    if (error) throw error;
    return { needsConfirmation: !data.session };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    setProfile(null);
    setOrganization(null);
    setUserRole(null);
    setDesignationPermissions([]);
  };

  const hasPermission = useCallback(
    (featureKey: string, permission: 'view' | 'create' | 'edit' | 'delete'): boolean => {
      if (userRole === 'platform_admin' || userRole === 'admin') return true;

      const perm = designationPermissions.find((p) => p.feature_key === featureKey);
      if (!perm) return true;

      const map = {
        view: perm.can_view,
        create: perm.can_create,
        edit: perm.can_edit,
        delete: perm.can_delete,
      };

      return map[permission] ?? false;
    },
    [designationPermissions, userRole]
  );

  const canAccessFeature = useCallback(
    (featureKey: string): boolean => {
      return hasPermission(featureKey, 'view');
    },
    [hasPermission]
  );

  const isPlatformAdmin = userRole === 'platform_admin';
  const isAdmin = userRole === 'admin';
  const isManager = isAdmin || userRole === 'sales_manager' || userRole === 'support_manager';

  const value: AuthContextType = {
    session,
    user,
    isAuthenticated: !!session?.user,
    profile,
    orgId: profile?.org_id ?? null,
    userName: profile ? profile.full_name : '',
    organization,
    orgName: organization?.name ?? '',
    orgLogo: organization?.logo_url ?? '',
    userRole,
    isPlatformAdmin,
    isAdmin,
    isManager,
    designationPermissions,
    isLoading,
    isInitialized,
    profileError,
    hasPermission,
    canAccessFeature,
    signIn,
    signUp,
    signOut,
    refreshAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Convenience hooks
export function useOrgId() {
  const { orgId, isLoading } = useAuth();
  return { orgId, isLoading };
}

export function useUserRole() {
  const { userRole, isPlatformAdmin, isAdmin, isManager, isLoading } = useAuth();
  return { userRole, isPlatformAdmin, isAdmin, isManager, isLoading };
}
