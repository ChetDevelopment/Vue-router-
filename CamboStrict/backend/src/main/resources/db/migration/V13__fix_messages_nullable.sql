-- Fix messages content to allow NULL (DMs can share posts without text)
ALTER TABLE messages MODIFY content TEXT NULL;
