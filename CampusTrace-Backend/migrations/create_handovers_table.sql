-- Create handovers table for secure item handover with verification codes
-- Run this in your Supabase SQL editor

-- Create handovers table
CREATE TABLE IF NOT EXISTS public.handovers (
    id BIGSERIAL PRIMARY KEY,
    item_id BIGINT NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
    code VARCHAR(4) NOT NULL,
    claimant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_handovers_item_id ON public.handovers(item_id);
CREATE INDEX IF NOT EXISTS idx_handovers_claimant_id ON public.handovers(claimant_id);
CREATE INDEX IF NOT EXISTS idx_handovers_code ON public.handovers(code);
CREATE INDEX IF NOT EXISTS idx_handovers_verified ON public.handovers(verified);

-- Add comments for documentation
COMMENT ON TABLE public.handovers IS 'Stores handover verification codes for secure item returns';
COMMENT ON COLUMN public.handovers.code IS '4-digit verification code shown to claimant';
COMMENT ON COLUMN public.handovers.expires_at IS 'When the handover code expires (24 hours from creation)';
COMMENT ON COLUMN public.handovers.verified IS 'Whether the handover has been completed';
COMMENT ON COLUMN public.handovers.verified_at IS 'When the handover was verified by the finder';
COMMENT ON COLUMN public.handovers.verified_by IS 'User ID of the finder who verified the code';

-- Enable Row Level Security
ALTER TABLE public.handovers ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Policy: Users can view handovers for items they're involved with (as claimant or item owner)
CREATE POLICY "Users can view their own handovers"
ON public.handovers
FOR SELECT
USING (
    auth.uid() = claimant_id 
    OR 
    auth.uid() IN (
        SELECT user_id FROM public.items WHERE id = handovers.item_id
    )
);

-- Policy: Only claimants can create handovers for their claims
CREATE POLICY "Claimants can create handovers"
ON public.handovers
FOR INSERT
WITH CHECK (
    auth.uid() = claimant_id
    AND
    EXISTS (
        SELECT 1 FROM public.claims 
        WHERE item_id = handovers.item_id 
        AND claimant_id = auth.uid() 
        AND status = 'approved'
    )
);

-- Policy: Only item owners can update handovers (to verify them)
CREATE POLICY "Item owners can verify handovers"
ON public.handovers
FOR UPDATE
USING (
    auth.uid() IN (
        SELECT user_id FROM public.items WHERE id = handovers.item_id
    )
);

-- Policy: No one can delete handovers (keep for audit trail)
CREATE POLICY "No one can delete handovers"
ON public.handovers
FOR DELETE
USING (false);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_handovers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handovers_updated_at
    BEFORE UPDATE ON public.handovers
    FOR EACH ROW
    EXECUTE FUNCTION update_handovers_updated_at();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.handovers TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.handovers_id_seq TO authenticated;
