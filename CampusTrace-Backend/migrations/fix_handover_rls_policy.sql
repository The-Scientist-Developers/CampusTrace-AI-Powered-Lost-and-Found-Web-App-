-- Fix RLS policy for handovers table to allow item owners to see handover records
-- This fixes the "No active handover found for this item" error

-- Drop the existing SELECT policy
DROP POLICY IF EXISTS "Users can view their own handovers" ON public.handovers;

-- Create a new, more permissive SELECT policy
-- This allows both claimants AND item owners to view handover records
CREATE POLICY "Users can view handovers for their items"
ON public.handovers
FOR SELECT
USING (
    -- Allow if user is the claimant
    auth.uid() = claimant_id 
    OR 
    -- Allow if user is the item owner (finder)
    EXISTS (
        SELECT 1 FROM public.items 
        WHERE items.id = handovers.item_id 
        AND items.user_id = auth.uid()
    )
);

-- Verify the policy was created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'handovers' AND policyname = 'Users can view handovers for their items';
