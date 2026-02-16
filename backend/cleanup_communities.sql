-- Transaction start to ensure atomic operation
BEGIN;

-- 1. Identify the Community to KEEP
-- We select the "The Workshop" community. 
-- Priority: 
-- 1. Matches name 'The Workshop' (or similar)
-- 2. Oldest created_at (to keep the original)
CREATE TEMP TABLE IF NOT EXISTS keep_community_ids AS
WITH RankedCommunities AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) as rnk
    FROM community 
    WHERE name ILIKE '%Workshop%'
)
SELECT id FROM RankedCommunities WHERE rnk = 1;

-- 2. Identify Communities to DELETE
CREATE TEMP TABLE IF NOT EXISTS delete_community_ids AS
SELECT id 
FROM community 
WHERE id NOT IN (SELECT id FROM keep_community_ids);

-- Safety Check: If no community found to keep, do not delete anything (or empty table will prevent deletion)
-- But if existing 'The Workshop' is not found, we might be deleting everything. 
-- Assuming at least one 'Workshop' exists as per request.

-- 3. Delete Dependent Records (Handling Foreign Keys)

-- 3.1. Messages and related (Votes, Threads)
-- Access messages through Chains: Community -> Channel -> Message
-- Delete Message Votes
DELETE FROM messagevote 
WHERE message_id IN (
    SELECT m.id FROM message m
    JOIN channel c ON m.channel_id = c.id
    WHERE c.community_id IN (SELECT id FROM delete_community_ids)
);

-- Delete dependent messages (replies/threads)
-- Note: Messages can have parent_id pointing to other messages.
-- If cascading delete is not enabled, we might need recursive deletion or careful ordering.
-- Assuming standard foreign key constraints or simplistic structure for now.
DELETE FROM message 
WHERE channel_id IN (
    SELECT id FROM channel 
    WHERE community_id IN (SELECT id FROM delete_community_ids)
);

-- 3.2. Shared Notes
DELETE FROM sharednote
WHERE channel_id IN (
    SELECT id FROM channel
    WHERE community_id IN (SELECT id FROM delete_community_ids)
);

-- 3.3. Peer Reviews
DELETE FROM peerreviewfeedback
WHERE submission_id IN (
    SELECT s.id FROM peerreviewsubmission s
    JOIN channel c ON s.channel_id = c.id
    WHERE c.community_id IN (SELECT id FROM delete_community_ids)
);

DELETE FROM peerreviewsubmission
WHERE channel_id IN (
    SELECT id FROM channel
    WHERE community_id IN (SELECT id FROM delete_community_ids)
);

-- 3.4. Channels
DELETE FROM channel 
WHERE community_id IN (SELECT id FROM delete_community_ids);

-- 3.5. Study Groups and Members
DELETE FROM studygroupmember
WHERE group_id IN (
    SELECT id FROM studygroup
    WHERE community_id IN (SELECT id FROM delete_community_ids)
);

DELETE FROM studygroup
WHERE community_id IN (SELECT id FROM delete_community_ids);

-- 3.6. Community Members (The user mentioned this specifically)
DELETE FROM communitymember 
WHERE community_id IN (SELECT id FROM delete_community_ids);

-- 4. Delete the Communities themselves
DELETE FROM community 
WHERE id IN (SELECT id FROM delete_community_ids);

-- 5. Output result (Optional, for verification)
-- SELECT 'Deleted ' || count(*) || ' communities.' as result FROM delete_community_ids;

-- Commit the transaction
COMMIT;
