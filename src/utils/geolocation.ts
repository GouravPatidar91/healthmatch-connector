
/**
 * Get the current position of the user
 * Returns a promise that resolves to a GeolocationPosition object
 */
export const getCurrentPosition = (): Promise<GeolocationPosition> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve(position);
      },
      (error) => {
        reject(error);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  });
};

/**
 * Geocode an address to get latitude and longitude
 * This is a simple implementation. For production, use a proper geocoding service.
 */
export const geocodeAddress = async (address: string): Promise<{ latitude: number, longitude: number }> => {
  try {
    // For demo purposes, return a random location near NYC
    // In a real application, you would use a geocoding service like Google Maps, MapBox, etc.
    const baseLat = 40.7128;
    const baseLng = -74.0060;
    
    // Add some randomness to simulate different locations
    const latitude = baseLat + (Math.random() - 0.5) * 0.1;
    const longitude = baseLng + (Math.random() - 0.5) * 0.1;
    
    return { latitude, longitude };
  } catch (error) {
    console.error('Error geocoding address:', error);
    throw new Error('Failed to geocode address');
  }
};
