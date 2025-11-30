/**
 * Distance-based charge calculation service
 * Calculates handling charges and delivery fees based on distance
 */

/**
 * Calculate handling charges (platform fee) based on distance
 * 0-2km: ₹20 | 2-5km: ₹30 | 5-8km: ₹40 | 8+km: ₹50
 */
export function calculateHandlingCharges(distanceKm: number): number {
  if (distanceKm <= 2) return 20;
  if (distanceKm <= 5) return 30;
  if (distanceKm <= 8) return 40;
  return 50;
}

/**
 * Calculate delivery fee (for delivery partner) based on distance
 * 0-2km: ₹30 | 2-5km: ₹50 | 5-8km: ₹70 | 8+km: ₹100
 */
export function calculateDeliveryFee(distanceKm: number): number {
  if (distanceKm <= 2) return 30;
  if (distanceKm <= 5) return 50;
  if (distanceKm <= 8) return 70;
  return 100;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculate all order charges based on vendor and customer locations
 */
export function calculateOrderCharges(
  vendorLat: number,
  vendorLng: number,
  customerLat: number,
  customerLng: number
): {
  handlingCharges: number;
  deliveryFee: number;
  distance: number;
} {
  const distance = calculateDistance(vendorLat, vendorLng, customerLat, customerLng);
  const handlingCharges = calculateHandlingCharges(distance);
  const deliveryFee = calculateDeliveryFee(distance);

  return {
    handlingCharges,
    deliveryFee,
    distance: Math.round(distance * 10) / 10, // Round to 1 decimal
  };
}
