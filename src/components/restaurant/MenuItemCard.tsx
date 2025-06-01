import { motion } from 'framer-motion';
import { ShoppingCart, Plus, Minus } from 'lucide-react';
import { useState } from 'react';
import { MenuItem } from '../../types';
import { useCartStore } from '../../store/cartStore';
import Button from '../ui/Button';
import { formatPrice } from '../../utils/currency';

interface MenuItemCardProps {
  item: MenuItem;
}

const MenuItemCard = ({ item }: MenuItemCardProps) => {
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const { addItem } = useCartStore();

  const handleAddToCart = () => {
    addItem(item, quantity, notes.trim() || null);
    setQuantity(1);
    setNotes('');
    setIsExpanded(false);
  };

  const increaseQuantity = () => setQuantity(prev => prev + 1);
  const decreaseQuantity = () => setQuantity(prev => (prev > 1 ? prev - 1 : 1));

  return (
    <motion.div 
      className="card overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      layout
    >
      <div className="flex gap-3">
        {item.imageUrl ? (
          <img 
            src={item.imageUrl} 
            alt={item.name} 
            className="h-24 w-24 rounded-md object-cover"
          />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-md bg-gray-200">
            <span className="text-gray-400">No image</span>
          </div>
        )}
        <div className="flex flex-1 flex-col">
          <h3 className="text-lg font-medium">{item.name}</h3>
          {item.description && (
            <p className="line-clamp-2 text-sm text-gray-600">{item.description}</p>
          )}
          <div className="mt-auto flex items-center justify-between">
            <span className="font-medium text-primary-500">{formatPrice(item.price)}</span>
            {!isExpanded && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setIsExpanded(true)}
                icon={<ShoppingCart size={16} />}
              >
                Add
              </Button>
            )}
          </div>
        </div>
      </div>

      {isExpanded && (
        <motion.div 
          className="mt-3 border-t pt-3"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="mb-3">
            <label htmlFor="notes" className="mb-1 block text-sm font-medium text-gray-700">
              Special requests (optional)
            </label>
            <textarea
              id="notes"
              rows={2}
              className="input"
              placeholder="Any special requests?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 rounded-md border border-gray-300 p-1">
              <button 
                className="rounded-md p-1 hover:bg-gray-100"
                onClick={decreaseQuantity}
              >
                <Minus size={16} />
              </button>
              <span className="min-w-8 text-center">{quantity}</span>
              <button 
                className="rounded-md p-1 hover:bg-gray-100"
                onClick={increaseQuantity}
              >
                <Plus size={16} />
              </button>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsExpanded(false)}
              >
                Cancel
              </Button>
              <Button 
                variant="primary" 
                size="sm"
                onClick={handleAddToCart}
                className="animate-plate-to-table"
              >
                Add to cart
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default MenuItemCard;