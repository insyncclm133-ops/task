-- ============================================================
-- Fix duplicate notification on task reassignment.
-- notify_on_task_assignment already handles the 'task_assigned'
-- notification to the new assignee on INSERT and reassignment.
-- Remove the duplicate reassignment block from notify_on_task_update
-- so the assignee never receives two emails/WhatsApps for the same event.
-- ============================================================

CREATE OR REPLACE FUNCTION notify_on_task_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Status changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Notify the assignee (skip if they triggered the change)
    IF NEW.assigned_to IS DISTINCT FROM auth.uid() THEN
      INSERT INTO notifications (user_id, notification_type, title, message, task_id, org_id)
      VALUES (
        NEW.assigned_to,
        'status_change',
        NEW.task_name || ' — status updated',
        'Status changed from ' || REPLACE(OLD.status::TEXT, '_', ' ') || ' to ' || REPLACE(NEW.status::TEXT, '_', ' '),
        NEW.id,
        NEW.org_id
      );
    END IF;

    -- Notify the assigner if different from assignee and didn't trigger the change
    IF NEW.assigned_by IS DISTINCT FROM NEW.assigned_to
       AND NEW.assigned_by IS DISTINCT FROM auth.uid() THEN
      INSERT INTO notifications (user_id, notification_type, title, message, task_id, org_id)
      VALUES (
        NEW.assigned_by,
        'status_change',
        NEW.task_name || ' — status updated',
        COALESCE((SELECT full_name FROM profiles WHERE id = NEW.assigned_to), 'A team member')
          || ' changed status from ' || REPLACE(OLD.status::TEXT, '_', ' ') || ' to ' || REPLACE(NEW.status::TEXT, '_', ' '),
        NEW.id,
        NEW.org_id
      );
    END IF;
  END IF;

  -- Priority escalated to urgent or high
  IF OLD.priority IS DISTINCT FROM NEW.priority
     AND NEW.priority IN ('urgent', 'high')
     AND (OLD.priority IS NULL OR OLD.priority NOT IN ('urgent', 'high'))
  THEN
    IF NEW.assigned_to IS DISTINCT FROM auth.uid() THEN
      INSERT INTO notifications (user_id, notification_type, title, message, task_id, org_id)
      VALUES (
        NEW.assigned_to,
        'priority_change',
        NEW.task_name || ' — priority escalated',
        'Priority changed from ' || COALESCE(OLD.priority::TEXT, 'none') || ' to ' || NEW.priority::TEXT || '. Immediate attention required.',
        NEW.id,
        NEW.org_id
      );
    END IF;
  END IF;

  -- NOTE: Reassignment notifications are handled exclusively by
  -- trg_tasks_notify_assignment → notify_on_task_assignment().
  -- Do NOT add a reassignment block here to avoid duplicate notifications.

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
