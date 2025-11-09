-- Make prescriptions bucket public so vendors can view uploaded prescription files
UPDATE storage.buckets 
SET public = true 
WHERE id = 'prescriptions';