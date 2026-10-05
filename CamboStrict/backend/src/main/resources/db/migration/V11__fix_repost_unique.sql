-- Fix repost unique key: allow multiple users to repost the same post
-- The old unique key (source_post_id, target_post_id, type) prevents this
-- New unique key: (type, user_id, target_post_id) for reposts
-- For duet/stitch: (type, source_post_id, target_post_id) still works since source_post_id is unique per creation

ALTER TABLE post_relationships DROP INDEX uk_post_relationship;
ALTER TABLE post_relationships ADD UNIQUE INDEX uk_post_rel_unique (type, source_post_id, target_post_id, user_id(36));
