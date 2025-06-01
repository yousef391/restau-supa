import { useState, useEffect } from 'react';
import { useSessionContext } from '@supabase/auth-helpers-react';
import { Save, AlertCircle, QrCode } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Restaurant } from '../../types';
import { useForm } from 'react-hook-form';
import Button from '../../components/ui/Button';
import QRCodeGenerator from '../../components/restaurant/QRCodeGenerator';

interface RestaurantFormData {
  name: string;
  slug: string;
  description: string;
  logoUrl: string;
}

const RestaurantSettings = () => {
  const { user } = useSessionContext();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showQRCode, setShowQRCode] = useState(false);
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<RestaurantFormData>();
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!user) return;
        
        // Fetch restaurant
        const { data: restaurantData, error: restaurantError } = await supabase
          .from('restaurants')
          .select('*')
          .eq('owner_id', user.id)
          .single();
        
        if (restaurantError) throw restaurantError;
        
        const restaurant: Restaurant = {
          id: restaurantData.id,
          name: restaurantData.name,
          slug: restaurantData.slug,
          logoUrl: restaurantData.logo_url,
          description: restaurantData.description,
          ownerId: restaurantData.owner_id,
        };
        
        setRestaurant(restaurant);
        
        // Set form values
        reset({
          name: restaurant.name,
          slug: restaurant.slug,
          description: restaurant.description || '',
          logoUrl: restaurant.logoUrl || '',
        });
      } catch (error) {
        console.error('Error fetching restaurant data:', error);
        setError('Failed to load restaurant data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [user, reset]);
  
  const onSubmit = async (data: RestaurantFormData) => {
    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);
      
      if (!restaurant) return;
      
      const { error } = await supabase
        .from('restaurants')
        .update({
          name: data.name,
          slug: data.slug,
          description: data.description || null,
          logo_url: data.logoUrl || null,
        })
        .eq('id', restaurant.id);
      
      if (error) throw error;
      
      setRestaurant({
        ...restaurant,
        name: data.name,
        slug: data.slug,
        description: data.description || null,
        logoUrl: data.logoUrl || null,
      });
      
      setSuccess('Restaurant settings updated successfully');
    } catch (err: any) {
      console.error('Error updating restaurant:', err);
      setError(err.message || 'Failed to update restaurant settings');
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Restaurant Settings</h1>
          <p className="text-gray-600">Manage your restaurant information</p>
        </div>
      </div>
      
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-md bg-error/10 p-3 text-sm text-error">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}
      
      {success && (
        <div className="mb-4 flex items-center gap-2 rounded-md bg-success/10 p-3 text-sm text-success">
          <AlertCircle size={16} />
          <span>{success}</span>
        </div>
      )}
      
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <div className="rounded-lg bg-white p-6 shadow-md">
            <h2 className="mb-4 text-lg font-bold">Restaurant Information</h2>
            
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="mb-4">
                <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">
                  Restaurant Name
                </label>
                <input
                  id="name"
                  type="text"
                  className={`input ${errors.name ? 'border-error' : ''}`}
                  {...register('name', { required: 'Restaurant name is required' })}
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-error">{errors.name.message}</p>
                )}
              </div>
              
              <div className="mb-4">
                <label htmlFor="slug" className="mb-1 block text-sm font-medium text-gray-700">
                  URL Slug
                </label>
                <div className="flex">
                  <span className="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-3 text-sm text-gray-500">
                    {window.location.origin}/r/
                  </span>
                  <input
                    id="slug"
                    type="text"
                    className={`input rounded-l-none ${errors.slug ? 'border-error' : ''}`}
                    {...register('slug', { 
                      required: 'URL slug is required',
                      pattern: {
                        value: /^[a-z0-9-]+$/,
                        message: 'Slug can only contain lowercase letters, numbers, and hyphens'
                      }
                    })}
                  />
                </div>
                {errors.slug ? (
                  <p className="mt-1 text-xs text-error">{errors.slug.message}</p>
                ) : (
                  <p className="mt-1 text-xs text-gray-500">
                    This will be the URL customers use to access your menu
                  </p>
                )}
              </div>
              
              <div className="mb-4">
                <label htmlFor="description" className="mb-1 block text-sm font-medium text-gray-700">
                  Description (optional)
                </label>
                <textarea
                  id="description"
                  rows={3}
                  className="input"
                  placeholder="Brief description of your restaurant"
                  {...register('description')}
                />
              </div>
              
              <div className="mb-6">
                <label htmlFor="logoUrl" className="mb-1 block text-sm font-medium text-gray-700">
                  Logo URL (optional)
                </label>
                <input
                  id="logoUrl"
                  type="text"
                  className="input"
                  placeholder="https://example.com/logo.png"
                  {...register('logoUrl')}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Enter a URL to your restaurant's logo image
                </p>
              </div>
              
              <Button
                type="submit"
                className="w-full sm:w-auto"
                isLoading={isSaving}
                icon={<Save size={16} />}
              >
                Save Changes
              </Button>
            </form>
          </div>
        </div>
        
        <div>
          <div className="rounded-lg bg-white p-6 shadow-md">
            <h2 className="mb-4 text-lg font-bold">QR Code</h2>
            <p className="mb-4 text-sm text-gray-600">
              Generate a QR code for your restaurant menu that customers can scan.
            </p>
            
            {showQRCode && restaurant ? (
              <QRCodeGenerator 
                url={`${window.location.origin}/r/${restaurant.slug}`}
                restaurantName={restaurant.name}
              />
            ) : (
              <Button
                variant="outline"
                className="w-full"
                icon={<QrCode size={16} />}
                onClick={() => setShowQRCode(true)}
              >
                Generate QR Code
              </Button>
            )}
          </div>
          
          <div className="mt-6 rounded-lg bg-white p-6 shadow-md">
            <h2 className="mb-4 text-lg font-bold">Table QR Codes</h2>
            <p className="mb-4 text-sm text-gray-600">
              Create unique QR codes for each table in your restaurant.
            </p>
            
            <div className="mb-4">
              <label htmlFor="tableNumber" className="mb-1 block text-sm font-medium text-gray-700">
                Table Number
              </label>
              <input
                id="tableNumber"
                type="text"
                className="input"
                placeholder="e.g. 12"
              />
            </div>
            
            <Button
              variant="outline"
              className="w-full"
              icon={<QrCode size={16} />}
            >
              Generate Table QR Code
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantSettings;