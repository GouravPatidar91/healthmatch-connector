-- Verify Patidar Pharmacy so it can receive notifications
UPDATE medicine_vendors 
SET is_verified = true 
WHERE pharmacy_name = 'Patidar Pharmacy' 
  AND is_verified = false;