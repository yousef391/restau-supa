import { Restaurant } from '../types';

/**
 * Generates the correct URL path for a restaurant based on its type
 * @param slug The restaurant slug
 * @param type The restaurant type ('restaurant' or 'coffee')
 * @returns The correct URL path for the restaurant
 */
export function getRestaurantUrl(slug: string, type: Restaurant['type'] = 'restaurant'): string {
  const prefix = type === 'coffee' ? 'c' : 'r';
  return `/${prefix}/${slug}`;
}
