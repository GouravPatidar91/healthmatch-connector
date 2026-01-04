-- Allow admins to view all vendors (for admin dashboard)
CREATE POLICY "Admins can view all vendors"
ON medicine_vendors FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Allow admins to update vendor verification status
CREATE POLICY "Admins can update vendors"
ON medicine_vendors FOR UPDATE
USING (has_role(auth.uid(), 'admin'));