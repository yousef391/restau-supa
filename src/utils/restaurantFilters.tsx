// Example function to fetch restaurants by type
import { supabase } from "../lib/supabase";
import { Restaurant, RestaurantType } from "../types";

/**
 * Fetches restaurants of a specific type
 * @param type The restaurant type to filter by ('restaurant' or 'coffee')
 * @returns An array of restaurants of the specified type
 */
export async function fetchRestaurantsByType(
  type: RestaurantType["type"]
): Promise<Restaurant[]> {
  try {
    const { data, error } = await supabase
      .from("restaurants")
      .select("*")
      .eq("type", type);

    if (error) {
      throw error;
    }

    if (!data) {
      return [];
    }

    // Transform the raw data to match the Restaurant type
    return data.map((item) => ({
      id: item.id,
      name: item.name,
      slug: item.slug,
      description: item.description,
      logoUrl: item.logo_url,
      bannerUrl: item.banner_url,
      ownerId: item.owner_id,
      updatedAt: item.updated_at,
      type: item.type,
      created_at: item.created_at,
      updated_at: item.updated_at,
      email: item.email,
      address: item.address,
      banner_url: item.banner_url,
      phone: item.phone,
      opening_hours: item.opening_hours,
    }));
  } catch (error) {
    console.error(`Error fetching ${type} places:`, error);
    return [];
  }
}

/**
 * Example function to display a list of coffee shops
 */
export async function listCoffeeShops() {
  const coffeeShops = await fetchRestaurantsByType(
    "coffee" as RestaurantType["type"]
  );

  return (
    <div>
      <h1>Coffee Shops</h1>
      <ul>
        {coffeeShops.map((shop) => (
          <li key={shop.id}>
            <a href={`/c/${shop.slug}`}>{shop.name}</a>
            {shop.description && <p>{shop.description}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Example function to display a list of restaurants
 */
export async function listRestaurants() {
  const restaurants = await fetchRestaurantsByType(
    "restaurant" as RestaurantType["type"]
  );

  return (
    <div>
      <h1>Restaurants</h1>
      <ul>
        {restaurants.map((restaurant) => (
          <li key={restaurant.id}>
            <a href={`/r/${restaurant.slug}`}>{restaurant.name}</a>
            {restaurant.description && <p>{restaurant.description}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}
