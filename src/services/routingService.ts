// Service for fetching actual road routes using OSRM (Open Source Routing Machine)
export const routingService = {
  /**
   * Fetch actual road route from OSRM API
   * @param start Starting coordinates {lat, lng}
   * @param end Ending coordinates {lat, lng}
   * @returns Array of [lat, lng] coordinates representing the route
   */
  async getRoute(
    start: { lat: number; lng: number },
    end: { lat: number; lng: number }
  ): Promise<[number, number][]> {
    try {
      // Use OSRM demo server (for production, consider hosting your own OSRM instance)
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`
      );
      
      if (!response.ok) {
        console.error('OSRM API error:', response.statusText);
        return [];
      }
      
      const data = await response.json();
      
      if (data.routes && data.routes[0] && data.routes[0].geometry) {
        // Convert GeoJSON coordinates [lng, lat] to Leaflet format [lat, lng]
        const coordinates = data.routes[0].geometry.coordinates.map(
          (coord: [number, number]) => [coord[1], coord[0]] as [number, number]
        );
        return coordinates;
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching route:', error);
      return [];
    }
  },

  /**
   * Get route distance and duration from OSRM
   */
  async getRouteInfo(
    start: { lat: number; lng: number },
    end: { lat: number; lng: number }
  ): Promise<{ distance: number; duration: number } | null> {
    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=false`
      );
      
      if (!response.ok) {
        return null;
      }
      
      const data = await response.json();
      
      if (data.routes && data.routes[0]) {
        return {
          distance: data.routes[0].distance / 1000, // Convert meters to km
          duration: data.routes[0].duration / 60, // Convert seconds to minutes
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching route info:', error);
      return null;
    }
  }
};
