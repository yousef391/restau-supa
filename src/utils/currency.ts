// Currency formatting utility functions

// Format price in DZD (Algerian Dinar)
export const formatPrice = (price: number): string => {
  const formattedNumber = new Intl.NumberFormat('en-DZ', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price);
  
  return `${formattedNumber} DZD`;
};

// Format price without currency symbol
export const formatPriceWithoutSymbol = (price: number): string => {
  return new Intl.NumberFormat('en-DZ', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price);
}; 