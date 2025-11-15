-- Create user_badges table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_badges (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    badge_type VARCHAR(50) NOT NULL,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, badge_type)
);

-- Enable RLS on user_badges
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view all badges
CREATE POLICY "Users can view all badges"
ON user_badges FOR SELECT
TO authenticated
USING (true);

-- Policy: System can insert badges (via service role)
CREATE POLICY "System can insert badges"
ON user_badges FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_type ON user_badges(badge_type);

COMMENT ON TABLE user_badges IS 'Stores badges earned by users for various achievements';
COMMENT ON COLUMN user_badges.badge_type IS 'Type of badge: helper, super_finder, etc.';
