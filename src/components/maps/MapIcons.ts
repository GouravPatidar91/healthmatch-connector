// Professional SVG icon paths for map markers
export const MapIconSVGs = {
  // Shop/Pharmacy - Building with medical cross
  shop: `<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor"/>
         <path d="M9 22V12h6v10" stroke="currentColor"/>
         <line x1="10" y1="8" x2="14" y2="8" stroke="currentColor"/>
         <line x1="12" y1="6" x2="12" y2="10" stroke="currentColor"/>`,
  
  // Home - House with door
  home: `<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor"/>
         <polyline points="9 22 9 12 15 12 15 22" stroke="currentColor"/>`,
  
  // Delivery partner vehicle icons
  bike: `<path d="M5 19m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" stroke="currentColor"/>
         <path d="M19 19m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" stroke="currentColor"/>
         <path d="M12 4l-3 9l4 -2l2 3h3.5" stroke="currentColor"/>
         <path d="M17.5 14l-1.5 -3.5" stroke="currentColor"/>
         <path d="M6 14l1 -3h3.5l2.5 -4" stroke="currentColor"/>`,
  
  
  car: `<path d="M7 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" stroke="currentColor"/>
        <path d="M17 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" stroke="currentColor"/>
        <path d="M5 17h-2v-6l2 -5h9l4 5h1a2 2 0 0 1 2 2v4h-2m-4 0h-6m-6 -6h15m-6 0v-5" stroke="currentColor"/>`,
  
  
  scooter: `<path d="M6 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" stroke="currentColor"/>
            <path d="M16 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" stroke="currentColor"/>
            <path d="M8 17h5a6 6 0 0 1 5 -5v-5a2 2 0 0 0 -2 -2h-1" stroke="currentColor"/>
            <path d="M6 9h3" stroke="currentColor"/>`,
  
  
  bicycle: `<path d="M5 18m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" stroke="currentColor"/>
            <path d="M19 18m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" stroke="currentColor"/>
            <path d="M12 19v-4l-3 -3l5 -4l2 3l3 0" stroke="currentColor"/>
            <path d="M17 5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" stroke="currentColor"/>`,
};

// Color scheme for map markers
export const MapIconColors = {
  shop: 'hsl(142, 76%, 36%)',      // Green for pharmacy
  home: 'hsl(221, 83%, 53%)',       // Blue for customer
  delivery: 'hsl(25, 95%, 53%)',    // Orange for delivery
  bike: 'hsl(25, 95%, 53%)',
  car: 'hsl(217, 91%, 60%)',
  scooter: 'hsl(142, 76%, 36%)',
  bicycle: 'hsl(280, 65%, 60%)',
};

// Get vehicle icon and color based on vehicle type
export const getVehicleIconData = (vehicleType: string) => {
  const type = vehicleType.toLowerCase();
  
  if (type.includes('bike') || type.includes('motorcycle')) {
    return { iconSvg: MapIconSVGs.bike, color: MapIconColors.bike };
  } else if (type.includes('car')) {
    return { iconSvg: MapIconSVGs.car, color: MapIconColors.car };
  } else if (type.includes('scooter')) {
    return { iconSvg: MapIconSVGs.scooter, color: MapIconColors.scooter };
  } else if (type.includes('bicycle') || type.includes('cycle')) {
    return { iconSvg: MapIconSVGs.bicycle, color: MapIconColors.bicycle };
  }
  
  // Default to bike
  return { iconSvg: MapIconSVGs.bike, color: MapIconColors.delivery };
};
