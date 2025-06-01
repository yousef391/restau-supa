-- Update the orders table to remove cancelled status
ALTER TABLE orders
  DROP CONSTRAINT IF EXISTS orders_status_check,
  ADD CONSTRAINT orders_status_check 
    CHECK (status IN ('preparing', 'completed'));

-- Delete any existing cancelled orders
DELETE FROM orders WHERE status = 'cancelled'; 