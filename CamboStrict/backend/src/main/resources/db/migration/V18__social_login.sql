-- Social login support: store provider:social_id for Google/Facebook/Apple

ALTER TABLE users ADD COLUMN social_id VARCHAR(255) DEFAULT NULL AFTER email_verified;
CREATE INDEX idx_users_social_id ON users(social_id);
