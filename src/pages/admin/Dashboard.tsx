import { useState, useEffect } from 'react';
import { AlertCircle, TrendingUp, TrendingDown, DollarSign, ShoppingBag } from 'lucide-react';
import { Restaurant } from '../../types';
import { formatPrice } from '../../utils/currency';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface DailySales {
  date: string;
  total_amount: number;
  order_count: number;
}

const Dashboard = () => {
  const { session } = useAuth();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [dailySales, setDailySales] = useState<DailySales[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!session) {
          setError('No active session');
          setIsLoading(false);
          return;
        }

        // Get restaurant
        const { data: restaurantData, error: restaurantError } = await supabase
          .from('restaurants')
          .select('*')
          .eq('owner_id', session.user.id)
          .single();

        if (restaurantError) throw restaurantError;
        if (!restaurantData) throw new Error('No restaurant found');

        setRestaurant({
          id: restaurantData.id,
          name: restaurantData.name,
          slug: restaurantData.slug,
          logoUrl: restaurantData.logo_url,
          description: restaurantData.description,
          ownerId: restaurantData.owner_id,
        });

        // Get all orders
        const { data: orders, error: ordersError } = await supabase
          .from('orders')
          .select('*')
          .eq('restaurant_id', restaurantData.id)
          .order('created_at', { ascending: false });

        if (ordersError) throw ordersError;

        // Calculate daily totals
        const salesMap = new Map<string, { total: number; count: number }>();
        
        orders?.forEach(order => {
          const date = new Date(order.created_at).toISOString().split('T')[0];
          const current = salesMap.get(date) || { total: 0, count: 0 };
          current.total += order.total;
          current.count += 1;
          salesMap.set(date, current);
        });

        // Convert map to array and sort by date
        const allDays = Array.from(salesMap.entries()).map(([date, data]) => ({
          date,
          total_amount: data.total,
          order_count: data.count
        })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        setDailySales(allDays);
      } catch (err: any) {
        console.error('Error fetching dashboard data:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [session]);

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) {
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    } else if (current < previous) {
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    }
    return null;
  };

  const getTodayStats = () => {
    const today = new Date().toISOString().split('T')[0];
    const todayData = dailySales.find(day => day.date === today);
    const yesterdayData = dailySales.find(day => day.date === new Date(Date.now() - 86400000).toISOString().split('T')[0]);

    return {
      today: todayData || { total_amount: 0, order_count: 0 },
      yesterday: yesterdayData || { total_amount: 0, order_count: 0 }
    };
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-red-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const { today, yesterday } = getTodayStats();
  const orderTrend = today.order_count - yesterday.order_count;
  const amountTrend = today.total_amount - yesterday.total_amount;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Daily Sales</h2>
        <p className="mt-1 text-sm text-gray-500">
          Overview of your restaurant's daily sales
        </p>
      </div>

      {/* Today's Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Total Orders Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Today's Orders</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{today.order_count}</p>
              <div className="flex items-center mt-2">
                {orderTrend !== 0 && (
                  <>
                    {getTrendIcon(today.order_count, yesterday.order_count)}
                    <span className={`text-sm ml-1 ${orderTrend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {Math.abs(orderTrend)} {orderTrend > 0 ? 'more' : 'less'} than yesterday
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className="bg-blue-50 p-3 rounded-full">
              <ShoppingBag className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Total Amount Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Today's Revenue</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{formatPrice(today.total_amount)}</p>
              <div className="flex items-center mt-2">
                {amountTrend !== 0 && (
                  <>
                    {getTrendIcon(today.total_amount, yesterday.total_amount)}
                    <span className={`text-sm ml-1 ${amountTrend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatPrice(Math.abs(amountTrend))} {amountTrend > 0 ? 'more' : 'less'} than yesterday
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className="bg-green-50 p-3 rounded-full">
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Daily History Table */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Orders
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Amount
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trend
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dailySales.map((day, index) => (
                <tr key={day.date} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {new Date(day.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {day.order_count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatPrice(day.total_amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {index < dailySales.length - 1 && getTrendIcon(
                      day.order_count,
                      dailySales[index + 1].order_count
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 