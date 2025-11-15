-- Add returns_count to profiles table for leaderboard
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS returns_count INTEGER DEFAULT 0;

-- Add resolved_at to claims table
ALTER TABLE claims 
ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster leaderboard queries
CREATE INDEX IF NOT EXISTS idx_profiles_returns_count ON profiles(returns_count DESC);

-- Update existing claims status enum if needed (add 'resolved' status)
-- Note: If your claims table uses an enum for status, you may need to add 'resolved' to it
-- ALTER TYPE claim_status ADD VALUE IF NOT EXISTS 'resolved';

COMMENT ON COLUMN profiles.returns_count IS 'Number of items successfully returned to owners (for leaderboard)';
COMMENT ON COLUMN claims.resolved_at IS 'Timestamp when the claim was resolved/completed via handover';
