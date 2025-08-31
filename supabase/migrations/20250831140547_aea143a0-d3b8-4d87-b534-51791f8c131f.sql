-- Add clinic location columns to doctors table
ALTER TABLE public.doctors 
ADD COLUMN clinic_latitude double precision,
ADD COLUMN clinic_longitude double precision,
ADD COLUMN clinic_address text;