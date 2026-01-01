-- Ensure cart_order_broadcasts sends full row data on updates for real-time subscriptions
ALTER TABLE cart_order_broadcasts REPLICA IDENTITY FULL;