-- ============================================================================
-- 003_multi_tenancy.sql
-- Add org_id to all core tables for full multi-tenant isolation
-- ============================================================================

-- ============================================================================
-- 1. ADD org_id TO CORE TABLES
-- ============================================================================

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);
ALTER TABLE task_comments ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);
ALTER TABLE task_attachments ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);
ALTER TABLE task_watchers ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);
ALTER TABLE teams ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);

-- ============================================================================
-- 2. CREATE HELPER FUNCTION to get user's org_id
-- ============================================================================

CREATE OR REPLACE FUNCTION auth_user_org_id()
RETURNS UUID AS $$
    SELECT org_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================================================
-- 3. INDEXES for org_id columns
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_tasks_org_id ON tasks(org_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_org_id ON task_comments(org_id);
CREATE INDEX IF NOT EXISTS idx_task_attachments_org_id ON task_attachments(org_id);
CREATE INDEX IF NOT EXISTS idx_notifications_org_id ON notifications(org_id);
CREATE INDEX IF NOT EXISTS idx_teams_org_id ON teams(org_id);

-- ============================================================================
-- 4. DROP OLD RLS POLICIES (tasks + related tables)
-- ============================================================================

-- tasks
DROP POLICY IF EXISTS "Users can view tasks assigned to or created by them" ON tasks;
DROP POLICY IF EXISTS "Authenticated users can create tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update tasks assigned to or created by them" ON tasks;
DROP POLICY IF EXISTS "Task creators can delete tasks" ON tasks;

-- task_attachments
DROP POLICY IF EXISTS "Users on the task can view attachments" ON task_attachments;
DROP POLICY IF EXISTS "Users on the task can upload attachments" ON task_attachments;
DROP POLICY IF EXISTS "Attachment uploaders can delete their attachments" ON task_attachments;

-- task_comments
DROP POLICY IF EXISTS "Users on the task can view comments" ON task_comments;
DROP POLICY IF EXISTS "Users on the task can add comments" ON task_comments;

-- task_watchers
DROP POLICY IF EXISTS "Users on the task can view watchers" ON task_watchers;

-- notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;

-- teams
DROP POLICY IF EXISTS "Authenticated users can view all teams" ON teams;
DROP POLICY IF EXISTS "Authenticated users can create teams" ON teams;

-- team_members
DROP POLICY IF EXISTS "Authenticated users can view team members" ON team_members;
DROP POLICY IF EXISTS "Team creators can manage members" ON team_members;

-- profiles (update to add org scoping for non-admin reads)
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- ============================================================================
-- 5. NEW ORG-SCOPED RLS POLICIES
-- ============================================================================

-- ---- profiles ----
CREATE POLICY "Users can view profiles in their org"
    ON profiles FOR SELECT
    TO authenticated
    USING (
        id = auth.uid()
        OR org_id = auth_user_org_id()
        OR org_id IS NULL
    );

CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Allow admins to update profiles in their org (needed for user management)
CREATE POLICY "Admins can update profiles in their org"
    ON profiles FOR UPDATE
    TO authenticated
    USING (
        org_id = auth_user_org_id()
        AND EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_roles.user_id = auth.uid()
              AND user_roles.org_id = auth_user_org_id()
              AND user_roles.role IN ('super_admin', 'admin')
              AND user_roles.is_active = true
        )
    )
    WITH CHECK (
        org_id = auth_user_org_id()
    );

-- ---- tasks ----
CREATE POLICY "Users can view tasks in their org"
    ON tasks FOR SELECT
    TO authenticated
    USING (org_id = auth_user_org_id());

CREATE POLICY "Users can create tasks in their org"
    ON tasks FOR INSERT
    TO authenticated
    WITH CHECK (
        org_id = auth_user_org_id()
        AND assigned_by = auth.uid()
    );

CREATE POLICY "Users can update tasks in their org"
    ON tasks FOR UPDATE
    TO authenticated
    USING (
        org_id = auth_user_org_id()
        AND (assigned_to = auth.uid() OR assigned_by = auth.uid())
    )
    WITH CHECK (org_id = auth_user_org_id());

CREATE POLICY "Task creators can delete tasks in their org"
    ON tasks FOR DELETE
    TO authenticated
    USING (
        org_id = auth_user_org_id()
        AND assigned_by = auth.uid()
    );

-- ---- task_attachments ----
CREATE POLICY "Users can view attachments in their org"
    ON task_attachments FOR SELECT
    TO authenticated
    USING (org_id = auth_user_org_id());

CREATE POLICY "Users can upload attachments in their org"
    ON task_attachments FOR INSERT
    TO authenticated
    WITH CHECK (org_id = auth_user_org_id());

CREATE POLICY "Users can delete their attachments in their org"
    ON task_attachments FOR DELETE
    TO authenticated
    USING (
        org_id = auth_user_org_id()
        AND uploaded_by = auth.uid()
    );

-- ---- task_comments ----
CREATE POLICY "Users can view comments in their org"
    ON task_comments FOR SELECT
    TO authenticated
    USING (org_id = auth_user_org_id());

CREATE POLICY "Users can add comments in their org"
    ON task_comments FOR INSERT
    TO authenticated
    WITH CHECK (
        org_id = auth_user_org_id()
        AND user_id = auth.uid()
    );

-- ---- task_watchers ----
CREATE POLICY "Users can view watchers in their org"
    ON task_watchers FOR SELECT
    TO authenticated
    USING (org_id = auth_user_org_id());

CREATE POLICY "Users can manage watchers in their org"
    ON task_watchers FOR INSERT
    TO authenticated
    WITH CHECK (org_id = auth_user_org_id());

CREATE POLICY "Users can remove watchers in their org"
    ON task_watchers FOR DELETE
    TO authenticated
    USING (org_id = auth_user_org_id());

-- ---- notifications ----
CREATE POLICY "Users can view their notifications in their org"
    ON notifications FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid()
        AND (org_id = auth_user_org_id() OR org_id IS NULL)
    );

CREATE POLICY "Users can update their notifications"
    ON notifications FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "System can insert notifications"
    ON notifications FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- ---- teams ----
CREATE POLICY "Users can view teams in their org"
    ON teams FOR SELECT
    TO authenticated
    USING (org_id = auth_user_org_id());

CREATE POLICY "Users can create teams in their org"
    ON teams FOR INSERT
    TO authenticated
    WITH CHECK (
        org_id = auth_user_org_id()
        AND created_by = auth.uid()
    );

-- ---- team_members ----
CREATE POLICY "Users can view team members in their org"
    ON team_members FOR SELECT
    TO authenticated
    USING (org_id = auth_user_org_id());

CREATE POLICY "Team creators can manage members in their org"
    ON team_members FOR INSERT
    TO authenticated
    WITH CHECK (
        org_id = auth_user_org_id()
        AND EXISTS (
            SELECT 1 FROM teams
            WHERE teams.id = team_id
              AND teams.created_by = auth.uid()
        )
    );

-- ============================================================================
-- 6. UPDATE TRIGGER FUNCTIONS for org_id propagation
-- ============================================================================

-- Update notify_on_task_assignment to include org_id
CREATE OR REPLACE FUNCTION notify_on_task_assignment()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.assigned_to IS DISTINCT FROM NEW.assigned_to) THEN
        INSERT INTO notifications (user_id, notification_type, title, message, task_id, org_id)
        VALUES (
            NEW.assigned_to,
            'task_assignment',
            'New Task Assigned',
            'You have been assigned task ' || NEW.task_number || ': ' || NEW.task_name,
            NEW.id,
            NEW.org_id
        );

        INSERT INTO task_watchers (task_id, user_id, org_id)
        VALUES (NEW.id, NEW.assigned_to, NEW.org_id)
        ON CONFLICT (task_id, user_id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update log_status_change to include org_id
CREATE OR REPLACE FUNCTION log_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO task_comments (task_id, user_id, comment, comment_type, metadata, org_id)
        VALUES (
            NEW.id,
            NEW.assigned_to,
            'Status changed from ' || OLD.status || ' to ' || NEW.status,
            'system',
            jsonb_build_object('old_status', OLD.status::TEXT, 'new_status', NEW.status::TEXT),
            NEW.org_id
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 7. RATING COLUMN for task closure
-- ============================================================================

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS closure_rating INT CHECK (closure_rating >= 1 AND closure_rating <= 5);
