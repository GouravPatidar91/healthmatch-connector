-- Add support for custom medicines created by vendors
ALTER TABLE public.vendor_medicines 
ADD COLUMN is_custom_medicine boolean DEFAULT false,
ADD COLUMN custom_medicine_name text,
ADD COLUMN custom_medicine_brand text,
ADD COLUMN custom_medicine_generic_name text,
ADD COLUMN custom_medicine_manufacturer text,
ADD COLUMN custom_medicine_category text,
ADD COLUMN custom_medicine_composition text,
ADD COLUMN custom_medicine_dosage text,
ADD COLUMN custom_medicine_form text,
ADD COLUMN custom_medicine_pack_size text,
ADD COLUMN custom_medicine_description text,
ADD COLUMN custom_medicine_side_effects text,
ADD COLUMN custom_medicine_contraindications text,
ADD COLUMN custom_medicine_storage_instructions text,
ADD COLUMN custom_medicine_drug_schedule text,
ADD COLUMN custom_medicine_image_url text,
ADD COLUMN custom_medicine_mrp numeric;

-- Update prescription uploads to trigger vendor notifications
CREATE OR REPLACE FUNCTION public.notify_vendor_on_prescription_upload()
RETURNS TRIGGER AS $$
BEGIN
  -- Create a notification for the vendor when prescription is uploaded for their order
  IF NEW.order_id IS NOT NULL THEN
    INSERT INTO public.vendor_notifications (
      vendor_id,
      order_id,
      title,
      message,
      type,
      priority
    )
    SELECT 
      mo.vendor_id,
      NEW.order_id,
      'New Prescription Uploaded',
      'A customer has uploaded a prescription for order #' || mo.order_number || '. Please review and approve/reject.',
      'prescription_upload',
      'high'
    FROM public.medicine_orders mo
    WHERE mo.id = NEW.order_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for prescription upload notifications
CREATE TRIGGER trigger_notify_vendor_on_prescription_upload
  AFTER INSERT ON public.prescription_uploads
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_vendor_on_prescription_upload();

-- Add prescription approval functionality to medicine orders
ALTER TABLE public.medicine_orders 
ADD COLUMN prescription_approved_at timestamp with time zone,
ADD COLUMN prescription_approved_by uuid REFERENCES public.medicine_vendors(id),
ADD COLUMN prescription_rejection_reason text;