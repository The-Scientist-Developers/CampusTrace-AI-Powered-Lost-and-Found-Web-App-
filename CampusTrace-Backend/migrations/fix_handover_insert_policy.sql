-- Fix INSERT policy to accept both 'approved' and 'accepted' claim statuses
-- Some claims use 'accepted' instead of 'approved'

-- Drop the existing INSERT policy
DROP POLICY IF EXISTS "Claimants can create handovers" ON public.handovers;

-- Create new INSERT policy that accepts both statuses
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
        AND status IN ('approved', 'accepted')  -- Accept both statuses
    )
);

-- Verify the policy was created
SELECT policyname, cmd, with_check
FROM pg_policies
WHERE tablename = 'handovers' AND cmd = 'INSERT';
