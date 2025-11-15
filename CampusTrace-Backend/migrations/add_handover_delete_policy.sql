-- Add DELETE policy to allow claimants to delete their own unverified handovers
-- This enables the regenerate functionality

-- Drop the existing DELETE policy that blocks all deletes
DROP POLICY IF EXISTS "No one can delete handovers" ON public.handovers;

-- Create new DELETE policy that allows claimants to delete their own unverified handovers
CREATE POLICY "Claimants can delete their own unverified handovers"
ON public.handovers
FOR DELETE
USING (
    -- Allow if user is the claimant and handover is not yet verified
    auth.uid() = claimant_id AND verified = false
);

-- Verify the policy was created
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'handovers' AND cmd = 'DELETE';
