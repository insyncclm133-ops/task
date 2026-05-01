import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify the request has a valid auth token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create a Supabase client with the user's token to verify they're an admin
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Verify the JWT by passing it directly — getUser() without an argument
    // uses the client's stored session (null on a fresh server-side client)
    // and ignores global.headers, so it must be passed explicitly.
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user: caller }, error: authError } = await adminClient.auth.getUser(token);
    if (authError || !caller) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if the caller is an admin or super_admin
    const { data: callerRole } = await adminClient
      .from('user_roles')
      .select('role, org_id')
      .eq('user_id', caller.id)
      .eq('is_active', true)
      .single();

    if (!callerRole || !['admin', 'platform_admin'].includes(callerRole.role)) {
      return new Response(JSON.stringify({ error: 'Forbidden: Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { action } = body;

    switch (action) {
      case 'create-user': {
        const { email, password, full_name: rawFullName, first_name, last_name, phone, org_id, role, designation_id, department } = body;

        if (!email || !phone) {
          return new Response(JSON.stringify({ error: 'Email and phone number are required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Derive full_name from first+last if not explicitly provided
        const full_name = rawFullName || [first_name, last_name].filter(Boolean).join(' ') || '';

        // Fall back to caller's org when not explicitly provided
        const effectiveOrgId = org_id || callerRole.org_id;

        // Create user in auth.users
        const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { full_name, first_name, last_name },
        });

        if (createError) {
          return new Response(JSON.stringify({ error: createError.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Update profile with additional fields
        const { error: profileError } = await adminClient
          .from('profiles')
          .update({
            full_name,
            first_name: first_name || null,
            last_name: last_name || null,
            phone: phone || null,
            org_id: effectiveOrgId || null,
            designation_id: designation_id || null,
            department: department || null,
            is_active: true,
          })
          .eq('id', newUser.user.id);

        if (profileError) {
          console.error('Profile update error:', profileError);
        }

        // Create user role
        if (effectiveOrgId && role) {
          const { error: roleError } = await adminClient
            .from('user_roles')
            .insert({
              user_id: newUser.user.id,
              org_id: effectiveOrgId,
              role,
              is_active: true,
            });

          if (roleError) {
            console.error('Role insert error:', roleError);
          }
        }

        return new Response(JSON.stringify({ user: newUser.user }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'update-user': {
        const { user_id, email, password, full_name: rawFullNameUpdate, first_name, last_name, phone, org_id, role, designation_id, department, is_active } = body;
        const full_name = rawFullNameUpdate || [first_name, last_name].filter(Boolean).join(' ') || undefined;

        // Update auth user if email or password changed
        const authUpdates: Record<string, unknown> = {};
        if (email) authUpdates.email = email;
        if (password) authUpdates.password = password;

        if (Object.keys(authUpdates).length > 0) {
          const { error: authUpdateError } = await adminClient.auth.admin.updateUserById(user_id, authUpdates);
          if (authUpdateError) {
            return new Response(JSON.stringify({ error: authUpdateError.message }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }

        // Update profile
        const profileUpdates: Record<string, unknown> = {};
        if (full_name !== undefined) profileUpdates.full_name = full_name;
        if (first_name !== undefined) profileUpdates.first_name = first_name || null;
        if (last_name !== undefined) profileUpdates.last_name = last_name || null;
        if (phone !== undefined) profileUpdates.phone = phone || null;
        if (org_id !== undefined) profileUpdates.org_id = org_id || null;
        if (designation_id !== undefined) profileUpdates.designation_id = designation_id || null;
        if (department !== undefined) profileUpdates.department = department || null;
        if (is_active !== undefined) profileUpdates.is_active = is_active;

        if (Object.keys(profileUpdates).length > 0) {
          const { error: profileError } = await adminClient
            .from('profiles')
            .update(profileUpdates)
            .eq('id', user_id);

          if (profileError) {
            return new Response(JSON.stringify({ error: profileError.message }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }

        // Update user role
        if (org_id && role) {
          // Upsert the role
          const { error: roleError } = await adminClient
            .from('user_roles')
            .upsert(
              {
                user_id,
                org_id,
                role,
                is_active: is_active !== false,
              },
              { onConflict: 'user_id,org_id' }
            );

          if (roleError) {
            return new Response(JSON.stringify({ error: roleError.message }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }

        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'delete-user': {
        const { user_id, soft_delete } = body;

        if (soft_delete) {
          // Soft delete: deactivate profile and role
          await adminClient
            .from('profiles')
            .update({ is_active: false })
            .eq('id', user_id);

          await adminClient
            .from('user_roles')
            .update({ is_active: false })
            .eq('user_id', user_id);
        } else {
          // Hard delete from auth (cascades to profiles via FK)
          const { error: deleteError } = await adminClient.auth.admin.deleteUser(user_id);
          if (deleteError) {
            return new Response(JSON.stringify({ error: deleteError.message }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }

        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (err) {
    console.error('Edge function error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
