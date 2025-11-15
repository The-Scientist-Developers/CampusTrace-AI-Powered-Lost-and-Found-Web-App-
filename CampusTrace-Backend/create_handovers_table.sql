-- Create handovers table for secure item handover with verification codes
CREATE TABLE IF NOT EXISTS public.handovers (
    id BIGSERIAL PRIMARY KEY,
    item_id BIGINT NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
    code VARCHAR(4) NOT NULL,
    claimant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_handovers_item_id ON public.handovers(item_id);
CREATE INDEX IF NOT EXISTS idx_handovers_claimant_id ON public.handovers(claimant_id);
CREATE INDEX IF NOT EXISTS idx_handovers_verified ON public.handovers(verified);
CREATE INDEX IF NOT EXISTS idx_handovers_code ON public.handovers(code);

-- Enable Row Level Security
ALTER TABLE public.handovers ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own handovers (as claimant or verifier)
CREATE POLICY "Users can view their own handovers"
    ON public.handovers
    FOR SELECT
    USING (
        auth.uid() = claimant_id 
        OR auth.uid() = verified_by
        OR auth.uid() IN (
            SELECT user_id FROM public.items WHERE id = handovers.item_id
        )
    );

-- Policy: Claimants can create handovers for their approved claims
CREATE POLICY "Claimants can create handovers"
    ON public.handovers
    FOR INSERT
    WITH CHECK (
        auth.uid() = claimant_id
        AND EXISTS (
            SELECT 1 FROM public.claims 
            WHERE item_id = handovers.item_id 
            AND claimant_id = auth.uid() 
            AND status = 'approved'
        )
    );

-- Policy: Item owners and claimants can update handovers
CREATE POLICY "Users can update handovers"
    ON public.handovers
    FOR UPDATE
    USING (
        auth.uid() = claimant_id
        OR auth.uid() IN (
            SELECT user_id FROM public.items WHERE id = handovers.item_id
        )
    );

-- Add trigger to update updated_at timestamp
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

-- Grant necessary permissions
GRANT ALL ON public.handovers TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE handovers_id_seq TO authenticated;
