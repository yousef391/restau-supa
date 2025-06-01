import { useNavigate } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '../../store/cartStore';
import { formatPrice } from '../../utils/currency';

interface CartButtonProps {
  restaurantSlug: string;
}

const CartButton = ({ restaurantSlug }: CartButtonProps) => {
  const navigate = useNavigate();
  const { items, getTotal } = useCartStore();
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);
  
  if (itemCount === 0) return null;
  
  return (
    <AnimatePresence>
      <motion.div
        className="fixed bottom-4 left-0 right-0 z-50 mx-auto w-max"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 200 }}
      >
        <button
          onClick={() => navigate(`/r/${restaurantSlug}/cart`)}
          className="flex items-center gap-2 rounded-full bg-primary-500 px-4 py-3 text-white shadow-lg transition-transform hover:scale-105"
        >
          <div className="relative">
            <ShoppingCart size={20} />
            <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-secondary-500 text-xs font-bold">
              {itemCount}
            </span>
          </div>
          <span className="font-medium">
            {formatPrice(getTotal())}
          </span>
        </button>
      </motion.div>
    </AnimatePresence>
  );
};

export default CartButton;