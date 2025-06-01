import { 
  Coffee, 
  Utensils, 
  Pizza, 
  Salad, 
  Soup, 
  IceCream, 
  Wine, 
  Beer, 
  Cookie, 
  Sandwich,
  Cake,
  Croissant,
  Milk,
  Droplet,
  Coffee as CoffeeIcon,
  IceCream as IceCreamIcon,
  Cookie as CookieIcon,
  Cake as CakeIcon,
  Croissant as CroissantIcon,
  Sandwich as SandwichIcon,
  Salad as SaladIcon,
  Soup as SoupIcon,
  Pizza as PizzaIcon,
  Utensils as UtensilsIcon
} from 'lucide-react';

export interface CategoryIcon {
  id: string;
  name: string;
  icon: any;
  type: 'restaurant' | 'coffee' | 'both';
}

export const categoryIcons: CategoryIcon[] = [
  // Restaurant Icons
  {
    id: 'main-course',
    name: 'Main Course',
    icon: UtensilsIcon,
    type: 'restaurant'
  },
  {
    id: 'pizza',
    name: 'Pizza',
    icon: PizzaIcon,
    type: 'restaurant'
  },
  {
    id: 'salad',
    name: 'Salad',
    icon: SaladIcon,
    type: 'both'
  },
  {
    id: 'soup',
    name: 'Soup',
    icon: SoupIcon,
    type: 'restaurant'
  },
  {
    id: 'sandwich',
    name: 'Sandwich',
    icon: SandwichIcon,
    type: 'both'
  },
  {
    id: 'dessert',
    name: 'Dessert',
    icon: IceCreamIcon,
    type: 'both'
  },
  {
    id: 'wine',
    name: 'Wine',
    icon: Wine,
    type: 'restaurant'
  },
  {
    id: 'beer',
    name: 'Beer',
    icon: Beer,
    type: 'restaurant'
  },

  // Coffee Shop Icons
  {
    id: 'coffee',
    name: 'Coffee',
    icon: CoffeeIcon,
    type: 'coffee'
  },
  {
    id: 'cake',
    name: 'Cake',
    icon: CakeIcon,
    type: 'coffee'
  },
  {
    id: 'croissant',
    name: 'Croissant',
    icon: CroissantIcon,
    type: 'coffee'
  },
  {
    id: 'cookie',
    name: 'Cookie',
    icon: CookieIcon,
    type: 'coffee'
  },
  {
    id: 'water',
    name: 'Water',
    icon: Droplet,
    type: 'both'
  }
]; 