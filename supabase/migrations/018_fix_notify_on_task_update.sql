-- ============================================================
-- Fix notify_on_task_update: cast task_status and task_priority
-- enums to TEXT before passing to REPLACE() and string concat.
-- PostgreSQL has no REPLACE(task_status, text, text) overload.
-- ============================================================

CREATE OR REPLACE FUNCTION notify_on_task_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Status changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Notify the assignee
    INSERT INTO notifications (user_id, notification_type, title, message, task_id, org_id)
    VALUES (
      NEW.assigned_to,
      'status_change',
      NEW.task_name || ' — status updated',
      'Status changed from ' || REPLACE(OLD.status::TEXT, '_', ' ') || ' to ' || REPLACE(NEW.status::TEXT, '_', ' '),
      NEW.id,
      NEW.org_id
    );

    -- Notify the assigner (if different from assignee)
    IF NEW.assigned_by IS DISTINCT FROM NEW.assigned_to THEN
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

  -- Reassigned to a different user
  IF OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN
    INSERT INTO notifications (user_id, notification_type, title, message, task_id, org_id)
    VALUES (
      NEW.assigned_to,
      'task_assigned',
      'New task assigned: ' || NEW.task_name,
      'You have been assigned this ' || NEW.priority::TEXT || ' priority task. Due: ' || TO_CHAR(NEW.due_date::timestamp, 'DD Mon YYYY'),
      NEW.id,
      NEW.org_id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
