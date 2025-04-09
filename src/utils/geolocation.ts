
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

/**
 * Get nearby regions based on coordinates
 * This is a simple implementation that returns predefined regions
 */
export const getNearbyRegions = (latitude: number, longitude: number): string[] => {
  // This is a mock implementation
  // In a real application, you might use a geospatial database or API
  // to determine nearby regions based on coordinates
  
  // For simplicity, we'll just return regions based on quadrants
  if (latitude > 0 && longitude > 0) return ['North', 'East', 'Central'];
  if (latitude > 0 && longitude < 0) return ['North', 'West', 'Central'];
  if (latitude < 0 && longitude > 0) return ['South', 'East', 'Central'];
  if (latitude < 0 && longitude < 0) return ['South', 'West', 'Central'];
  
  return ['Central', 'North', 'South', 'East', 'West'];
};

/**
 * Find user's closest region
 */
export const getUserRegion = async (): Promise<string | null> => {
  try {
    const position = await getCurrentPosition();
    const { latitude, longitude } = position.coords;
    const regions = getNearbyRegions(latitude, longitude);
    
    // Return the first region (closest)
    return regions.length > 0 ? regions[0] : null;
  } catch (error) {
    console.error('Error getting user region:', error);
    return null;
  }
};
