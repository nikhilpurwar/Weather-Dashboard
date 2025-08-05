import { WeatherDataPoint, DataSource } from '../types';

// Cache for API responses
const weatherCache = new Map<string, { data: WeatherDataPoint[]; expires: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

// Generate mock weather data
const generateMockWeatherData = (dataSourceId: string, lat: number, lng: number): WeatherDataPoint[] => {
  const data: WeatherDataPoint[] = [];
  const now = new Date();
  
  for (let i = 0; i < 24; i++) {
    const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000).toISOString();
    
    let baseTemp = 20;
    let humidity = 60;
    let windSpeed = 5;
    let precipitation = 0;
    
    // Different patterns for different mock sources
    if (dataSourceId === 'mock-tropical') {
      baseTemp = 28 + Math.sin(i * Math.PI / 12) * 5 + (Math.random() - 0.5) * 4;
      humidity = 75 + Math.sin(i * Math.PI / 8) * 15 + (Math.random() - 0.5) * 10;
      windSpeed = 8 + Math.random() * 4;
      precipitation = Math.random() > 0.7 ? Math.random() * 5 : 0;
    } else if (dataSourceId === 'mock-temperate') {
      baseTemp = 15 + Math.sin(i * Math.PI / 12) * 8 + (Math.random() - 0.5) * 6;
      humidity = 55 + Math.sin(i * Math.PI / 6) * 20 + (Math.random() - 0.5) * 15;
      windSpeed = 6 + Math.random() * 5;
      precipitation = Math.random() > 0.8 ? Math.random() * 3 : 0;
    }
    
    // Add some location-based variation
    const latVariation = (lat - 20) * 0.5;
    const lngVariation = Math.sin(lng * Math.PI / 180) * 2;
    
    data.push({
      temperature: Math.round((baseTemp + latVariation + lngVariation) * 10) / 10,
      humidity: Math.max(20, Math.min(100, Math.round(humidity))),
      windSpeed: Math.max(0, Math.round(windSpeed * 10) / 10),
      precipitation: Math.round(precipitation * 10) / 10,
      timestamp
    });
  }
  
  return data.reverse(); // Return in chronological order
};

// Fetch weather data from Open-Meteo
const fetchOpenMeteoData = async (lat: number, lng: number): Promise<WeatherDataPoint[]> => {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation&past_hours=24&forecast_hours=0`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Open-Meteo API error: ${response.status}`);
  }
  
  const result = await response.json();
  const hourly = result.hourly;
  
  const data: WeatherDataPoint[] = [];
  for (let i = 0; i < hourly.time.length; i++) {
    data.push({
      temperature: hourly.temperature_2m[i] || 0,
      humidity: hourly.relative_humidity_2m[i] || 0,
      windSpeed: hourly.wind_speed_10m[i] || 0,
      precipitation: hourly.precipitation[i] || 0,
      timestamp: hourly.time[i]
    });
  }
  
  return data;
};

// Fetch weather data from WeatherAPI (requires API key)
const fetchWeatherAPIData = async (lat: number, lng: number): Promise<WeatherDataPoint[]> => {
  // Note: This would require an API key in a real implementation
  // For demo purposes, we'll return mock data similar to the pattern
  console.warn('WeatherAPI requires an API key. Using mock data instead.');
  return generateMockWeatherData('mock-temperate', lat, lng);
};

// Main weather data fetcher with caching
export const fetchWeatherData = async (
  dataSource: DataSource, 
  lat: number, 
  lng: number
): Promise<WeatherDataPoint[]> => {
  const cacheKey = `${dataSource.id}-${lat.toFixed(3)}-${lng.toFixed(3)}`;
  
  // Check cache first
  const cached = weatherCache.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    return cached.data;
  }
  
  let data: WeatherDataPoint[];
  
  try {
    if (!dataSource.isLive) {
      // Generate mock data
      data = generateMockWeatherData(dataSource.id, lat, lng);
    } else if (dataSource.id === 'open-meteo') {
      data = await fetchOpenMeteoData(lat, lng);
    } else if (dataSource.id === 'weatherapi') {
      data = await fetchWeatherAPIData(lat, lng);
    } else {
      throw new Error(`Unknown data source: ${dataSource.id}`);
    }
    
    // Cache the result
    weatherCache.set(cacheKey, {
      data,
      expires: Date.now() + CACHE_TTL
    });
    
    return data;
  } catch (error) {
    console.error('Failed to fetch weather data:', error);
    
    // Return cached data if available, even if expired
    if (cached) {
      console.warn('Using expired cache data due to fetch error');
      return cached.data;
    }
    
    // Fallback to mock data
    console.warn('Falling back to mock data');
    data = generateMockWeatherData('mock-temperate', lat, lng);
    weatherCache.set(cacheKey, {
      data,
      expires: Date.now() + CACHE_TTL
    });
    
    return data;
  }
};

// Get average weather for a polygon (calculate center point)
export const getPolygonWeatherData = async (
  dataSource: DataSource,
  coordinates: [number, number][]
): Promise<WeatherDataPoint[]> => {
  if (coordinates.length === 0) {
    throw new Error('No coordinates provided');
  }
  
  // Calculate center point of polygon
  const centerLat = coordinates.reduce((sum, coord) => sum + coord[0], 0) / coordinates.length;
  const centerLng = coordinates.reduce((sum, coord) => sum + coord[1], 0) / coordinates.length;
  
  return fetchWeatherData(dataSource, centerLat, centerLng);
};

// Clear expired cache entries
export const clearExpiredCache = () => {
  const now = Date.now();
  for (const [key, value] of weatherCache.entries()) {
    if (value.expires < now) {
      weatherCache.delete(key);
    }
  }
};

// Get cache stats for debugging
export const getCacheStats = () => {
  const entries = Array.from(weatherCache.entries());
  const valid = entries.filter(([, value]) => value.expires > Date.now());
  const expired = entries.filter(([, value]) => value.expires <= Date.now());
  
  return {
    total: entries.length,
    valid: valid.length,
    expired: expired.length,
    keys: entries.map(([key]) => key)
  };
};
