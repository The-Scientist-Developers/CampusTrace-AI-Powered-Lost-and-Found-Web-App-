-- Fix RLS policy to allow claimants to update their own handover codes
-- This allows regenerating handover codes

-- Drop the existing UPDATE policy
DROP POLICY IF EXISTS "Item owners can verify handovers" ON public.handovers;

-- Create new UPDATE policy that allows both claimants and item owners
CREATE POLICY "Claimants and item owners can update handovers"
ON public.handovers
FOR UPDATE
USING (
    -- Allow if user is the claimant (for regenerating codes)
    auth.uid() = claimant_id
    OR
    -- Allow if user is the item owner (for verifying handovers)
    EXISTS (
        SELECT 1 FROM public.items 
        WHERE items.id = handovers.item_id 
        AND items.user_id = auth.uid()
    )
);

-- Verify the policy was created
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'handovers' AND policyname = 'Claimants and item owners can update handovers';
