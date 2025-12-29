-- Enable full replica identity for complete row data in realtime updates
ALTER TABLE cart_order_broadcasts REPLICA IDENTITY FULL;

-- Add to realtime publication so clients can subscribe to changes
ALTER PUBLICATION supabase_realtime ADD TABLE cart_order_broadcasts;