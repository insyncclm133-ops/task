-- ============================================================
-- Seed Demo Data for a@in-sync.co.in
-- Organization: In-Sync Solutions
-- Password for all demo users: Welcome@123
-- ============================================================

-- Ensure pgcrypto is available
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  v_org_id       UUID := 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';
  v_admin_id     UUID := 'fa1e2d3c-4b5a-4f6e-87d9-0a1b2c3d4e5f';
  v_priya_id     UUID := 'fb2e3d4c-5a6b-4c7d-98e0-1b2c3d4e5f6a';
  v_rahul_id     UUID := 'fc3e4d5c-6b7a-4d8e-a9f1-2c3d4e5f6a7b';
  v_neha_id      UUID := 'fd4e5d6c-7c8b-4e9f-b0a2-3d4e5f6a7b8c';
  v_amit_id      UUID := 'fe5e6d7c-8d9a-4fab-c1b3-4e5f6a7b8c9d';
  v_desg_ceo     UUID := 'de510001-0001-4000-a000-000000000001';
  v_desg_sales_h UUID := 'de510001-0001-4000-a000-000000000002';
  v_desg_sales_e UUID := 'de510001-0001-4000-a000-000000000003';
  v_desg_sup_h   UUID := 'de510001-0001-4000-a000-000000000004';
  v_desg_sup_e   UUID := 'de510001-0001-4000-a000-000000000005';
  v_pwd          TEXT;
BEGIN
  -- Skip if already seeded
  IF EXISTS (SELECT 1 FROM organizations WHERE id = v_org_id) THEN
    RAISE NOTICE 'Demo data already seeded. Skipping.';
    RETURN;
  END IF;

  v_pwd := crypt('Welcome@123', gen_salt('bf'));

  -- ===================== ORGANIZATION =====================
  INSERT INTO organizations (id, name, created_at, updated_at)
  VALUES (v_org_id, 'In-Sync Solutions', NOW(), NOW());

  -- ===================== AUTH USERS =====================
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, recovery_token
  ) VALUES
    (v_admin_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'a@in-sync.co.in', v_pwd, NOW(),
     '{"provider":"email","providers":["email"]}'::jsonb,
     '{"full_name":"Arjun Mehta"}'::jsonb,
     NOW(), NOW(), '', ''),
    (v_priya_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'priya@in-sync.co.in', v_pwd, NOW(),
     '{"provider":"email","providers":["email"]}'::jsonb,
     '{"full_name":"Priya Sharma"}'::jsonb,
     NOW(), NOW(), '', ''),
    (v_rahul_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'rahul@in-sync.co.in', v_pwd, NOW(),
     '{"provider":"email","providers":["email"]}'::jsonb,
     '{"full_name":"Rahul Verma"}'::jsonb,
     NOW(), NOW(), '', ''),
    (v_neha_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'neha@in-sync.co.in', v_pwd, NOW(),
     '{"provider":"email","providers":["email"]}'::jsonb,
     '{"full_name":"Neha Gupta"}'::jsonb,
     NOW(), NOW(), '', ''),
    (v_amit_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'amit@in-sync.co.in', v_pwd, NOW(),
     '{"provider":"email","providers":["email"]}'::jsonb,
     '{"full_name":"Amit Patel"}'::jsonb,
     NOW(), NOW(), '', '');

  -- Auth identities (required by Supabase)
  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES
    (v_admin_id, v_admin_id, jsonb_build_object('sub', v_admin_id::text, 'email', 'a@in-sync.co.in'), 'email', v_admin_id::text, NOW(), NOW(), NOW()),
    (v_priya_id, v_priya_id, jsonb_build_object('sub', v_priya_id::text, 'email', 'priya@in-sync.co.in'), 'email', v_priya_id::text, NOW(), NOW(), NOW()),
    (v_rahul_id, v_rahul_id, jsonb_build_object('sub', v_rahul_id::text, 'email', 'rahul@in-sync.co.in'), 'email', v_rahul_id::text, NOW(), NOW(), NOW()),
    (v_neha_id,  v_neha_id,  jsonb_build_object('sub', v_neha_id::text, 'email', 'neha@in-sync.co.in'), 'email', v_neha_id::text, NOW(), NOW(), NOW()),
    (v_amit_id,  v_amit_id,  jsonb_build_object('sub', v_amit_id::text, 'email', 'amit@in-sync.co.in'), 'email', v_amit_id::text, NOW(), NOW(), NOW());

  -- The handle_new_user trigger auto-creates profiles, so now update them
  -- Wait: trigger fires on INSERT to auth.users, so profiles should already exist

  -- ===================== DESIGNATIONS =====================
  INSERT INTO designations (id, org_id, name, description, role, is_active)
  VALUES
    (v_desg_ceo,     v_org_id, 'CEO',              'Chief Executive Officer',  'admin',           true),
    (v_desg_sales_h, v_org_id, 'Sales Head',       'Head of Sales',            'sales_manager',   true),
    (v_desg_sales_e, v_org_id, 'Sales Executive',  'Sales Team Member',        'sales_agent',     true),
    (v_desg_sup_h,   v_org_id, 'Support Head',     'Head of Support',          'support_manager', true),
    (v_desg_sup_e,   v_org_id, 'Support Executive','Support Team Member',      'support_agent',   true);

  -- Reporting hierarchy
  INSERT INTO reporting_hierarchy (org_id, designation_id, reports_to_designation_id)
  VALUES
    (v_org_id, v_desg_sales_h, v_desg_ceo),
    (v_org_id, v_desg_sales_e, v_desg_sales_h),
    (v_org_id, v_desg_sup_h,   v_desg_ceo),
    (v_org_id, v_desg_sup_e,   v_desg_sup_h);

  -- ===================== UPDATE PROFILES =====================
  UPDATE profiles SET
    org_id = v_org_id, first_name = 'Arjun', last_name = 'Mehta',
    full_name = 'Arjun Mehta', designation_id = v_desg_ceo,
    is_active = true, onboarding_completed = true
  WHERE id = v_admin_id;

  UPDATE profiles SET
    org_id = v_org_id, first_name = 'Priya', last_name = 'Sharma',
    full_name = 'Priya Sharma', designation_id = v_desg_sales_h,
    is_active = true, onboarding_completed = true
  WHERE id = v_priya_id;

  UPDATE profiles SET
    org_id = v_org_id, first_name = 'Rahul', last_name = 'Verma',
    full_name = 'Rahul Verma', designation_id = v_desg_sales_e,
    is_active = true, onboarding_completed = true
  WHERE id = v_rahul_id;

  UPDATE profiles SET
    org_id = v_org_id, first_name = 'Neha', last_name = 'Gupta',
    full_name = 'Neha Gupta', designation_id = v_desg_sup_h,
    is_active = true, onboarding_completed = true
  WHERE id = v_neha_id;

  UPDATE profiles SET
    org_id = v_org_id, first_name = 'Amit', last_name = 'Patel',
    full_name = 'Amit Patel', designation_id = v_desg_sup_e,
    is_active = true, onboarding_completed = true
  WHERE id = v_amit_id;

  -- ===================== USER ROLES =====================
  INSERT INTO user_roles (user_id, org_id, role, is_active)
  VALUES
    (v_admin_id, v_org_id, 'admin',           true),
    (v_priya_id, v_org_id, 'sales_manager',   true),
    (v_rahul_id, v_org_id, 'sales_agent',     true),
    (v_neha_id,  v_org_id, 'support_manager', true),
    (v_amit_id,  v_org_id, 'support_agent',   true);

  -- ===================== TASKS =====================
  -- Mix of statuses, priorities, due dates to create interesting dashboard data

  -- === COMPLETED TASKS (8) — drives completion rate ===
  INSERT INTO tasks (task_name, description, assigned_to, assigned_by, due_date, start_date, status, priority, tags, estimated_hours, actual_hours, completion_percentage, completed_at, org_id, created_at)
  VALUES
    ('Set up CRM integration',          'Connect Salesforce CRM with internal tools',           v_priya_id, v_admin_id, NOW() - INTERVAL '5 days',  NOW() - INTERVAL '15 days', 'completed', 'high',   ARRAY['crm','integration'],     16, 14, 100, NOW() - INTERVAL '6 days',  v_org_id, NOW() - INTERVAL '20 days'),
    ('Design Q1 sales report template', 'Create reusable report template for quarterly review', v_priya_id, v_admin_id, NOW() - INTERVAL '10 days', NOW() - INTERVAL '18 days', 'completed', 'medium', ARRAY['reports','sales'],       8,  7,  100, NOW() - INTERVAL '11 days', v_org_id, NOW() - INTERVAL '21 days'),
    ('Client onboarding — Tata Motors', 'Complete onboarding checklist for Tata Motors',        v_rahul_id, v_priya_id, NOW() - INTERVAL '3 days',  NOW() - INTERVAL '10 days', 'completed', 'high',   ARRAY['onboarding','client'],   12, 10, 100, NOW() - INTERVAL '4 days',  v_org_id, NOW() - INTERVAL '14 days'),
    ('Update knowledge base articles',  'Refresh support KB with latest product changes',       v_neha_id,  v_admin_id, NOW() - INTERVAL '7 days',  NOW() - INTERVAL '14 days', 'completed', 'medium', ARRAY['docs','support'],        10, 9,  100, NOW() - INTERVAL '8 days',  v_org_id, NOW() - INTERVAL '18 days'),
    ('Fix ticket auto-assignment bug',  'Auto-assignment not working for priority tickets',     v_amit_id,  v_neha_id,  NOW() - INTERVAL '2 days',  NOW() - INTERVAL '5 days',  'completed', 'urgent', ARRAY['bug','automation'],      4,  3,  100, NOW() - INTERVAL '3 days',  v_org_id, NOW() - INTERVAL '7 days'),
    ('Prepare investor deck',           'Updated pitch deck with Q4 numbers',                   v_admin_id, v_admin_id, NOW() - INTERVAL '12 days', NOW() - INTERVAL '20 days', 'completed', 'high',   ARRAY['strategy','investors'],  20, 18, 100, NOW() - INTERVAL '13 days', v_org_id, NOW() - INTERVAL '25 days'),
    ('Configure email templates',       'Set up transactional email templates in SendGrid',     v_amit_id,  v_neha_id,  NOW() - INTERVAL '8 days',  NOW() - INTERVAL '12 days', 'completed', 'low',    ARRAY['email','config'],        6,  5,  100, NOW() - INTERVAL '9 days',  v_org_id, NOW() - INTERVAL '15 days'),
    ('Sales team training — new CRM',   'Train sales team on new CRM features',                 v_priya_id, v_admin_id, NOW() - INTERVAL '1 day',   NOW() - INTERVAL '7 days',  'completed', 'medium', ARRAY['training','sales'],      8,  8,  100, NOW() - INTERVAL '2 days',  v_org_id, NOW() - INTERVAL '10 days');

  -- === IN PROGRESS TASKS (6) — active work ===
  INSERT INTO tasks (task_name, description, assigned_to, assigned_by, due_date, start_date, status, priority, tags, estimated_hours, completion_percentage, org_id, created_at)
  VALUES
    ('Build partner referral dashboard',   'Dashboard to track partner referral commissions',     v_rahul_id, v_priya_id, NOW() + INTERVAL '5 days',  NOW() - INTERVAL '3 days', 'in_progress', 'high',   ARRAY['dashboard','partners'],   24, 45, v_org_id, NOW() - INTERVAL '5 days'),
    ('Migrate support tickets to new DB',  'Move 50k+ tickets from legacy MySQL to PostgreSQL',  v_neha_id,  v_admin_id, NOW() + INTERVAL '10 days', NOW() - INTERVAL '5 days', 'in_progress', 'high',   ARRAY['migration','database'],   40, 30, v_org_id, NOW() - INTERVAL '8 days'),
    ('Implement SLA monitoring alerts',    'Real-time alerts when SLA breach is imminent',        v_amit_id,  v_neha_id,  NOW() + INTERVAL '7 days',  NOW() - INTERVAL '2 days', 'in_progress', 'urgent', ARRAY['sla','monitoring'],       16, 20, v_org_id, NOW() - INTERVAL '4 days'),
    ('Revamp pricing page',                'New pricing page with comparison table and FAQ',      v_admin_id, v_admin_id, NOW() + INTERVAL '3 days',  NOW() - INTERVAL '4 days', 'in_progress', 'medium', ARRAY['marketing','website'],    12, 60, v_org_id, NOW() - INTERVAL '6 days'),
    ('Lead scoring model v2',              'Improve lead scoring with engagement data signals',   v_priya_id, v_admin_id, NOW() + INTERVAL '14 days', NOW() - INTERVAL '1 day',  'in_progress', 'medium', ARRAY['analytics','sales'],      20, 15, v_org_id, NOW() - INTERVAL '3 days'),
    ('Customer satisfaction survey setup', 'Configure post-resolution CSAT survey flow',         v_neha_id,  v_admin_id, NOW() + INTERVAL '4 days',  NOW() - INTERVAL '2 days', 'in_progress', 'low',    ARRAY['survey','customer'],      8,  40, v_org_id, NOW() - INTERVAL '3 days');

  -- === PENDING TASKS (7) — not yet started ===
  INSERT INTO tasks (task_name, description, assigned_to, assigned_by, due_date, status, priority, tags, estimated_hours, completion_percentage, org_id, created_at)
  VALUES
    ('API rate limiting implementation',  'Implement token-bucket rate limiter for public APIs', v_amit_id,  v_neha_id,  NOW() + INTERVAL '12 days', 'pending', 'high',   ARRAY['api','security'],       16, 0, v_org_id, NOW() - INTERVAL '1 day'),
    ('Quarterly business review prep',    'Prepare QBR deck and data for board meeting',         v_admin_id, v_admin_id, NOW() + INTERVAL '20 days', 'pending', 'medium', ARRAY['strategy','review'],    12, 0, v_org_id, NOW() - INTERVAL '2 days'),
    ('Automate invoice generation',       'Auto-generate invoices from closed deals',            v_rahul_id, v_priya_id, NOW() + INTERVAL '15 days', 'pending', 'medium', ARRAY['automation','billing'], 20, 0, v_org_id, NOW() - INTERVAL '1 day'),
    ('Competitive analysis — March',      'Update competitive landscape for Q1 strategy',        v_priya_id, v_admin_id, NOW() + INTERVAL '8 days',  'pending', 'low',    ARRAY['research','strategy'],  10, 0, v_org_id, NOW() - INTERVAL '3 days'),
    ('Set up staging environment',        'Mirror production env for testing',                   v_amit_id,  v_admin_id, NOW() + INTERVAL '6 days',  'pending', 'high',   ARRAY['devops','infra'],       8,  0, v_org_id, NOW() - INTERVAL '2 days'),
    ('Onboard new support agents',        'Training plan and access for 3 new hires',            v_neha_id,  v_admin_id, NOW() + INTERVAL '18 days', 'pending', 'medium', ARRAY['hr','training'],        14, 0, v_org_id, NOW()),
    ('Draft partnership agreement',       'Legal review template for channel partnerships',      v_admin_id, v_admin_id, NOW() + INTERVAL '25 days', 'pending', 'low',    ARRAY['legal','partnerships'], 6,  0, v_org_id, NOW());

  -- === OVERDUE TASKS (4) — triggers AI warnings ===
  INSERT INTO tasks (task_name, description, assigned_to, assigned_by, due_date, start_date, status, priority, tags, estimated_hours, completion_percentage, org_id, created_at)
  VALUES
    ('Fix payment gateway timeout',     'Razorpay gateway timing out on high-value transactions', v_amit_id,  v_neha_id,  NOW() - INTERVAL '3 days',  NOW() - INTERVAL '7 days',  'in_progress', 'urgent', ARRAY['bug','payments'],      8,  50, v_org_id, NOW() - INTERVAL '10 days'),
    ('Submit compliance audit report',  'GDPR compliance audit due for EU clients',               v_admin_id, v_admin_id, NOW() - INTERVAL '5 days',  NOW() - INTERVAL '12 days', 'in_progress', 'high',   ARRAY['compliance','legal'],  16, 70, v_org_id, NOW() - INTERVAL '15 days'),
    ('Resolve escalated ticket #4782',  'Enterprise client data export failing — escalated',      v_neha_id,  v_neha_id,  NOW() - INTERVAL '2 days',  NULL,                        'pending',     'urgent', ARRAY['escalation','support'],4,  0,  v_org_id, NOW() - INTERVAL '4 days'),
    ('Follow up with Infosys lead',     'Decision maker meeting follow-up overdue',               v_rahul_id, v_priya_id, NOW() - INTERVAL '4 days',  NULL,                        'pending',     'high',   ARRAY['sales','follow-up'],   2,  0,  v_org_id, NOW() - INTERVAL '8 days'));

  -- === CANCELLED TASKS (2) ===
  INSERT INTO tasks (task_name, description, assigned_to, assigned_by, due_date, status, priority, tags, estimated_hours, completion_percentage, org_id, created_at)
  VALUES
    ('Legacy dashboard deprecation', 'Remove old dashboard — superseded by new Command Center', v_amit_id,  v_admin_id, NOW() - INTERVAL '10 days', 'cancelled', 'low',    ARRAY['cleanup','legacy'],  8,  0, v_org_id, NOW() - INTERVAL '20 days'),
    ('Print brochure design',        'Physical brochures cancelled — going fully digital',      v_priya_id, v_admin_id, NOW() - INTERVAL '15 days', 'cancelled', 'low',    ARRAY['marketing','print'], 12, 0, v_org_id, NOW() - INTERVAL '25 days'));

  -- ===================== TASK COMMENTS =====================
  -- Add some comments to create activity
  INSERT INTO task_comments (task_id, user_id, comment, comment_type, org_id, created_at)
  SELECT t.id, v_admin_id, 'Great progress on this. Let''s aim to close it by EOD.', 'comment', v_org_id, NOW() - INTERVAL '2 days'
  FROM tasks t WHERE t.task_name = 'Build partner referral dashboard' AND t.org_id = v_org_id
  LIMIT 1;

  INSERT INTO task_comments (task_id, user_id, comment, comment_type, org_id, created_at)
  SELECT t.id, v_neha_id, 'Migration script tested on 10k records. Moving to full batch now.', 'comment', v_org_id, NOW() - INTERVAL '1 day'
  FROM tasks t WHERE t.task_name = 'Migrate support tickets to new DB' AND t.org_id = v_org_id
  LIMIT 1;

  INSERT INTO task_comments (task_id, user_id, comment, comment_type, org_id, created_at)
  SELECT t.id, v_amit_id, 'Root cause identified — connection pool exhaustion under load. Fix in progress.', 'comment', v_org_id, NOW() - INTERVAL '1 day'
  FROM tasks t WHERE t.task_name = 'Fix payment gateway timeout' AND t.org_id = v_org_id
  LIMIT 1;

  INSERT INTO task_comments (task_id, user_id, comment, comment_type, org_id, created_at)
  SELECT t.id, v_admin_id, 'This is blocking the EU expansion. Please prioritize.', 'comment', v_org_id, NOW() - INTERVAL '3 days'
  FROM tasks t WHERE t.task_name = 'Submit compliance audit report' AND t.org_id = v_org_id
  LIMIT 1;

  INSERT INTO task_comments (task_id, user_id, comment, comment_type, org_id, created_at)
  SELECT t.id, v_priya_id, 'Rahul, the Infosys VP is expecting a call. Please schedule ASAP.', 'comment', v_org_id, NOW() - INTERVAL '1 day'
  FROM tasks t WHERE t.task_name = 'Follow up with Infosys lead' AND t.org_id = v_org_id
  LIMIT 1;

  INSERT INTO task_comments (task_id, user_id, comment, comment_type, org_id, created_at)
  SELECT t.id, v_rahul_id, 'Apologies — was tied up with the Tata onboarding. Will call today.', 'comment', v_org_id, NOW() - INTERVAL '12 hours'
  FROM tasks t WHERE t.task_name = 'Follow up with Infosys lead' AND t.org_id = v_org_id
  LIMIT 1;

  RAISE NOTICE 'Demo data seeded successfully for In-Sync Solutions!';
END $$;
