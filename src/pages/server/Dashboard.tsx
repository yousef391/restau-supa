import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase, updateOrderStatus } from '../../lib/supabase';
import Button from '../../components/ui/Button';
import { Plus, LogOut, AlertCircle, Clock, CheckCircle, ChevronDown, X } from 'lucide-react';
import type { Order, MenuItem } from '../../types';
import { formatPrice } from '../../utils/currency';
import React from 'react';

const ServerDashboard = () => {
  const { restaurantId } = useParams();
  const navigate = useNavigate();
  const [server, setServer] = useState<any>(null);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [tableNumber, setTableNumber] = useState('');
  const [selectedItems, setSelectedItems] = useState<{id: string; quantity: number}[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'received' | 'completed'>('all'); // State for filter

  const loadServerDataAndFetch = async () => {
    try {
      const storedServer = localStorage.getItem('server');
      if (!storedServer) {
        console.log('No server data in localStorage');
        navigate('/server/login');
        return;
      }

      const serverData = JSON.parse(storedServer);
      console.log('Loaded server data from localStorage:', serverData);

      // Verify the server data matches the restaurant context
      if (serverData.restaurant_id !== restaurantId) {
        console.log('Restaurant ID mismatch for stored server.', { 
          storedRestaurantId: serverData.restaurant_id,
          currentRestaurantId: restaurantId 
        });
        localStorage.removeItem('server');
        navigate('/server/login');
        return;
      }

      setServer(serverData);
      console.log('Server data set, proceeding to fetch menu and orders.');
      
      // Fetch menu and orders in parallel
      console.log('ServerData before fetching:', serverData);
      console.log('RestaurantId before fetching:', restaurantId);
      await Promise.all([
        fetchMenu(),
        fetchOrders(serverData)
      ]);
    } catch (err) {
      console.error('Error loading server data and fetching:', err);
      setError('Failed to load data. Please try logging in again.');
      // navigate('/server/login'); // Consider if you want to auto-navigate on any load error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServerDataAndFetch();
    
    // Optional: Keep the auth listener for general sign out events if needed later
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed (general):', event, session);
      if (event === 'SIGNED_OUT') {
        console.log('Main auth session signed out.');
        // You might want to decide how this affects the server session
        // For now, let's not automatically log out the server here.
        // localStorage.removeItem('server'); // Uncomment if signing out main user should also sign out server
        // navigate('/server/login'); // Uncomment if signing out main user should also sign out server
      }
    });
     return () => {
       authListener.subscription.unsubscribe();
     };
  }, [restaurantId, navigate]); 

  const fetchMenu = async () => {
    try {
      console.log('Fetching menu for restaurant:', restaurantId);
      
      const { data, error } = await supabase
        .from('menu_items')
        .select(`
          *,
          categories (
            id,
            name
          )
        `)
        .eq('restaurant_id', restaurantId)
        .order('category_id', { ascending: true });

      console.log('Menu fetch response:', { data, error });

      if (error) {
        console.error('Menu fetch error:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.log('No menu items found');
        setError('No menu items found. Please add items to your menu first.');
      } else {
        console.log('Menu items loaded:', data.length);
        setMenu(data);
      }
    } catch (err) {
      console.error('Menu fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load menu');
    }
  };

  const fetchOrders = async (serverData: any) => {
    try {
      if (!serverData?.id) {
        console.error('No server ID available');
        setError('Server information not found. Please log in again.');
        return;
      }

      console.log('Fetching orders for server:', serverData.id);
      
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            menu_item_id,
            quantity,
            price,
            menu_items (
              id,
              name
            )
          )
        `)
        .eq('restaurant_id', restaurantId)
        .eq('server_id', serverData.id)
        .order('created_at', { ascending: false });

      console.log('Orders fetch response:', { data, error });

      if (error) {
        console.error('Orders fetch error:', error);
        throw error;
      }

      // Transform the data to match the expected format
      const transformedOrders = data?.map(order => ({
        ...order,
        items: order.order_items?.map((item: { menu_item_id: string; menu_items?: { name: string }; quantity: number; price: number }) => ({
          id: item.menu_item_id,
          name: item.menu_items?.name || 'Unknown Item',
          quantity: item.quantity,
          price: item.price
        })) || []
      })) || [];

      console.log('Transformed orders:', transformedOrders);
      setOrders(transformedOrders);
    } catch (err) {
      console.error('Orders fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('server');
    navigate('/server/login');
  };

  const handleCreateOrder = async () => {
    if (!tableNumber || selectedItems.length === 0) {
      setError('Please select a table number and at least one item');
      return;
    }

    try {
      setLoading(true);
      console.log('Creating order with:', {
        restaurantId,
        serverId: server.id,
        tableNumber,
        items: selectedItems
      });

      const itemsForDb = selectedItems.map(item => {
        const menuItem = menu.find(m => m.id === item.id);
        return {
          menu_item_id: item.id,
          quantity: item.quantity,
          price: menuItem?.price || 0
        };
      });

      const { data, error } = await supabase.rpc('create_server_order', {
        p_restaurant_id: restaurantId,
        p_server_id: server.id,
        p_table_number: parseInt(tableNumber),
        p_items: itemsForDb
      });

      console.log('Order creation response:', { data, error });

      if (error) {
        console.error('Order creation error:', error);
        throw error;
      }

      // Assuming the RPC now returns the ticket data in 'data'
      const ticketData = data; // The JSON object returned by the RPC

       setShowNewOrderModal(false);
       setTableNumber('');
       setSelectedItems([]);
       setSelectedCategory(null);

       if (ticketData && ticketData.order) {
         // Add the new order to the orders state to update the list immediately
         // We need to format the new order data to match the structure expected by the orders state
         const newOrder = {
           ...ticketData.order,
           order_items: ticketData.order.items.map((item: any) => ({
              id: item.menu_item_id, // Assuming the RPC returns menu_item_id in the items array
              menu_item_id: item.menu_item_id, // Keep both for consistency with fetchOrders structure
              quantity: item.quantity,
              price: item.price,
              menu_items: { name: item.name } // Match the nested structure from fetchOrders
           }))
         };
         setOrders(prevOrders => [newOrder, ...prevOrders]); // Add new order to the top of the list

         // Process and display ticket data for printing
         displayTicketForPrinting(ticketData);
       } else {
          console.error('Order creation successful, but received invalid ticket data:', ticketData);
          setError('Order created, but failed to get ticket data.');
          // Still try to re-fetch orders if ticket data is invalid but order was created
          await fetchOrders(server);
       }

    } catch (err) {
      console.error('Order creation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  const handleItemSelect = (itemId: string) => {
    setSelectedItems(prev => {
      const existing = prev.find(item => item.id === itemId);
      if (existing) {
        return prev.map(item =>
          item.id === itemId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { id: itemId, quantity: 1 }];
    });
  };

  const handleItemQuantityChange = (itemId: string, quantity: number) => {
    if (quantity < 0) return; // Prevent negative quantities

    setSelectedItems(prev => {
      const existing = prev.find(item => item.id === itemId);
      if (existing) {
        if (quantity === 0) {
          // Remove item if quantity is 0
          return prev.filter(item => item.id !== itemId);
        }
        // Update quantity
        return prev.map(item =>
          item.id === itemId ? { ...item, quantity } : item
        );
      }
      // Add new item if quantity is greater than 0
      if (quantity > 0) {
         const menuItem = menu.find(m => m.id === itemId);
         if (menuItem) {
            return [...prev, { id: itemId, quantity }];
         }
      }
      return prev; // Return previous state if item not found or quantity is 0
    });
  };

  // Group menu items by category
  const menuByCategory = menu.reduce((acc, item) => {
    const categoryName = item.categories?.name || 'Uncategorized';
    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }
    acc[categoryName].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  const handleUpdateOrderStatus = async (orderId: string, newStatus: 'received' | 'completed') => {
    try {
      setUpdatingStatus(orderId);
      console.log(`Updating order ${orderId} status to ${newStatus}`);
      
      // Use the shared helper function
      const { data, error } = await updateOrderStatus(orderId, newStatus);

      if (error) {
        console.error('Failed to update order status:', error);
        throw error;
      }

      console.log(`Order ${orderId} status updated to ${newStatus}`, data);
      // Re-fetch orders to update the list
      await fetchOrders(server);

    } catch (err) {
      console.error('Error updating order status:', err);
      setError(err instanceof Error ? err.message : 'Failed to update order status');
    } finally {
      setUpdatingStatus(null);
    }
  };

   // Handle updating item quantity in an existing order
   const handleUpdateOrderItemQuantity = async (orderId: string, itemId: string, newQuantity: number) => {
    if (newQuantity < 0) return;
    if (newQuantity === 0) {
      // If quantity is 0, remove the item
      await handleRemoveOrderItem(orderId, itemId);
      return;
    }
    try {
      // Find the specific order item id within the order
      const orderItem = orders.find(o => o.id === orderId)?.order_items?.find((oi: any) => oi.menu_item_id === itemId);
      if (!orderItem) {
        console.error('Order item not found');
        setError('Failed to find order item.');
        return;
      }

      const { error } = await supabase
        .from('order_items')
        .update({ quantity: newQuantity })
        .eq('id', orderItem.id);

      if (error) throw error;
      
      // Re-fetch orders to update the list and totals
      await fetchOrders(server);

    } catch (err) {
      console.error('Error updating order item quantity:', err);
      setError(err instanceof Error ? err.message : 'Failed to update item quantity');
    }
  };

  // Handle removing an item from an existing order
  const handleRemoveOrderItem = async (orderId: string, itemId: string) => {
    if (!confirm('Are you sure you want to remove this item?')) {
      return;
    }
    try {
       // Find the specific order item id within the order
       const orderItem = orders.find(o => o.id === orderId)?.order_items?.find((oi: any) => oi.menu_item_id === itemId);
       if (!orderItem) {
         console.error('Order item not found');
         setError('Failed to find order item.');
         return;
       }

      const { error } = await supabase
        .from('order_items')
        .delete()
        .eq('id', orderItem.id);

      if (error) throw error;

      // Re-fetch orders to update the list and totals
      await fetchOrders(server);

    } catch (err) {
      console.error('Error removing order item:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove item');
    }
  };

  // Define status icons
  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'received':
        return <Clock className="h-3.5 w-3.5 text-yellow-500" />;
      case 'completed':
        return <CheckCircle className="h-3.5 w-3.5 text-green-500" />;
      default:
        return null; // Should not happen with expected statuses
    }
  };

  // Define status colors
  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'received':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800'; // Default for unexpected statuses
    }
  };

  // Filter orders based on selected filter
  const filteredOrders = orders.filter(order => {
    if (selectedFilter === 'all') {
      // Show received and completed
      return order.status === 'received' || order.status === 'completed';
    } else if (selectedFilter === 'received') {
      // Show only received orders
      return order.status === 'received';
    } else if (selectedFilter === 'completed') {
      // Show only completed orders
      return order.status === 'completed';
    }
    return false; // Should not reach here
  });

  const displayTicketForPrinting = (ticketData: any) => {
    if (!ticketData || !ticketData.restaurant || !ticketData.order) {
      console.error('Invalid ticket data received:', ticketData);
      setError('Failed to generate ticket data.');
      return;
    }

    const { restaurant, order } = ticketData;

    // Create HTML content for the ticket
    const ticketHtml = `
      <html>
      <head>
        <title>Order Ticket #${order.id}</title>
        <style>
          body { font-family: ' monospace', monospace; line-height: 1.5; width: 80mm; margin: 0 auto; padding: 10mm; }
          .header { text-align: center; margin-bottom: 10mm; }
          .restaurant-name { font-size: 1.5em; font-weight: bold; }
          .order-details { margin-bottom: 10mm; border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 5mm 0; }
          .item { display: flex; justify-content: space-between; }
          .item .name { flex-grow: 1; margin-right: 5mm; }
          .total { text-align: right; font-size: 1.2em; font-weight: bold; margin-top: 10mm; border-top: 1px dashed #000; padding-top: 5mm; }
          .footer { text-align: center; margin-top: 10mm; font-size: 0.9em; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="restaurant-name">${restaurant.name || 'Restaurant Name'}</div>
          ${restaurant.address ? `<div class="address">${restaurant.address}</div>` : ''}
          ${restaurant.phone_number ? `<div class="phone">${restaurant.phone_number}</div>` : ''}
        </div>
        <div class="order-details">
          <div>Order ID: ${order.id.substring(0, 8).toUpperCase()}</div>
          <div>Table Number: ${order.table_number}</div>
          <div>Date: ${new Date(order.created_at).toLocaleString()}</div>
        </div>
        <div class="items">
          ${order.items.map((item: any) => `
            <div class="item">
              <span class="quantity">${item.quantity}x</span>
              <span class="name">${item.name}</span>
              <span class="price">${formatPrice(item.subtotal)}</span>
            </div>
          `).join('')}
        </div>
        <div class="total">Total: ${formatPrice(order.total)}</div>
        <div class="footer">
          Thank you for your order!
        </div>
      </body>
      </html>
    `;

    // Open a new window and write the HTML content
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(ticketHtml);
      printWindow.document.close();

      // Wait for content to load and then print
      printWindow.onload = () => {
        printWindow.print();
        // Optional: Close the window after printing
        // printWindow.close();
      };
    } else {
      setError('Could not open print window. Please allow pop-ups for this site.');
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Server Dashboard</h1>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm md:text-base"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{error}</h3>
              </div>
            </div>
          </div>
        )}

        {/* Orders List with Filtering */}
        <div className="bg-white rounded-lg shadow p-4 md:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h2 className="text-lg font-medium text-gray-900">Orders</h2>
             <Button
                onClick={() => setShowNewOrderModal(true)}
                className="w-full sm:w-auto flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                New Order
              </Button>
          </div>

          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-3 mb-6">
            <button 
              onClick={() => setSelectedFilter('all')}
              className={`flex-1 text-center px-3 py-2 rounded-md text-sm font-medium ${selectedFilter === 'all' ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              All ({orders.filter(order => order.status === 'received' || order.status === 'completed').length})
            </button>
            <button 
              onClick={() => setSelectedFilter('received')}
              className={`flex-1 text-center px-3 py-2 rounded-md text-sm font-medium ${selectedFilter === 'received' ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              Received ({orders.filter(order => order.status === 'received').length})
            </button>
            <button 
              onClick={() => setSelectedFilter('completed')}
              className={`flex-1 text-center px-3 py-2 rounded-md text-sm font-medium ${selectedFilter === 'completed' ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              Completed ({orders.filter(order => order.status === 'completed').length})
            </button>
          </div>

          <div className="space-y-4">
            {filteredOrders.length === 0 ? (
              <div className="text-center text-gray-500 text-sm py-4">No orders to display for this filter.</div>
            ) : (
              filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className="border rounded-lg p-4 hover:border-primary-500 transition-colors flex flex-col md:flex-row justify-between md:items-center gap-4"
                >
                  {/* Order Info */}
                  <div className="flex-1">
                    <p className="font-medium text-lg">Table {order.table_number}</p>
                    <p className="text-sm text-gray-500">
                      Order placed at {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                     <span className={`mt-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                       {getStatusIcon(order.status)}
                       {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                     </span>
                  </div>

                  {/* Order Items (Collapsed by default on mobile) */}
                   <div className="flex-1">
                     <h4 className="font-medium mb-2">Items:</h4>
                     <ul className="space-y-1">
                       {order.order_items?.map((item: any) => (
                         <li key={item.id} className="text-sm text-gray-700 flex justify-between">
                           <span>{item.quantity} x {item.menu_items?.name || 'Unknown Item'}</span>
                           <span>{formatPrice(item.price * item.quantity)}</span>
                         </li>
                       ))}
                     </ul>
                     <div className="flex justify-between font-medium mt-2 pt-2 border-t border-gray-200">
                        <span>Total:</span>
                        <span>{formatPrice(order.total)}</span>
                     </div>
                   </div>

                  {/* Actions */}
                  <div className="flex flex-col space-y-2 md:space-y-0 md:space-x-2 justify-end">

                    {order.status === 'received' && (
                       <Button
                         onClick={() => handleUpdateOrderStatus(order.id, 'completed')}
                         disabled={updatingStatus === order.id}
                         className="text-sm w-full md:w-auto"
                       >
                         {updatingStatus === order.id ? 'Completing...' : 'Mark as Completed'}
                       </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* New Order Modal */}
      {showNewOrderModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-md md:max-w-lg lg:max-w-xl max-h-[90vh] overflow-y-auto rounded-lg bg-white shadow-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Create New Order</h3>
              <button onClick={() => setShowNewOrderModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Table Number Input */}
            <div className="mb-4">
              <label htmlFor="tableNumber" className="block text-sm font-medium text-gray-700 mb-1">Table Number <span className="text-gray-500 font-normal">(e.g., 1, 2, Patio 5)</span></label>
              <input
                type="text"
                id="tableNumber"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                required
              />
            </div>

            {/* Menu Item Selection */}
            <div className="mb-4">
              <h4 className="text-lg font-medium mb-2">Menu Items</h4>
              {Object.entries(menuByCategory).map(([category, items]) => (
                <div key={category} className="mb-4 border-b border-gray-200 pb-4 last:border-b-0 last:pb-0">
                  <h5 className="font-semibold text-gray-800 mb-2 flex justify-between items-center cursor-pointer" onClick={() => setSelectedCategory(selectedCategory === category ? null : category)}>
                    {category}
                    <ChevronDown className={`w-5 h-5 transform transition-transform duration-200 ${selectedCategory === category ? 'rotate-180' : 'rotate-0'}`} />
                  </h5>
                  {selectedCategory === category && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {items.map(item => (
                        <div key={item.id} className="border border-gray-200 rounded-md p-3 text-sm">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-medium text-gray-900">{item.name}</span>
                            <span className="text-gray-600">{formatPrice(item.price)}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleItemQuantityChange(item.id, (selectedItems.find(si => si.id === item.id)?.quantity || 0) - 1)}
                              className="rounded-md bg-gray-200 px-2 py-1 text-xs hover:bg-gray-300"
                              disabled={((selectedItems.find(si => si.id === item.id)?.quantity || 0) <= 0)}
                            >
                              -
                            </button>
                            <input
                              type="number"
                              value={selectedItems.find(si => si.id === item.id)?.quantity || 0}
                              onChange={(e) => handleItemQuantityChange(item.id, parseInt(e.target.value) || 0)}
                              className="w-12 text-center border-gray-300 rounded-md text-xs"
                              min="0"
                            />
                            <button
                              onClick={() => handleItemQuantityChange(item.id, (selectedItems.find(si => si.id === item.id)?.quantity || 0) + 1)}
                              className="rounded-md bg-gray-200 px-2 py-1 text-xs hover:bg-gray-300"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Selected Items Summary */}
            {selectedItems.length > 0 && (
              <div className="mb-4">
                <h4 className="text-lg font-medium mb-2">Order Summary</h4>
                <ul className="space-y-1 text-sm text-gray-700">
                  {selectedItems.map(selectedItem => {
                     const item = menu.find(m => m.id === selectedItem.id);
                     if (!item) return null;
                     const confirmedItem: MenuItem = item; // Type assertion
                     return (
                       <li key={selectedItem.id} className="flex justify-between">
                         <span>{selectedItem.quantity} x {confirmedItem.name}</span>
                         <span>{formatPrice(confirmedItem.price * selectedItem.quantity)}</span>
                       </li>
                     );
                  })}
                </ul>
                <div className="flex justify-between font-semibold mt-2 pt-2 border-t border-gray-200">
                   <span>Total:</span>
                   <span>{formatPrice(selectedItems.reduce((total, si) => {
                      const item = menu.find(m => m.id === si.id);
                      return total + (item?.price || 0) * si.quantity;
                   }, 0))}</span>
                </div>
              </div>
            )}

            <Button
              onClick={handleCreateOrder}
              disabled={!tableNumber || selectedItems.length === 0 || loading}
              className="w-full"
            >
              {loading ? 'Creating...' : 'Create Order'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServerDashboard; 