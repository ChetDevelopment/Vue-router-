ALTER TABLE moderation_actions ADD COLUMN report_id VARCHAR(36) DEFAULT NULL AFTER target_comment_id;
ALTER TABLE moderation_actions ADD INDEX idx_mod_actions_report (report_id);

ALTER TABLE reports ADD COLUMN moderator_id VARCHAR(36) DEFAULT NULL AFTER target_excerpt;
ALTER TABLE reports ADD COLUMN actioned_at TIMESTAMP NULL DEFAULT NULL AFTER moderator_id;
ALTER TABLE reports ADD INDEX idx_reports_moderator (moderator_id);
