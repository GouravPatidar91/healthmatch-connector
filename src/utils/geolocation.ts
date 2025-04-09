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
 * Get nearby cities based on coordinates
 * This is a simple implementation that returns predefined cities
 */
export const getNearbyCities = (latitude: number, longitude: number): string[] => {
  // This is a mock implementation
  // In a real application, you would use a geospatial database or API
  // to determine nearby cities based on coordinates
  
  // For simplicity, we'll just return cities based on quadrants
  if (latitude > 0 && longitude > 0) return ['New York', 'Boston', 'Philadelphia'];
  if (latitude > 0 && longitude < 0) return ['San Francisco', 'Los Angeles', 'Seattle'];
  if (latitude < 0 && longitude > 0) return ['Sydney', 'Melbourne', 'Brisbane'];
  if (latitude < 0 && longitude < 0) return ['Buenos Aires', 'Santiago', 'Lima'];
  
  return ['London', 'Paris', 'Tokyo', 'Singapore', 'Dubai'];
};

/**
 * Get world cities
 * Returns a list of major world cities
 */
export const getWorldCities = (): string[] => {
  return [
    'Abu Dhabi', 'Amsterdam', 'Athens', 'Auckland', 'Bangkok', 'Barcelona', 
    'Beijing', 'Berlin', 'Boston', 'Brussels', 'Buenos Aires', 'Cairo', 'Cape Town', 
    'Chicago', 'Copenhagen', 'Dallas', 'Delhi', 'Dubai', 'Dublin', 'Frankfurt', 
    'Geneva', 'Hong Kong', 'Houston', 'Istanbul', 'Jakarta', 'Johannesburg', 
    'Kuala Lumpur', 'Lagos', 'Las Vegas', 'Lisbon', 'London', 'Los Angeles', 
    'Madrid', 'Manila', 'Melbourne', 'Mexico City', 'Miami', 'Milan', 'Moscow', 
    'Mumbai', 'Munich', 'Nairobi', 'New York', 'Oslo', 'Paris', 'Prague', 
    'Rio de Janeiro', 'Rome', 'San Francisco', 'Santiago', 'São Paulo', 'Seoul', 
    'Shanghai', 'Singapore', 'Stockholm', 'Sydney', 'Taipei', 'Tel Aviv', 'Tokyo', 
    'Toronto', 'Vancouver', 'Vienna', 'Warsaw', 'Washington D.C.', 'Zurich'
  ];
};

/**
 * Find user's closest city
 */
export const getUserCity = async (): Promise<string | null> => {
  try {
    const position = await getCurrentPosition();
    const { latitude, longitude } = position.coords;
    const cities = getNearbyCities(latitude, longitude);
    
    // Return the first city (closest)
    return cities.length > 0 ? cities[0] : null;
  } catch (error) {
    console.error('Error getting user city:', error);
    return null;
  }
};

// Keeping this for backward compatibility
export const getNearbyRegions = getNearbyCities;

// Keeping this for backward compatibility
export const getUserRegion = getUserCity;
