-- Create trigger to automatically log order status changes
DROP TRIGGER IF EXISTS log_medicine_order_status_change ON public.medicine_orders;

CREATE TRIGGER log_medicine_order_status_change
AFTER UPDATE ON public.medicine_orders
FOR EACH ROW
WHEN (OLD.order_status IS DISTINCT FROM NEW.order_status)
EXECUTE FUNCTION public.log_order_status_change();