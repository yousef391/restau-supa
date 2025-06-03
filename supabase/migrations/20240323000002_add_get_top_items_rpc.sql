-- Create a function to get the top N menu items by order quantity for a restaurant
CREATE OR REPLACE FUNCTION get_top_menu_items_by_restaurant(
    p_restaurant_id UUID,
    p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
    item_id UUID,
    item_name TEXT,
    total_quantity_ordered BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        oi.menu_item_id,
        mi.name,
        SUM(oi.quantity)::BIGINT AS total_quantity_ordered
    FROM
        order_items oi
    JOIN
        menu_items mi ON oi.menu_item_id = mi.id
    JOIN
        orders o ON oi.order_id = o.id
    WHERE
        o.restaurant_id = p_restaurant_id
    GROUP BY
        oi.menu_item_id, mi.name
    ORDER BY
        total_quantity_ordered DESC
    LIMIT p_limit;
END;
$$
LANGUAGE plpgsql
SECURITY DEFINER;

-- Grant usage to authenticated users (servers)
GRANT EXECUTE ON FUNCTION get_top_menu_items_by_restaurant(UUID, INTEGER) TO authenticated; 