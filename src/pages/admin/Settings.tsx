import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Restaurant } from '../../types';
import QRCodeGenerator from '../../components/restaurant/QRCodeGenerator';
import Button from '../../components/ui/Button';
import { QRCodeCanvas } from 'qrcode.react';
import { Building2, Clock, Mail, MapPin, Phone, Store, Upload, X, QrCode, AlertCircle, Download, Facebook, Instagram, Map, Users, Plus, Trash2, CheckCircle } from 'lucide-react';
import { uploadRestaurantLogo, deleteRestaurantLogo, refreshLogoUrl, uploadRestaurantBanner, deleteRestaurantBanner } from '../../lib/supabase';

interface RestaurantSettings {
  name: string;
  description: string;
  logo_url?: string;
  banner_url?: string;
  facebook_url: string | null;
  instagram_url: string | null;
  google_maps_url: string | null;
}

const Settings = () => {
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const qrCodeRef = useRef<HTMLCanvasElement>(null);
  const [servers, setServers] = useState([]);
  const [showNewServerModal, setShowNewServerModal] = useState(false);
  const [newServer, setNewServer] = useState({ name: '', email: '', password: '' });
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<RestaurantSettings>();
  
  useEffect(() => {
    if (!session) {
      setError('Not authenticated');
      setLoading(false);
      return;
    }
    fetchSettings();
  }, [session]);
  
  const fetchSettings = async () => {
    try {
      if (!session) {
        setError('Not authenticated');
        return;
      }
      
      const { data: restaurant, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('owner_id', session.user.id)
        .single();
        
      if (error) throw error;
      if (!restaurant) throw new Error('Restaurant not found');

      setRestaurantId(restaurant.id);

      // Fetch servers
      const { data: servers, error: serversError } = await supabase
        .from('servers')
        .select('*')
        .eq('restaurant_id', restaurant.id);

      if (serversError) throw serversError;
      setServers(servers || []);

      // If there's a logo URL, refresh it
      if (restaurant.logo_url) {
        const { data: refreshedRestaurant, error: refreshError } = await refreshLogoUrl(restaurant.id);
        if (!refreshError && refreshedRestaurant) {
          reset(refreshedRestaurant);
          setLogoPreview(refreshedRestaurant.logo_url);
        } else {
          reset(restaurant);
          setLogoPreview(restaurant.logo_url);
        }
      } else {
        reset(restaurant);
        setLogoPreview(null);
      }

      // If there's a banner URL, refresh it
      if (restaurant.banner_url) {
        const { data: refreshedRestaurant, error: refreshError } = await refreshLogoUrl(restaurant.id);
        if (!refreshError && refreshedRestaurant) {
          reset(refreshedRestaurant);
          setBannerPreview(refreshedRestaurant.banner_url);
        } else {
          reset(restaurant);
          setBannerPreview(restaurant.banner_url);
        }
      } else {
        reset(restaurant);
        setBannerPreview(null);
      }

      setRestaurant({
        id: restaurant.id,
        name: restaurant.name,
        slug: restaurant.slug,
        logoUrl: restaurant.logo_url,
        description: restaurant.description,
        ownerId: restaurant.owner_id,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };
  
  const onSubmit = async (data: RestaurantSettings) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      if (!session) throw new Error('Not authenticated');
      
      if (!restaurantId) throw new Error('Restaurant ID not found');

      console.log('Updating restaurant settings:', { restaurantId, data });
      
      const { data: updatedRestaurant, error } = await supabase
        .from('restaurants')
        .update({
          name: data.name,
          description: data.description,
          logo_url: data.logo_url,
          banner_url: data.banner_url,
          facebook_url: data.facebook_url,
          instagram_url: data.instagram_url,
          google_maps_url: data.google_maps_url,
          updated_at: new Date().toISOString()
        })
        .eq('id', restaurantId)
        .eq('owner_id', session.user.id)
        .select()
        .single();
        
      if (error) {
        console.error('Update error:', error);
        throw error;
      }

      if (!updatedRestaurant) {
        throw new Error('Failed to update restaurant settings');
      }
      
      console.log('Settings updated successfully:', updatedRestaurant);
      setSuccess('Settings updated successfully');
      
      // Update the form with the new data
      reset(updatedRestaurant);
    } catch (err) {
      console.error('Settings update error:', err);
      setError(err instanceof Error ? err.message : 'Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !restaurantId) return;

    // Debug log
    console.log('Selected file:', file, 'Type:', file.type);

    // File type validation
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Only JPEG, PNG, and WebP images are allowed');
      return;
    }

    try {
      setUploadingLogo(true);
      setError(null);
      setSuccess(null);

      console.log('Starting logo upload for restaurant:', restaurantId);
      const { data: updatedRestaurant, error: uploadError } = await uploadRestaurantLogo(file, restaurantId);
      
      if (uploadError) {
        console.error('Logo upload error:', uploadError);
        throw uploadError;
      }

      if (!updatedRestaurant?.logo_url) {
        throw new Error('Failed to get logo URL after upload');
      }

      console.log('Logo uploaded successfully:', updatedRestaurant.logo_url);
      setLogoPreview(updatedRestaurant.logo_url);
      setSuccess('Logo updated successfully');
      
      // Update the form data with the new logo URL
      reset({ ...updatedRestaurant });
    } catch (err) {
      console.error('Logo upload error:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleLogoDelete = async () => {
    if (!restaurantId) return;

    try {
      setUploadingLogo(true);
      setError(null);
      setSuccess(null);

      const { error: deleteError } = await deleteRestaurantLogo(restaurantId);
      if (deleteError) throw deleteError;

      setLogoPreview(null);
      setSuccess('Logo deleted successfully');
      
      // Update the form data to remove the logo URL
      reset({ ...reset(), logo_url: null });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleBannerUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !restaurantId) return;

    try {
      setUploadingBanner(true);
      setError(null);
      setSuccess(null);

      console.log('Starting banner upload for restaurant:', restaurantId);
      const { data: updatedRestaurant, error: uploadError } = await uploadRestaurantBanner(file, restaurantId);
      
      if (uploadError) {
        console.error('Banner upload error:', uploadError);
        throw uploadError;
      }

      if (!updatedRestaurant?.banner_url) {
        throw new Error('Failed to get banner URL after upload');
      }

      console.log('Banner uploaded successfully:', updatedRestaurant.banner_url);
      setBannerPreview(updatedRestaurant.banner_url);
      setSuccess('Banner updated successfully');
      
      // Update the form data with the new banner URL
      reset({ ...updatedRestaurant });
    } catch (err) {
      console.error('Banner upload error:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload banner');
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleBannerDelete = async () => {
    if (!restaurantId) return;

    try {
      setUploadingBanner(true);
      setError(null);
      setSuccess(null);

      const { error: deleteError } = await deleteRestaurantBanner(restaurantId);
      if (deleteError) throw deleteError;

      setBannerPreview(null);
      setSuccess('Banner deleted successfully');
      
      // Update the form data to remove the banner URL
      reset({ ...reset(), banner_url: null });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete banner');
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleDownloadQR = () => {
    try {
      // Find the canvas element within the QR code component
      const canvas = document.querySelector('canvas');
      if (!canvas) {
        console.error('QR code canvas not found');
        return;
      }

      // Get the data URL directly from the canvas
      const dataUrl = canvas.toDataURL('image/png');
      
      // Create a temporary link element
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${restaurant?.name || 'restaurant'}-menu-qr.png`;
      
      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading QR code:', error);
      setError('Failed to download QR code. Please try again.');
    }
  };

  const getMenuUrl = () => {
    if (!restaurant?.slug) return '';
    return `${window.location.origin}/menu/${restaurant.slug}`;
  };

  const handleAddServer = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      if (!restaurantId) throw new Error('Restaurant ID not found');

      // Use the new RPC function to create the server with a hashed password
      const { data, error } = await supabase.rpc('create_server_with_password', {
        p_restaurant_id: restaurantId,
        p_name: newServer.name,
        p_email: newServer.email,
        p_password: newServer.password
      });

      if (error) throw error;

      // The RPC returns the inserted server object, which might not include the password_hash
      // We might need to re-fetch servers or assume the structure returned is sufficient
      // For now, let's assume the returned data is the server object without the hash
      setServers(prev => [...prev, data]);
      setShowNewServerModal(false);
      setNewServer({ name: '', email: '', password: '' });
      setSuccess('Server added successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add server');
    } finally {
      setLoading(false);
    }
  };

  const handleResetServerPassword = async (serverId: string) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const newPassword = Math.random().toString(36).slice(-8); // Generate random password

      // Hash the new password before updating
      // Note: This requires the pgcrypto extension enabled in your Supabase database
      const { error } = await supabase
        .from('servers')
        .update({
          password_hash: await supabase.rpc('crypt', { 
             p_password: newPassword, 
             p_salt: await supabase.rpc('gen_salt', { 
                p_type: 'bf' 
             })
          }) 
        })
        .eq('id', serverId);

      if (error) throw error;

      // We cannot display the hashed password, so we inform the user of the temporary password
      setSuccess(`Server password reset successfully. New temporary password: ${newPassword}`);

      // In a real application, you would securely communicate this temporary password,
      // e.g., send it via email (using Supabase Edge Functions or a backend) and
      // require the server to change it upon first login.

    } catch (err) {
      console.error('Error resetting password:', err);
      setError(err instanceof Error ? err.message : 'Failed to reset server password');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteServer = async (serverId: string) => {
    if (!confirm('Are you sure you want to remove this server?')) return;

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const { error } = await supabase
        .from('servers')
        .delete()
        .eq('id', serverId);

      if (error) throw error;

      setServers(prev => prev.filter(server => server.id !== serverId));
      setSuccess('Server removed successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove server');
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Store className="w-6 h-6 text-primary-600" />
            Restaurant Settings
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage your restaurant's information and contact details
          </p>
        </div>
        
        <div className="p-6">
          {error && (
            <div className="mb-6 rounded-md bg-red-50 p-4 border border-red-200">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
          
          {success && (
            <div className="mb-6 rounded-md bg-green-50 p-4 border border-green-200">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          )}

          {/* QR Code Section */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <QrCode className="w-5 h-5 text-primary-600" />
              Menu QR Code
            </h3>
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="flex justify-center p-4 bg-white rounded-lg border border-gray-200">
                  <QRCodeCanvas
                    value={getMenuUrl()}
                    size={200}
                    level="H"
                    includeMargin={true}
                  />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">How to use this QR code</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• Print this QR code and place it on your tables</li>
                    <li>• Customers can scan it with their phone's camera</li>
                    <li>• They'll be taken directly to your menu</li>
                    <li>• No app download required</li>
                  </ul>
                  <div className="mt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleDownloadQR}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download QR Code
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Logo Section */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Restaurant Logo</h3>
            <div className="flex items-start gap-6">
              <div className="flex-shrink-0">
                {logoPreview ? (
                  <div className="relative">
                    <img
                      src={logoPreview}
                      alt="Restaurant logo"
                      className="w-32 h-32 rounded-lg object-cover border border-gray-200"
                    />
                    <button
                      onClick={handleLogoDelete}
                      className="absolute -top-2 -right-2 p-1 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors"
                      title="Remove logo"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="w-32 h-32 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                    <Store className="w-8 h-8 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500 mb-4">
                  Upload your restaurant logo. Recommended size: 400x400 pixels. Maximum file size: 2MB.
                </p>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <input
                      type="file"
                      id="logo-upload"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={handleLogoUpload}
                      disabled={uploadingLogo}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="cursor-pointer"
                      disabled={uploadingLogo}
                      onClick={() => document.getElementById('logo-upload')?.click()}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
                    </Button>
                  </div>
                  {logoPreview && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleLogoDelete}
                      disabled={uploadingLogo}
                    >
                      Remove Logo
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Banner Section */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Restaurant Banner</h3>
            <div className="flex items-start gap-6">
              <div className="flex-shrink-0">
                {bannerPreview ? (
                  <div className="relative">
                    <img
                      src={bannerPreview}
                      alt="Restaurant banner"
                      className="w-32 h-32 rounded-lg object-cover border border-gray-200"
                    />
                    <button
                      onClick={handleBannerDelete}
                      className="absolute -top-2 -right-2 p-1 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors"
                      title="Remove banner"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="w-32 h-32 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                    <Store className="w-8 h-8 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500 mb-4">
                  Upload your restaurant banner. Recommended size: 1920x1080 pixels. Maximum file size: 2MB.
                </p>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <input
                      type="file"
                      id="banner-upload"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={handleBannerUpload}
                      disabled={uploadingBanner}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="cursor-pointer"
                      disabled={uploadingBanner}
                      onClick={() => document.getElementById('banner-upload')?.click()}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {uploadingBanner ? 'Uploading...' : 'Upload Banner'}
                    </Button>
                  </div>
                  {bannerPreview && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleBannerDelete}
                      disabled={uploadingBanner}
                    >
                      Remove Banner
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Server Management Section */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary-600" />
              Server Management
            </h3>
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Manage Servers</h4>
                    <p className="text-sm text-gray-500">Add and manage servers who can create orders</p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setShowNewServerModal(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Server
                  </Button>
                </div>

                <div className="space-y-2">
                  {servers.map(server => (
                    <div
                      key={server.id}
                      className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200"
                    >
                      <div>
                        <p className="font-medium">{server.name}</p>
                        <p className="text-sm text-gray-500">{server.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleResetServerPassword(server.id)}
                        >
                          Reset Password
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDeleteServer(server.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* New Server Modal */}
          {showNewServerModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg max-w-md w-full p-6">
                <h2 className="text-xl font-bold mb-4">Add New Server</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      value={newServer.name}
                      onChange={(e) => setNewServer(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-md"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={newServer.email}
                      onChange={(e) => setNewServer(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-md"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      value={newServer.password}
                      onChange={(e) => setNewServer(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-md"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-4 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setShowNewServerModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddServer}
                    disabled={!newServer.name || !newServer.email || !newServer.password}
                  >
                    Add Server
                  </Button>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-gray-500" />
                  Restaurant Name
                </label>
                <input
                  type="text"
                  id="name"
                  className="block w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  placeholder="Enter restaurant name"
                  {...register('name', { required: 'Name is required' })}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  className="block w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  placeholder="restaurant@example.com"
                  {...register('email', {
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-500" />
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  className="block w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  placeholder="+1 (555) 000-0000"
                  {...register('phone')}
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="opening_hours" className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  Opening Hours
                </label>
                <input
                  type="text"
                  id="opening_hours"
                  className="block w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  placeholder="Mon-Fri: 9AM-10PM, Sat-Sun: 10AM-11PM"
                  {...register('opening_hours')}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-500" />
                Address
              </label>
              <input
                type="text"
                id="address"
                className="block w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                placeholder="123 Restaurant Street, City, State, ZIP"
                {...register('address')}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                rows={4}
                className="block w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors resize-none"
                placeholder="Tell customers about your restaurant, cuisine, atmosphere, and what makes it special..."
                {...register('description')}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="facebook_url" className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                <Facebook className="w-4 h-4 text-gray-500" />
                Facebook Page URL
              </label>
              <input
                type="url"
                id="facebook_url"
                className="block w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                placeholder="https://facebook.com/your-restaurant"
                {...register('facebook_url')}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="instagram_url" className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                <Instagram className="w-4 h-4 text-gray-500" />
                Instagram Profile URL
              </label>
              <input
                type="url"
                id="instagram_url"
                className="block w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                placeholder="https://instagram.com/your-restaurant"
                {...register('instagram_url')}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="google_maps_url" className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                <Map className="w-4 h-4 text-gray-500" />
                Google Maps Location
              </label>
              <div className="space-y-1">
                <input
                  type="url"
                  id="google_maps_url"
                  className="block w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  placeholder="https://maps.google.com/?q=your-restaurant-address"
                  {...register('google_maps_url')}
                />
                <p className="text-xs text-gray-500">
                  Paste the Google Maps URL of your restaurant location. You can get this by searching your location on Google Maps and clicking "Share" → "Copy link".
                </p>
              </div>
            </div>
            
            <div className="flex justify-end pt-4 border-t border-gray-200">
              <Button type="submit" isLoading={loading} className="min-w-[120px]">
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Settings; 