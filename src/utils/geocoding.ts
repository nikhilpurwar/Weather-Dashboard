// Reverse geocoding utility to get location names from coordinates
export const getLocationName = async (lat: number, lon: number): Promise<string> => {
  try {
    // Using OpenStreetMap Nominatim API for reverse geocoding (free)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'Weather-Dashboard/1.0'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error('Geocoding API request failed');
    }
    
    const data = await response.json();
    
    if (data && data.address) {
      // Try to get the most relevant location name
      const address = data.address;
      
      // Priority order for location names
      const locationName = 
        address.village ||
        address.town ||
        address.city ||
        address.municipality ||
        address.county ||
        address.state_district ||
        address.state ||
        address.country ||
        'Unknown Location';
        
      // Add additional context if available
      const contextName = address.suburb || address.neighbourhood || address.hamlet;
      
      if (contextName && contextName !== locationName) {
        return `${contextName}, ${locationName}`;
      }
      
      return locationName;
    }
    
    // Fallback if no address found
    return `Location (${lat.toFixed(3)}, ${lon.toFixed(3)})`;
    
  } catch (error) {
    console.warn('Failed to get location name:', error);
    // Fallback to coordinates
    return `Location (${lat.toFixed(3)}, ${lon.toFixed(3)})`;
  }
};

// Debounced version to avoid too many API calls
const geocodingCache: { [key: string]: string } = {};

export const getLocationNameCached = async (lat: number, lon: number): Promise<string> => {
  const key = `${lat.toFixed(3)},${lon.toFixed(3)}`;
  
  if (geocodingCache[key]) {
    return geocodingCache[key];
  }
  
  const locationName = await getLocationName(lat, lon);
  geocodingCache[key] = locationName;
  
  return locationName;
};
