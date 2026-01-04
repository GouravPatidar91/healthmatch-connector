-- Allow vendors to delete their failed delivery broadcasts
CREATE POLICY "Vendors can delete their failed delivery broadcasts"
ON delivery_broadcasts FOR DELETE
USING (
  vendor_id IN (
    SELECT id FROM medicine_vendors WHERE user_id = auth.uid()
  )
  AND status = 'failed'
);

-- Allow system to delete expired/rejected delivery requests
CREATE POLICY "System can delete expired delivery requests"
ON delivery_requests FOR DELETE
USING (
  status IN ('expired', 'rejected')
  AND (
    -- Vendor can delete for their orders
    vendor_id IN (SELECT id FROM medicine_vendors WHERE user_id = auth.uid())
    OR
    -- Or system-level access
    true
  )
);