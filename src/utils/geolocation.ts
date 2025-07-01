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
        let errorMessage = 'Location access denied';
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location access in your browser.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }
        reject(new Error(errorMessage));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  });
};

/**
 * Geocode an address to get latitude and longitude
 * This uses a reverse geocoding approach for better city detection
 */
export const geocodeAddress = async (address: string): Promise<{ latitude: number, longitude: number }> => {
  try {
    // First try to get user's current location for more accurate results
    try {
      const position = await getCurrentPosition();
      const { latitude, longitude } = position.coords;
      
      // If we have location access, return actual coordinates
      return { latitude, longitude };
    } catch (locationError) {
      console.log('Using fallback geocoding for address:', address);
    }
    
    // Fallback: Use city-based coordinate mapping
    const cityCoordinates = getCityCoordinates(address);
    if (cityCoordinates) {
      return cityCoordinates;
    }
    
    // Final fallback: Default to a major city
    return { latitude: 28.7041, longitude: 77.1025 }; // Delhi
  } catch (error) {
    console.error('Error geocoding address:', error);
    throw new Error('Failed to geocode address');
  }
};

/**
 * Get coordinates for major cities including extensive Indian cities
 */
const getCityCoordinates = (cityName: string): { latitude: number, longitude: number } | null => {
  const cityMap: Record<string, { latitude: number, longitude: number }> = {
    // Major Indian Cities
    'Mumbai': { latitude: 19.0760, longitude: 72.8777 },
    'Delhi': { latitude: 28.7041, longitude: 77.1025 },
    'New Delhi': { latitude: 28.6139, longitude: 77.2090 },
    'Bangalore': { latitude: 12.9716, longitude: 77.5946 },
    'Bengaluru': { latitude: 12.9716, longitude: 77.5946 },
    'Hyderabad': { latitude: 17.3850, longitude: 78.4867 },
    'Ahmedabad': { latitude: 23.0225, longitude: 72.5714 },
    'Chennai': { latitude: 13.0827, longitude: 80.2707 },
    'Kolkata': { latitude: 22.5726, longitude: 88.3639 },
    'Surat': { latitude: 21.1702, longitude: 72.8311 },
    'Pune': { latitude: 18.5204, longitude: 73.8567 },
    'Jaipur': { latitude: 26.9124, longitude: 75.7873 },
    'Lucknow': { latitude: 26.8467, longitude: 80.9462 },
    'Kanpur': { latitude: 26.4499, longitude: 80.3319 },
    'Nagpur': { latitude: 21.1458, longitude: 79.0882 },
    'Indore': { latitude: 22.7196, longitude: 75.8577 },
    'Thane': { latitude: 19.2183, longitude: 72.9781 },
    'Bhopal': { latitude: 23.2599, longitude: 77.4126 },
    'Visakhapatnam': { latitude: 17.6868, longitude: 83.2185 },
    'Pimpri-Chinchwad': { latitude: 18.6298, longitude: 73.7997 },
    'Patna': { latitude: 25.5941, longitude: 85.1376 },
    'Vadodara': { latitude: 22.3072, longitude: 73.1812 },
    'Ghaziabad': { latitude: 28.6692, longitude: 77.4538 },
    'Ludhiana': { latitude: 30.9010, longitude: 75.8573 },
    'Agra': { latitude: 27.1767, longitude: 78.0081 },
    'Nashik': { latitude: 19.9975, longitude: 73.7898 },
    'Faridabad': { latitude: 28.4089, longitude: 77.3178 },
    'Meerut': { latitude: 28.9845, longitude: 77.7064 },
    'Rajkot': { latitude: 22.3039, longitude: 70.8022 },
    'Kalyan-Dombivli': { latitude: 19.2403, longitude: 73.1305 },
    'Vasai-Virar': { latitude: 19.4912, longitude: 72.8054 },
    'Varanasi': { latitude: 25.3176, longitude: 82.9739 },
    'Srinagar': { latitude: 34.0837, longitude: 74.7973 },
    'Aurangabad': { latitude: 19.8762, longitude: 75.3433 },
    'Dhanbad': { latitude: 23.7957, longitude: 86.4304 },
    'Amritsar': { latitude: 31.6340, longitude: 74.8723 },
    'Navi Mumbai': { latitude: 19.0330, longitude: 73.0297 },
    'Allahabad': { latitude: 25.4358, longitude: 81.8463 },
    'Prayagraj': { latitude: 25.4358, longitude: 81.8463 },
    'Ranchi': { latitude: 23.3441, longitude: 85.3096 },
    'Howrah': { latitude: 22.5958, longitude: 88.2636 },
    'Coimbatore': { latitude: 11.0168, longitude: 76.9558 },
    'Jabalpur': { latitude: 23.1815, longitude: 79.9864 },
    'Gwalior': { latitude: 26.2183, longitude: 78.1828 },
    'Vijayawada': { latitude: 16.5062, longitude: 80.6480 },
    'Jodhpur': { latitude: 26.2389, longitude: 73.0243 },
    'Madurai': { latitude: 9.9252, longitude: 78.1198 },
    'Raipur': { latitude: 21.2514, longitude: 81.6296 },
    'Kota': { latitude: 25.2138, longitude: 75.8648 },
    'Chandigarh': { latitude: 30.7333, longitude: 76.7794 },
    'Guwahati': { latitude: 26.1445, longitude: 91.7362 },
    'Solapur': { latitude: 17.6599, longitude: 75.9064 },
    'Hubli-Dharwad': { latitude: 15.3647, longitude: 75.1240 },
    'Bareilly': { latitude: 28.3670, longitude: 79.4304 },
    'Moradabad': { latitude: 28.8386, longitude: 78.7733 },
    'Mysore': { latitude: 12.2958, longitude: 76.6394 },
    'Mysuru': { latitude: 12.2958, longitude: 76.6394 },
    'Gurugram': { latitude: 28.4595, longitude: 77.0266 },
    'Gurgaon': { latitude: 28.4595, longitude: 77.0266 },
    'Aligarh': { latitude: 27.8974, longitude: 78.0880 },
    'Jalandhar': { latitude: 31.3260, longitude: 75.5762 },
    'Tiruchirappalli': { latitude: 10.7905, longitude: 78.7047 },
    'Trichy': { latitude: 10.7905, longitude: 78.7047 },
    'Bhubaneswar': { latitude: 20.2961, longitude: 85.8245 },
    'Salem': { latitude: 11.6643, longitude: 78.1460 },
    'Warangal': { latitude: 17.9689, longitude: 79.5941 },
    'Guntur': { latitude: 16.3067, longitude: 80.4365 },
    'Bhiwandi': { latitude: 19.3002, longitude: 73.0630 },
    'Saharanpur': { latitude: 29.9680, longitude: 77.5552 },
    'Gorakhpur': { latitude: 26.7606, longitude: 83.3732 },
    'Bikaner': { latitude: 28.0229, longitude: 73.3119 },
    'Amravati': { latitude: 20.9374, longitude: 77.7796 },
    'Noida': { latitude: 28.5355, longitude: 77.3910 },
    'Jamshedpur': { latitude: 22.8046, longitude: 86.2029 },
    'Bhilai Nagar': { latitude: 21.1938, longitude: 81.3509 },
    'Cuttack': { latitude: 20.4625, longitude: 85.8828 },
    'Firozabad': { latitude: 27.1592, longitude: 78.3957 },
    'Kochi': { latitude: 9.9312, longitude: 76.2673 },
    'Cochin': { latitude: 9.9312, longitude: 76.2673 },
    'Bhavnagar': { latitude: 21.7645, longitude: 72.1519 },
    'Dehradun': { latitude: 30.3165, longitude: 78.0322 },
    'Durgapur': { latitude: 23.4800, longitude: 87.3119 },
    'Asansol': { latitude: 23.6739, longitude: 86.9524 },
    'Rourkela': { latitude: 22.2604, longitude: 84.8536 },
    'Nanded': { latitude: 19.1383, longitude: 77.2975 },
    'Kolhapur': { latitude: 16.7050, longitude: 74.2433 },
    'Ajmer': { latitude: 26.4499, longitude: 74.6399 },
    'Akola': { latitude: 20.7002, longitude: 77.0082 },
    'Gulbarga': { latitude: 17.3297, longitude: 76.8343 },
    'Jamnagar': { latitude: 22.4707, longitude: 70.0577 },
    'Ujjain': { latitude: 23.1765, longitude: 75.7885 },
    'Loni': { latitude: 28.7461, longitude: 77.2897 },
    'Siliguri': { latitude: 26.7271, longitude: 88.3953 },
    'Jhansi': { latitude: 25.4484, longitude: 78.5685 },
    'Ulhasnagar': { latitude: 19.2215, longitude: 73.1645 },
    'Jammu': { latitude: 32.7266, longitude: 74.8570 },
    'Sangli-Miraj & Kupwad': { latitude: 16.8524, longitude: 74.5815 },
    'Mangalore': { latitude: 12.9141, longitude: 74.8560 },
    'Erode': { latitude: 11.3410, longitude: 77.7172 },
    'Belgaum': { latitude: 15.8497, longitude: 74.4977 },
    'Ambattur': { latitude: 13.1143, longitude: 80.1548 },
    'Tirunelveli': { latitude: 8.7139, longitude: 77.7567 },
    'Malegaon': { latitude: 20.5579, longitude: 74.5287 },
    'Gaya': { latitude: 24.7914, longitude: 85.0002 },
    'Jalgaon': { latitude: 21.0077, longitude: 75.5626 },
    'Udaipur': { latitude: 24.5714, longitude: 73.6953 },
    'Maheshtala': { latitude: 22.5098, longitude: 88.2490 },
    
    // International Cities (keeping some for completeness)
    'New York': { latitude: 40.7128, longitude: -74.0060 },
    'Los Angeles': { latitude: 34.0522, longitude: -118.2437 },
    'London': { latitude: 51.5074, longitude: -0.1278 },
    'Paris': { latitude: 48.8566, longitude: 2.3522 },
    'Tokyo': { latitude: 35.6762, longitude: 139.6503 },
    'Sydney': { latitude: -33.8688, longitude: 151.2093 },
    'Dubai': { latitude: 25.2048, longitude: 55.2708 },
    'Singapore': { latitude: 1.3521, longitude: 103.8198 }
  };
  
  // Try exact match first
  if (cityMap[cityName]) {
    return cityMap[cityName];
  }
  
  // Try case-insensitive match
  const normalizedCity = cityName.toLowerCase();
  for (const [city, coords] of Object.entries(cityMap)) {
    if (city.toLowerCase() === normalizedCity) {
      return coords;
    }
  }
  
  // Try partial match
  for (const [city, coords] of Object.entries(cityMap)) {
    if (city.toLowerCase().includes(normalizedCity) || normalizedCity.includes(city.toLowerCase())) {
      return coords;
    }
  }
  
  return null;
};

/**
 * Get nearby cities based on coordinates with improved accuracy
 */
export const getNearbyCities = (latitude: number, longitude: number): string[] => {
  const cities = [
    { name: 'New York', lat: 40.7128, lng: -74.0060 },
    { name: 'Los Angeles', lat: 34.0522, lng: -118.2437 },
    { name: 'Chicago', lat: 41.8781, lng: -87.6298 },
    { name: 'Houston', lat: 29.7604, lng: -95.3698 },
    { name: 'Phoenix', lat: 33.4484, lng: -112.0740 },
    { name: 'Philadelphia', lat: 39.9526, lng: -75.1652 },
    { name: 'San Antonio', lat: 29.4241, lng: -98.4936 },
    { name: 'San Diego', lat: 32.7157, lng: -117.1611 },
    { name: 'Dallas', lat: 32.7767, lng: -96.7970 },
    { name: 'San Jose', lat: 37.3382, lng: -121.8863 },
    { name: 'Austin', lat: 30.2672, lng: -97.7431 },
    { name: 'Jacksonville', lat: 30.3322, lng: -81.6557 },
    { name: 'San Francisco', lat: 37.7749, lng: -122.4194 },
    { name: 'Columbus', lat: 39.9612, lng: -82.9988 },
    { name: 'Indianapolis', lat: 39.7684, lng: -86.1581 },
    { name: 'Fort Worth', lat: 32.7555, lng: -97.3308 },
    { name: 'Charlotte', lat: 35.2271, lng: -80.8431 },
    { name: 'Seattle', lat: 47.6062, lng: -122.3321 },
    { name: 'Denver', lat: 39.7392, lng: -104.9903 },
    { name: 'Boston', lat: 42.3601, lng: -71.0589 },
    { name: 'Detroit', lat: 42.3314, lng: -83.0458 },
    { name: 'Nashville', lat: 36.1627, lng: -86.7816 },
    { name: 'Memphis', lat: 35.1495, lng: -90.0490 },
    { name: 'Portland', lat: 45.5152, lng: -122.6784 },
    { name: 'Oklahoma City', lat: 35.4676, lng: -97.5164 },
    { name: 'Las Vegas', lat: 36.1699, lng: -115.1398 },
    { name: 'Louisville', lat: 38.2527, lng: -85.7585 },
    { name: 'Baltimore', lat: 39.2904, lng: -76.6122 },
    { name: 'Milwaukee', lat: 43.0389, lng: -87.9065 },
    { name: 'Albuquerque', lat: 35.0844, lng: -106.6504 },
    { name: 'Tucson', lat: 32.2226, lng: -110.9747 },
    { name: 'Fresno', lat: 36.7378, lng: -119.7871 },
    { name: 'Sacramento', lat: 38.5816, lng: -121.4944 },
    { name: 'Mesa', lat: 33.4152, lng: -111.8315 },
    { name: 'Kansas City', lat: 39.0997, lng: -94.5786 },
    { name: 'Atlanta', lat: 33.7490, lng: -84.3880 },
    { name: 'Miami', lat: 25.7617, lng: -80.1918 },
    { name: 'Tampa', lat: 27.9506, lng: -82.4572 },
    { name: 'New Orleans', lat: 29.9511, lng: -90.0715 },
    { name: 'Cleveland', lat: 41.4993, lng: -81.6944 },
    { name: 'London', lat: 51.5074, lng: -0.1278 },
    { name: 'Paris', lat: 48.8566, lng: 2.3522 },
    { name: 'Tokyo', lat: 35.6762, lng: 139.6503 },
    { name: 'Sydney', lat: -33.8688, lng: 151.2093 },
    { name: 'Toronto', lat: 43.6532, lng: -79.3832 },
    { name: 'Berlin', lat: 52.5200, lng: 13.4050 },
    { name: 'Madrid', lat: 40.4168, lng: -3.7038 },
    { name: 'Rome', lat: 41.9028, lng: 12.4964 },
    { name: 'Amsterdam', lat: 52.3676, lng: 4.9041 },
    { name: 'Dubai', lat: 25.2048, lng: 55.2708 },
    { name: 'Singapore', lat: 1.3521, lng: 103.8198 }
  ];

  // Calculate distance using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Calculate distances and sort by proximity
  const citiesWithDistance = cities.map(city => ({
    ...city,
    distance: calculateDistance(latitude, longitude, city.lat, city.lng)
  }));

  // Sort by distance and return top 5 nearest cities
  return citiesWithDistance
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 5)
    .map(city => city.name);
};

/**
 * Get Indian cities, towns, and villages
 * Returns a comprehensive list of Indian locations
 */
export const getIndianCities = (): string[] => {
  return [
    // Major Metro Cities
    'Mumbai', 'Delhi', 'New Delhi', 'Bangalore', 'Bengaluru', 'Hyderabad', 'Ahmedabad', 'Chennai', 'Kolkata', 'Surat', 'Pune', 'Jaipur', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Thane', 'Bhopal', 'Visakhapatnam', 'Pimpri-Chinchwad', 'Patna', 'Vadodara', 'Ghaziabad', 'Ludhiana', 'Agra', 'Nashik', 'Faridabad', 'Meerut', 'Rajkot', 'Kalyan-Dombivli', 'Vasai-Virar', 'Varanasi', 'Srinagar', 'Aurangabad', 'Dhanbad', 'Amritsar', 'Navi Mumbai', 'Allahabad', 'Prayagraj', 'Ranchi', 'Howrah', 'Coimbatore', 'Jabalpur', 'Gwalior', 'Vijayawada', 'Jodhpur', 'Madurai', 'Raipur', 'Kota', 'Chandigarh', 'Guwahati', 'Solapur', 'Hubli-Dharwad', 'Bareilly', 'Moradabad', 'Mysore', 'Mysuru', 'Gurugram', 'Gurgaon', 'Aligarh', 'Jalandhar', 'Tiruchirappalli', 'Trichy', 'Bhubaneswar', 'Salem', 'Warangal', 'Guntur', 'Bhiwandi', 'Saharanpur', 'Gorakhpur', 'Bikaner', 'Amravati', 'Noida', 'Jamshedpur', 'Bhilai Nagar', 'Cuttack', 'Firozabad', 'Kochi', 'Cochin', 'Bhavnagar', 'Dehradun', 'Durgapur', 'Asansol', 'Rourkela', 'Nanded', 'Kolhapur', 'Ajmer', 'Akola', 'Gulbarga', 'Jamnagar', 'Ujjain', 'Loni', 'Siliguri', 'Jhansi', 'Ulhasnagar', 'Jammu', 'Sangli-Miraj & Kupwad', 'Mangalore', 'Erode', 'Belgaum', 'Ambattur', 'Tirunelveli', 'Malegaon', 'Gaya', 'Jalgaon', 'Udaipur', 'Maheshtala',
    
    // State Capitals and Important Cities
    'Gandhinagar', 'Panaji', 'Shimla', 'Itanagar', 'Dispur', 'Imphal', 'Shillong', 'Aizawl', 'Kohima', 'Gangtok', 'Agartala', 'Kavaratti',
    
    // Major Towns and Cities by State
    
    // Andhra Pradesh
    'Tirupati', 'Anantapur', 'Chittoor', 'Eluru', 'Kadapa', 'Kakinada', 'Kurnool', 'Machilipatnam', 'Nellore', 'Ongole', 'Rajahmundry', 'Srikakulam', 'Tadepalligudem', 'Tenali', 'Vizianagaram',
    
    // Arunachal Pradesh
    'Naharlagun', 'Pasighat', 'Bomdila', 'Tawang', 'Ziro', 'Along', 'Tezu', 'Khonsa',
    
    // Assam
    'Jorhat', 'Dibrugarh', 'Silchar', 'Tezpur', 'Nagaon', 'Tinsukia', 'Bongaigaon', 'Dhubri', 'North Lakhimpur', 'Karimganj', 'Sibsagar', 'Goalpara', 'Barpeta', 'Mangaldoi', 'Nalbari', 'Rangia', 'Marigaon', 'Haflong', 'Kokrajhar', 'Mushalpur',
    
    // Bihar
    'Darbhanga', 'Muzaffarpur', 'Purnia', 'Bhagalpur', 'Arrah', 'Begusarai', 'Katihar', 'Munger', 'Chhapra', 'Danapur', 'Bettiah', 'Saharsa', 'Hajipur', 'Sasaram', 'Dehri', 'Siwan', 'Motihari', 'Nawada', 'Bagaha', 'Buxar', 'Kishanganj', 'Sitamarhi', 'Jamalpur', 'Jehanabad', 'Aurangabad',
    
    // Chhattisgarh
    'Bilaspur', 'Korba', 'Durg', 'Rajnandgaon', 'Jagdalpur', 'Raigarh', 'Ambikapur', 'Mahasamund', 'Dhamtari', 'Chirmiri', 'Champa', 'Jashpur', 'Kanker', 'Akaltara', 'Dongargarh', 'Bhatapara', 'Baikunthpur', 'Ratanpur', 'Naila Janjgir', 'Tilda Newra', 'Mungeli', 'Pathalgaon', 'Raigarh', 'Sarangarh', 'Takhatpur',
    
    // Goa
    'Margao', 'Vasco da Gama', 'Mapusa', 'Ponda', 'Bicholim', 'Curchorem', 'Valpoi', 'Pernem', 'Cuncolim', 'Canacona', 'Quepem', 'Sanguem', 'Sanquelim', 'Sattari', 'Shiroda', 'Aldona', 'Assagao', 'Benaulim', 'Calangute', 'Candolim', 'Colva', 'Morjim', 'Arambol', 'Anjuna', 'Baga',
    
    // Gujarat
    'Anand', 'Bharuch', 'Bhuj', 'Gandhidham', 'Godhra', 'Junagadh', 'Mehsana', 'Morbi', 'Nadiad', 'Navsari', 'Palanpur', 'Patan', 'Porbandar', 'Surendranagar', 'Valsad', 'Veraval', 'Ankleshwar', 'Deesa', 'Jetpur', 'Kalol', 'Keshod', 'Khambhat', 'Mahuva', 'Mandvi', 'Modasa', 'Mundra', 'Okha', 'Palitana', 'Radhanpur', 'Salaya', 'Talaja', 'Una', 'Upleta', 'Vyara', 'Wankaner',
    
    // Haryana
    'Ambala', 'Bahadurgarh', 'Bhiwani', 'Faridabad', 'Fatehabad', 'Hisar', 'Jhajjar', 'Jind', 'Kaithal', 'Karnal', 'Kurukshetra', 'Mahendragarh', 'Mewat', 'Palwal', 'Panchkula', 'Panipat', 'Rewari', 'Rohtak', 'Sirsa', 'Sonipat', 'Thanesar', 'Yamunanagar', 'Ballabgarh', 'Charkhi Dadri', 'Dabwali', 'Ellenabad', 'Hansi', 'Hodal', 'Jakhal', 'Kalka', 'Ladwa', 'Mahendragarh', 'Narnaul', 'Nilokheri', 'Pehowa', 'Pinjore', 'Ratia', 'Safidon', 'Samalkha', 'Shahabad', 'Taraori', 'Tohana',
    
    // Himachal Pradesh
    'Dharamshala', 'Solan', 'Mandi', 'Palampur', 'Baddi', 'Nahan', 'Paonta Sahib', 'Sundernagar', 'Chamba', 'Una', 'Hamirpur', 'Bilaspur', 'Yol', 'Gagret', 'Nurpur', 'Kangra', 'Nagrota Bagwan', 'Jawalamukhi', 'Jogindernagar', 'Baijnath', 'Banjar', 'Bhuntar', 'Kullu', 'Manali', 'Keylong', 'Kaza', 'Reckong Peo', 'Kalpa', 'Sangla', 'Sarahan', 'Rampur', 'Rohru', 'Theog', 'Arki', 'Kandaghat', 'Kasauli', 'Parwanoo', 'Rajgarh', 'Renuka', 'Narkanda', 'Fagu', 'Kufri', 'Mashobra', 'Naldehra', 'Tattapani',
    
    // Jharkhand
    'Bokaro', 'Deoghar', 'Dhanbad', 'Giridih', 'Hazaribag', 'Medininagar', 'Phusro', 'Ramgarh', 'Jhumri Telaiya', 'Chatra', 'Chaibasa', 'Dumka', 'Godda', 'Gumla', 'Hunterganj', 'Jamtara', 'Khunti', 'Koderma', 'Latehar', 'Lohardaga', 'Pakur', 'Palamu', 'Rajmahal', 'Sahibganj', 'Seraikela', 'Simdega', 'Mihijam', 'Nirsa', 'Sindri', 'Tenu Dam-cum-Kathhara',
    
    // Karnataka
    'Bellary', 'Bijapur', 'Gulbarga', 'Hubli', 'Mangalore', 'Mysore', 'Shimoga', 'Tumkur', 'Belgaum', 'Davangere', 'Hospet', 'Gadag-Betageri', 'Robertson Pet', 'Bhadravati', 'Chitradurga', 'Hassan', 'Mandya', 'Raichur', 'Bidar', 'Bagalkot', 'Jamkhandi', 'Ranebennuru', 'Gangawati', 'Chikmagalur', 'Udupi', 'Karwar', 'Kolar', 'Mandya', 'Shivamogga', 'Tiptur', 'Arsikere', 'Channapatna', 'Doddaballapur', 'Gokak', 'Gubbi', 'Hassan', 'Hoskote', 'Karkala', 'Kundapura', 'Madhugiri', 'Malur', 'Ramanagara', 'Sidlaghatta', 'Srinivaspur', 'Tarikere', 'Yadgir',
    
    // Kerala
    'Thiruvananthapuram', 'Kollam', 'Pathanamthitta', 'Alappuzha', 'Kottayam', 'Idukki', 'Ernakulam', 'Thrissur', 'Palakkad', 'Malappuram', 'Kozhikode', 'Wayanad', 'Kannur', 'Kasaragod', 'Adoor', 'Kayamkulam', 'Nedumangad', 'Neyyattinkara', 'Paravur', 'Punalur', 'Chavakkad', 'Guruvayur', 'Kodungallur', 'Kunnamkulam', 'Mala', 'Thrippunithura', 'North Paravur', 'Aluva', 'Angamaly', 'Kalamassery', 'Kothamangalam', 'Muvattupuzha', 'Perumbavoor', 'Chalakudy', 'Irinjalakuda', 'Kodakara', 'Shoranur', 'Ottappalam', 'Pattambi', 'Cherpulassery', 'Kondotty', 'Koyilandy', 'Vadakara', 'Kalpetta', 'Mananthavady', 'Sulthan Bathery', 'Taliparamba', 'Payyannur', 'Kanhangad', 'Nileshwar',
    
    // Madhya Pradesh
    'Gwalior', 'Jabalpur', 'Ujjain', 'Sagar', 'Dewas', 'Satna', 'Indore', 'Burhanpur', 'Khandwa', 'Morena', 'Bhind', 'Guna', 'Shivpuri', 'Vidisha', 'Chhatarpur', 'Damoh', 'Mandsaur', 'Neemuch', 'Ratlam', 'Shajapur', 'Ashok Nagar', 'Balaghat', 'Betul', 'Datia', 'Katni', 'Narsinghpur', 'Raisen', 'Sehore', 'Seoni', 'Singrauli', 'Tikamgarh', 'Shahdol', 'Anuppur', 'Dindori', 'Mandla', 'Umaria', 'Dhar', 'Jhabua', 'Khargone', 'Alirajpur', 'Barwani', 'Chhindwara', 'Harda', 'Hoshangabad', 'Pandhurna', 'Multai', 'Pipariya', 'Itarsi', 'Bhopal', 'Sehore', 'Raisen',
    
    // Maharashtra
    'Nagpur', 'Pune', 'Mumbai', 'Nashik', 'Aurangabad', 'Solapur', 'Amravati', 'Kolhapur', 'Sangli', 'Akola', 'Latur', 'Dhule', 'Ahmednagar', 'Chandrapur', 'Parbhani', 'Jalgaon', 'Bhiwandi', 'Nanded', 'Malegaon', 'Yavatmal', 'Satara', 'Beed', 'Wardha', 'Osmanabad', 'Gondia', 'Bhandara', 'Washim', 'Hingoli', 'Gadchiroli', 'Buldhana', 'Jalna', 'Ratnagiri', 'Sindhudurg', 'Thane', 'Raigad', 'Alibag', 'Panvel', 'Badlapur', 'Ambarnath', 'Ulhasnagar', 'Dombivli', 'Kalyan', 'Mira-Bhayandar', 'Vasai-Virar', 'Nalasopara', 'Virar', 'Palghar', 'Dahanu', 'Talasari', 'Jawhar', 'Mokhada', 'Vikramgad', 'Wada', 'Shahapur', 'Karjat', 'Khopoli', 'Pen', 'Uran', 'Roha', 'Sudhagad', 'Tala', 'Shrivardhan', 'Dapoli', 'Guhagar', 'Chiplun', 'Khed', 'Lanja', 'Rajapur', 'Sawantwadi', 'Kudal', 'Malvan', 'Vengurla', 'Dodamarg',
    
    // Manipur
    'Imphal', 'Thoubal', 'Bishnupur', 'Churachandpur', 'Senapati', 'Ukhrul', 'Chandel', 'Tamenglong', 'Jiribam', 'Kangpokpi', 'Tengnoupal', 'Pherzawl', 'Noney', 'Kamjong', 'Kakching', 'Lilong', 'Mayang Imphal', 'Nambol', 'Wangjing', 'Yairipok', 'Moreh', 'Mao', 'Senapati', 'Kangpokpi', 'Saitu Gamphazol', 'Henglep', 'Kalapahar', 'Lamphel', 'Sagolband', 'Wangkhei', 'Singjamei',
    
    // Meghalaya
    'Shillong', 'Tura', 'Cherrapunji', 'Mawkyrwat', 'Nongpoh', 'Baghmara', 'Ampati', 'Resubelpara', 'Williamnagar', 'Jowai', 'Khliehriat', 'Nongstoin', 'Mawsynram', 'Dawki', 'Mairang', 'Nongpoh', 'Byrnihat', 'Umiam', 'Barapani', 'Sohra', 'Mawlynnong', 'Nongriat', 'Laitkyrhong', 'Mawphlang',
    
    // Mizoram
    'Aizawl', 'Lunglei', 'Saiha', 'Champhai', 'Kolasib', 'Lawngtlai', 'Mamit', 'Serchhip', 'Hnahthial', 'Saitual', 'Khawzawl', 'Zawlnuam', 'Thenzawl', 'Darlawn', 'North Vanlaiphai', 'Tlabung', 'Bairabi', 'Vairengte', 'Bilkhawthlir', 'Bualpui', 'Chanmari', 'Chawngte', 'Demagiri', 'Haulawng', 'Khawhai', 'Khuangchera', 'Lengpui', 'Ngopa', 'Phullen', 'Ratu', 'Sakawrdai', 'Seling', 'Tuipang', 'Tuirial', 'Vaphai',
    
    // Nagaland
    'Kohima', 'Dimapur', 'Mokokchung', 'Tuensang', 'Wokha', 'Zunheboto', 'Phek', 'Kiphire', 'Longleng', 'Peren', 'Mon', 'Chumukedima', 'Tseminyu', 'Niuland', 'Bhandari', 'Tizit', 'Shamator', 'Changtongya', 'Aboi', 'Chen', 'Longkhim', 'Noksen', 'Ralan', 'Tuli', 'Ungma', 'Arkakong', 'Chare', 'Longjang', 'Longsa', 'Medziphema', 'Pfutsero', 'Satakha', 'Seyochung', 'Suruhuto', 'Tening', 'Tuophema', 'Wokha', 'Yelimno',
    
    // Odisha
    'Bhubaneswar', 'Cuttack', 'Rourkela', 'Brahmapur', 'Sambalpur', 'Puri', 'Balasore', 'Bhadrak', 'Baripada', 'Jharsuguda', 'Jeypore', 'Barbil', 'Khordha', 'Balangir', 'Rayagada', 'Koraput', 'Nabarangpur', 'Malkangiri', 'Nuapada', 'Kalahandi', 'Kandhamal', 'Gajapati', 'Ganjam', 'Nayagarh', 'Kendrapara', 'Jagatsinghapur', 'Dhenkanal', 'Angul', 'Keonjhar', 'Mayurbhanj', 'Sundargarh', 'Deogarh', 'Jajpur', 'Kendujhar', 'Paradip', 'Konark', 'Gopalpur', 'Chandipur', 'Talcher', 'Rajgangpur', 'Rourkela', 'Sunabeda', 'Titlagarh', 'Phulbani', 'Bhawanipatna', 'Gunupur', 'Parlakhemundi', 'Berhampur', 'Chhatrapur', 'Hinjilicut', 'Polasara', 'Purusottampur', 'Sanakhemundi', 'Sorada', 'Khallikote', 'Digapahandi', 'Ganjam', 'Aska', 'Kabisuryanagar', 'Bhanjanagar',
    
    // Punjab
    'Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Mohali', 'Firozpur', 'Batala', 'Pathankot', 'Moga', 'Abohar', 'Malerkotla', 'Khanna', 'Phagwara', 'Muktsar', 'Barnala', 'Rajpura', 'Hoshiarpur', 'Kapurthala', 'Faridkot', 'Sunam', 'Sangrur', 'Fazilka', 'Gurdaspur', 'Kharar', 'Gobindgarh', 'Mansa', 'Malout', 'Nabha', 'Tarn Taran', 'Jagraon', 'Adampur', 'Nakodar', 'Nangal', 'Zirakpur', 'Kot Kapura', 'Ropar', 'Samana', 'Shahkot', 'Sultanpur Lodhi', 'Talwandi Sabo', 'Tapa', 'Raikot', 'Budhlada', 'Chandigarh', 'Dera Bassi', 'Dhuri', 'Dinanagar', 'Doraha', 'Gidderbaha', 'Jandiala', 'Kalanaur', 'Khem Karan', 'Kiratpur Sahib', 'Kot Fatta', 'Laungowal', 'Lehragaga', 'Longowal', 'Machhiwara', 'Majitha', 'Maur', 'Moonak', 'Morinda', 'Mukerian', 'Naina Devi', 'Nawanshahr', 'Payal', 'Qadian', 'Quadian', 'Raman', 'Rayya', 'Rupnagar', 'Sahnewal', 'Samrala', 'Sanaur', 'Sardulgarh', 'Shahpur Kandi', 'Sirhind Fatehgarh Sahib', 'Sujanpur', 'Zira',
    
    // Rajasthan
    'Jaipur', 'Jodhpur', 'Kota', 'Bikaner', 'Ajmer', 'Udaipur', 'Bhilwara', 'Alwar', 'Bharatpur', 'Sikar', 'Pali', 'Sri Ganganagar', 'Kishangarh', 'Baran', 'Dhaulpur', 'Tonk', 'Beawar', 'Hanumangarh', 'Gangapur City', 'Banswara', 'Bundi', 'Jhalawar', 'Churu', 'Jhunjhunu', 'Nagaur', 'Sawai Madhopur', 'Makrana', 'Sujangarh', 'Lachhmangarh', 'Ratangarh', 'Sardarshahar', 'Nokha', 'Nimbahera', 'Suratgarh', 'Rajsamand', 'Lachhmangarh Shekhawati', 'Rajgarh', 'Nasirabad', 'Nohar', 'Phalodi', 'Nathdwara', 'Pilani', 'Merta City', 'Karauli', 'Hindaun', 'Pratapgarh', 'Keshoraipatan', 'Amet', 'Sagwara', 'Gharsana', 'Raisinghnagar', 'Anupgarh', 'Rawatsar', 'Padampur', 'Rajakhera', 'Shahpura', 'Shahpura', 'Taranagar', 'Kumher', 'Kekri', 'Kuchaman City', 'Makrana', 'Malpura', 'Nadbai', 'Nagar', 'Newai', 'Nimaj', 'Phagi', 'Rajgarh', 'Reengus', 'Sambhar', 'Shahpura', 'Thanagazi', 'Tijara', 'Viratnagar',
    
    // Sikkim
    'Gangtok', 'Namchi', 'Gyalshing', 'Mangan', 'Jorethang', 'Nayabazar', 'Singtam', 'Rangpo', 'Pelling', 'Yuksom', 'Lachung', 'Lachen', 'Chungthang', 'Ranipool', 'Pakyong', 'Soreng', 'Dentam', 'Kalimpong', 'Rhenock', 'Rongli', 'Tadong', 'Majitar', 'Ravangla', 'Legship', 'Hee Bermiok', 'Melli', 'Naga', 'Reshi', 'Rhenock', 'Samdong', 'Sang', 'Tikjuk', 'Tinkitam', 'Tsomgo', 'Yumthang',
    
    // Tamil Nadu
    'Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tirunelveli', 'Tiruppur', 'Vellore', 'Erode', 'Thoothukkudi', 'Dindigul', 'Thanjavur', 'Ranipet', 'Sivakasi', 'Karur', 'Udhagamandalam', 'Hosur', 'Nagercoil', 'Kanchipuram', 'Kumarakoil', 'Karaikkudi', 'Neyveli', 'Cuddalore', 'Kumbakonam', 'Tiruvannamalai', 'Pollachi', 'Rajapalayam', 'Gudiyatham', 'Pudukkottai', 'Vaniyambadi', 'Ambur', 'Nagapattinam', 'Krishnagiri', 'Thiruvallur', 'Chidambaram', 'Tirupattur', 'Gobichettipalayam', 'Mettur', 'Bhavani', 'Poonamallee', 'Arakkonam', 'Kanyakumari', 'Mahabalipuram', 'Pondicherry', 'Villupuram', 'Tindivanam', 'Gingee', 'Panruti', 'Ulundurpet', 'Cheyyar', 'Tirukovilur', 'Mayavaram', 'Mannargudi', 'Pattukkottai', 'Aranthangi', 'Thiruthuraipoondi', 'Vedaranyam', 'Nagore', 'Sirkazhi', 'Poompuhar', 'Tranquebar', 'Velankanni', 'Point Calimere', 'Kodaikanal', 'Yercaud', 'Ooty', 'Coonoor', 'Kotagiri', 'Gudalur', 'Valparai', 'Munnar', 'Thekkady', 'Kumily', 'Periyar', 'Rameswaram', 'Dhanushkodi', 'Mandapam', 'Kilakarai', 'Ramanathapuram', 'Paramakudi', 'Mudukulathur', 'Aruppukkottai', 'Sattur', 'Virudhunagar', 'Srivilliputhur', 'Sankarankovil', 'Tenkasi', 'Courtallam', 'Shencottah', 'Ambasamudram', 'Kallidaikurichi', 'Nanguneri', 'Radhapuram', 'Tiruchendur', 'Kulasekharapatnam', 'Ottapidaram', 'Kovilpatti', 'Kayathar', 'Vilathikulam', 'Sathankulam', 'Tiruvallur', 'Ponneri', 'Gummidipoondi', 'Sholavandan', 'Andipatti', 'Bodinayakanur', 'Theni', 'Periyakulam', 'Uthamapalayam', 'Cumbum', 'Gudalur', 'Devakottai', 'Ilayangudi', 'Karaikudi', 'Sivaganga', 'Tirupathur', 'Singampunari', 'Manamadurai', 'Paramakudi', 'Ramanathapuram', 'Mudukulathur', 'Kamuthi', 'Tiruvadanai', 'Bogalur', 'Kilakarai', 'Kadaladi', 'Erwadi', 'Sayalkudi', 'Thangachimadam', 'Mandapam', 'Pamban', 'Rameswaram', 'Dhanushkodi',
    
    // Telangana
    'Hyderabad', 'Warangal', 'Nizamabad', 'Khammam', 'Karimnagar', 'Ramagundam', 'Mahabubnagar', 'Nalgonda', 'Adilabad', 'Suryapet', 'Miryalaguda', 'Jagtial', 'Mancherial', 'Nirmal', 'Kothagudem', 'Bodhan', 'Sangareddy', 'Metpally', 'Zahirabad', 'Medak', 'Siddipet', 'Jangaon', 'Bhongir', 'Kamareddy', 'Vikarabad', 'Wanaparthy', 'Gadwal', 'Nagarkurnool', 'Narayanpet', 'Medchal', 'Shamshabad', 'Keesara', 'Ghatkesar', 'Uppal', 'LB Nagar', 'Vanasthalipuram', 'Hayathnagar', 'Ibrahimpatnam', 'Yacharam', 'Maheshwaram', 'Rajendranagar', 'Shankarpalle', 'Chevella', 'Moinabad', 'Pargi', 'Kandukur', 'Farooqnagar', 'Shadnagar', 'Maheswaram', 'Ibrahimpatnam', 'Yacharam', 'Hayathnagar', 'Ghatkesar', 'Keesara', 'Medchal', 'Shamirpet', 'Quthbullapur', 'Balanagar', 'Kukatpally', 'Miyapur', 'Gachibowli', 'Madhapur', 'Kondapur', 'Hitech City', 'Jubilee Hills', 'Banjara Hills', 'Somajiguda', 'Ameerpet', 'SR Nagar', 'Erragadda', 'Borabanda', 'Sanathnagar', 'Moosapet', 'Begumpet', 'Secunderabad', 'Trimulgherry', 'Alwal', 'Bolaram', 'Yapral', 'Kompally', 'Quthbullapur', 'Jeedimetla', 'Suraram', 'Subhash Nagar', 'Neredmet', 'Malkajgiri', 'Sainikpuri', 'AS Rao Nagar', 'ECIL', 'Dammaiguda', 'Nagaram', 'Cherlapally', 'Uppal', 'Boduppal', 'Peerzadiguda', 'Medipally', 'Nacharam', 'Habsiguda', 'Tarnaka', 'Vidyanagar', 'Chilkalguda', 'Secunderabad Cantonment', 'Trimulgherry', 'Bolaram', 'Yapral', 'Kompally', 'Quthbullapur', 'Jeedimetla',
    
    // Tripura
    'Agartala', 'Dharmanagar', 'Udaipur', 'Kailasahar', 'Belonia', 'Khowai', 'Teliamura', 'Sabroom', 'Kumarghat', 'Sonamura', 'Panisagar', 'Amarpur', 'Ranirbazar', 'Kamalpur', 'Gandacherra', 'Longtharai Valley', 'Jampui Hills', 'Jirania', 'Mohanpur', 'Melaghar', 'Bishalgarh', 'Boxanagar', 'Nalchar', 'Hrishyamukh', 'Manu', 'Kakraban', 'Chailengta', 'Damcherra', 'Fatikroy', 'Kanchanpur', 'Krishnapur', 'Lefunga', 'Matabari', 'Ompi', 'Rajnagar', 'Sidhai', 'Tuikarmaw', 'Jampui Hill', 'Vanghmun', 'Chawmanu', 'Damta', 'Dukli', 'Lawngtlai', 'Mamit', 'Reiek', 'Sakhan', 'Tlabung', 'Tuipang', 'Zawlnuam',
    
    // Uttar Pradesh
    'Lucknow', 'Kanpur', 'Ghaziabad', 'Agra', 'Varanasi', 'Meerut', 'Allahabad', 'Prayagraj', 'Bareilly', 'Moradabad', 'Saharanpur', 'Gorakhpur', 'Firozabad', 'Jhansi', 'Muzaffarnagar', 'Mathura', 'Budaun', 'Rampur', 'Shahjahanpur', 'Farrukhabad', 'Mau', 'Hapur', 'Noida', 'Etawah', 'Mirzapur', 'Bulandshahr', 'Sambhal', 'Amroha', 'Hardoi', 'Fatehpur', 'Raebareli', 'Orai', 'Sitapur', 'Bahraich', 'Modinagar', 'Unnao', 'Jaunpur', 'Lakhimpur', 'Hathras', 'Banda', 'Pilibhit', 'Barabanki', 'Khurja', 'Gonda', 'Mainpuri', 'Lalitpur', 'Etah', 'Deoria', 'Ujhani', 'Ghazipur', 'Sultanpur', 'Azamgarh', 'Bijnor', 'Sahaswan', 'Basti', 'Chandausi', 'Akbarpur', 'Ballia', 'Tanda', 'Greater Noida', 'Shikohabad', 'Shamli', 'Awagarh', 'Kasganj',
    
    // Uttarakhand
    'Dehradun', 'Haridwar', 'Roorkee', 'Haldwani-cum-Kathgodam', 'Rudrapur', 'Kashipur', 'Rishikesh', 'Kotdwara', 'Ramnagar', 'Muzaffarnagar', 'Bageshwar', 'Tehri', 'Pauri', 'Pithoragarh', 'Almora', 'Nainital', 'Mussoorie', 'Lansdowne', 'Chakrata', 'Dhanaulti', 'Kanatal', 'Chopta', 'Auli', 'Joshimath', 'Badrinath', 'Kedarnath', 'Gangotri', 'Yamunotri', 'Hemkund Sahib', 'Valley of Flowers', 'Har Ki Dun', 'Dayara Bugyal', 'Tungnath', 'Chandrashila', 'Deoria Tal', 'Chorabari Tal', 'Sattal', 'Bhimtal', 'Naukuchiatal', 'Ranikhet', 'Kausani', 'Binsar', 'Mukteshwar', 'Chaukori', 'Berinag', 'Munsiyari', 'Dharchula', 'Jauljibi', 'Gangolihat', 'Champawat', 'Lohaghat', 'Mayawati', 'Abbott Mount', 'Pangot', 'Khurpatal', 'Ramgarh', 'Bhowali', 'Okhimath',
    
    // West Bengal
    'Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri', 'Bardhaman', 'Malda', 'Baharampur', 'Habra', 'Kharagpur', 'Shantipur', 'Dankuni', 'Dhulian', 'Ranaghat', 'Haldia', 'Raiganj', 'Krishnanagar', 'Nabadwip', 'Medinipur', 'Jalpaiguri', 'Balurghat', 'Basirhat', 'Bankura', 'Chakdaha', 'Darjeeling', 'Alipurduar', 'Purulia', 'Jangipur', 'Bolpur', 'Bangaon', 'Cooch Behar', 'Tamluk', 'Bishnupur', 'Mayurbhanj', 'Diamond Harbour', 'Sealdah', 'Barrackpore', 'Uttarpara Kotrung', 'Serampore', 'Chandannagar', 'Barasat', 'Kamarhati', 'Madhyamgram', 'South Dumdum', 'Panihati', 'North Dumdum', 'Garfa', 'South Barrackpur', 'Bhatpara', 'New Barrackpur', 'Naihati', 'Titagarh', 'Halisahar', 'Rishra', 'Noapara', 'Baranagar', 'Dum Dum', 'Rahara', 'Khardaha', 'New Barrackpore', 'Baidyabati', 'Gayeshpur', 'Kalyani', 'Haringhata', 'Tehatta', 'Palashi', 'Karimpur', 'Jalangi', 'Domkal', 'Jiaganj', 'Mayurbhanj', 'Lalgola', 'Bhagawangola', 'Murshidabad', 'Beldanga', 'Hariharpara', 'Kandi', 'Burwan', 'Bharatpur', 'Rejinagar', 'Salar', 'Farakka', 'Jangipur', 'Raghunathganj', 'Sagardighi', 'Mayurbhanj', 'Lalbagh', 'Panchagarh', 'Raninagar', 'Nawda', 'Khargram', 'Burwan', 'Bhagwangola', 'Raghunathganj', 'Farakka', 'Samserganj', 'Sagardighi', 'Lalgola', 'Bhagwangola', 'Mayurbhanj', 'Domkal', 'Jalangi', 'Karimpur', 'Tehatta', 'Palashi', 'Kalyani', 'Haringhata', 'Ranaghat', 'Santipur', 'Fulia', 'Palashipara', 'Kalyani', 'Gayeshpur', 'Baidyabati', 'Bansberia', 'Tribeni', 'Haripal', 'Tarakeswar', 'Arambagh', 'Goghat', 'Khanakul', 'Pursurah', 'Dhaniakhali', 'Balagarh', 'Jirat', 'Mayurbhanj', 'Burdwan', 'Katwa', 'Kalna', 'Memari', 'Jamalpur', 'Sainthia', 'Rampurhat', 'Nalhati', 'Suri', 'Bolpur', 'Santiniketan', 'Illambazar', 'Rajnagar', 'Dubrajpur', 'Mayureswar', 'Faridpur', 'Jamalpur', 'Galsi', 'Manteswar', 'Khandaghosh', 'Raina', 'Jamalpur', 'Memari', 'Kalna', 'Katwa', 'Ketugram', 'Mangalkote', 'Ausgram', 'Galsi', 'Purbasthali', 'Bhatar', 'Monteswar', 'Raina', 'Jamalpur'
  ];
};

/**
 * Get world cities including comprehensive Indian cities
 * Returns a list combining Indian cities with major international cities
 */
export const getWorldCities = (): string[] => {
  const indianCities = getIndianCities();
  const internationalCities = [
    'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose', 'Austin', 'Jacksonville', 'San Francisco', 'Columbus', 'Indianapolis', 'Fort Worth', 'Charlotte', 'Seattle', 'Denver', 'Boston', 'Detroit', 'Nashville', 'Memphis', 'Portland', 'Oklahoma City', 'Las Vegas', 'Louisville', 'Baltimore', 'Milwaukee', 'Albuquerque', 'Tucson', 'Fresno', 'Sacramento', 'Mesa', 'Kansas City', 'Atlanta', 'Long Beach', 'Colorado Springs', 'Raleigh', 'Miami', 'Virginia Beach', 'Omaha', 'Oakland', 'Minneapolis', 'Tulsa', 'Arlington', 'Tampa', 'New Orleans', 'Wichita', 'Cleveland', 'Bakersfield', 'London', 'Paris', 'Tokyo', 'Sydney', 'Toronto', 'Berlin', 'Madrid', 'Rome', 'Amsterdam', 'Barcelona', 'Munich', 'Dubai', 'Singapore', 'Hong Kong', 'Istanbul', 'Moscow', 'São Paulo', 'Rio de Janeiro', 'Buenos Aires', 'Cairo', 'Johannesburg', 'Lagos', 'Nairobi', 'Melbourne', 'Brisbane', 'Auckland', 'Bangkok', 'Manila', 'Jakarta', 'Kuala Lumpur', 'Seoul', 'Taipei', 'Tel Aviv', 'Oslo', 'Stockholm', 'Copenhagen', 'Helsinki', 'Zurich', 'Geneva', 'Vienna', 'Prague', 'Warsaw', 'Budapest', 'Athens', 'Lisbon', 'Brussels', 'Dublin', 'Frankfurt', 'Milan', 'Venice', 'Florence', 'Naples', 'Nice', 'Lyon', 'Marseille', 'Vancouver', 'Montreal', 'Calgary', 'Ottawa', 'Mexico City', 'Guadalajara', 'Monterrey', 'Lima', 'Bogotá', 'Santiago', 'Caracas', 'Quito', 'La Paz', 'Montevideo', 'Asunción'
  ];
  
  // Combine and sort all cities
  return [...indianCities, ...internationalCities].sort();
};

// Keeping this for backward compatibility
export const getNearbyRegions = getNearbyCities;

// Keeping this for backward compatibility
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
export const getUserRegion = getUserCity;
