-- Drop the existing trigger first
DROP TRIGGER IF EXISTS on_appointment_confirmed ON public.appointments;

-- Drop the old function
DROP FUNCTION IF EXISTS notify_appointment_confirmation();

-- Create a fixed version that uses customer_notifications table
CREATE OR REPLACE FUNCTION notify_appointment_confirmation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    doctor_record RECORD;
BEGIN
    -- Only trigger if status changed to 'confirmed'
    IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
        
        -- Get doctor information from doctors table
        SELECT 
            name as full_name,
            specialization,
            clinic_latitude,
            clinic_longitude,
            clinic_address,
            hospital
        INTO doctor_record
        FROM doctors
        WHERE id = NEW.doctor_id;
        
        -- Only create notification if doctor exists
        IF FOUND THEN
            -- Insert notification into customer_notifications table (correct table)
            INSERT INTO customer_notifications (
                user_id,
                type,
                title,
                message,
                metadata,
                is_read,
                created_at
            ) VALUES (
                NEW.user_id,
                'appointment_confirmed',
                'Appointment Confirmed! 🎉',
                'Your appointment with Dr. ' || COALESCE(doctor_record.full_name, 'Doctor') || 
                ' is confirmed for ' || TO_CHAR(NEW.date::date, 'Mon DD, YYYY') || 
                ' at ' || NEW.time || '. Tap to view clinic location.',
                jsonb_build_object(
                    'appointment_id', NEW.id,
                    'doctor_name', doctor_record.full_name,
                    'doctor_specialization', doctor_record.specialization,
                    'clinic_latitude', doctor_record.clinic_latitude,
                    'clinic_longitude', doctor_record.clinic_longitude,
                    'clinic_address', doctor_record.clinic_address,
                    'hospital', doctor_record.hospital,
                    'appointment_date', NEW.date::text,
                    'appointment_time', NEW.time
                ),
                false,
                NOW()
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_appointment_confirmed
AFTER UPDATE ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION notify_appointment_confirmation();