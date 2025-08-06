import axios from 'axios';
import dayjs from 'dayjs';

export interface WeatherData {
  hourly: {
    time: string[];
    temperature_2m: number[];
    humidity: number[];
    wind_speed_10m: number[];
    surface_pressure: number[];
  };
}

export interface PolygonWeatherData {
  polygonId: string;
  centerLat: number;
  centerLon: number;
  data: WeatherData;
  averageValue: number;
  dataSource: string;
}

// Calculate polygon centroid
export const getPolygonCentroid = (coordinates: [number, number][]): [number, number] => {
  const lats = coordinates.map(coord => coord[0]);
  const lons = coordinates.map(coord => coord[1]);
  
  const avgLat = lats.reduce((sum, lat) => sum + lat, 0) / lats.length;
  const avgLon = lons.reduce((sum, lon) => sum + lon, 0) / lons.length;
  
  return [avgLat, avgLon];
};

// Fetch weather data for a specific location and time range
export const fetchWeatherData = async (
  lat: number, 
  lon: number, 
  startDate?: string, 
  endDate?: string
): Promise<WeatherData> => {
  const start = startDate || dayjs().subtract(15, 'day').format('YYYY-MM-DD');
  const end = endDate || dayjs().add(15, 'day').format('YYYY-MM-DD');
  
  // Use current forecast API for real-time data
  const url = `https://api.open-meteo.com/v1/forecast`;
  
  try {
    const response = await axios.get(url, {
      params: {
        latitude: lat.toFixed(4),
        longitude: lon.toFixed(4),
        start_date: start,
        end_date: end,
        hourly: [
          'temperature_2m',
          'relative_humidity_2m',
          'wind_speed_10m',
          'surface_pressure'
        ].join(','),
        timezone: 'auto'
      },
      timeout: 10000
    });

    console.log('Weather API Response:', response.data);

    // Map the API response to our interface
    const weatherData = {
      hourly: {
        time: response.data.hourly?.time || [],
        temperature_2m: response.data.hourly?.temperature_2m || [],
        humidity: response.data.hourly?.relative_humidity_2m || [],
        wind_speed_10m: response.data.hourly?.wind_speed_10m || [],
        surface_pressure: response.data.hourly?.surface_pressure || [],
      }
    };

    console.log('Mapped weather data:', weatherData);
    return weatherData;
  } catch (error) {
    console.error('Failed to fetch weather data:', error);
    console.log('Falling back to mock data for lat:', lat, 'lon:', lon);
    // Return mock data for development
    return generateMockWeatherData(start, end);
  }
};

// Fetch weather data for a polygon
export const fetchPolygonWeatherData = async (
  polygonId: string,
  coordinates: [number, number][],
  dataSource: string,
  startTime?: string,
  endTime?: string
): Promise<PolygonWeatherData> => {
  const [centerLat, centerLon] = getPolygonCentroid(coordinates);
  
  console.log(`Fetching weather for polygon ${polygonId} at [${centerLat}, ${centerLon}]`);
  
  const startDate = startTime ? dayjs(startTime).format('YYYY-MM-DD') : undefined;
  const endDate = endTime ? dayjs(endTime).format('YYYY-MM-DD') : undefined;
  
  const data = await fetchWeatherData(centerLat, centerLon, startDate, endDate);
  
  // Calculate average value for the time range
  let averageValue = 0;
  
  try {
    if (startTime && endTime) {
      // Find data points within the time range
      const startTimestamp = dayjs(startTime);
      const endTimestamp = dayjs(endTime);
      
      const values = getDataSourceValues(data, dataSource);
      const filteredValues: number[] = [];
      
      data.hourly.time.forEach((timeStr, index) => {
        const timestamp = dayjs(timeStr);
        if (timestamp.isAfter(startTimestamp) && timestamp.isBefore(endTimestamp) || 
            timestamp.isSame(startTimestamp) || timestamp.isSame(endTimestamp)) {
          const value = values[index];
          if (typeof value === 'number' && !isNaN(value)) {
            filteredValues.push(value);
          }
        }
      });
      
      if (filteredValues.length > 0) {
        averageValue = filteredValues.reduce((sum, val) => sum + val, 0) / filteredValues.length;
      } else {
        // Fallback to first valid value
        const firstValid = getDataSourceValues(data, dataSource).find(val => typeof val === 'number' && !isNaN(val));
        averageValue = firstValid || 0;
      }
    } else {
      // Use most recent or first valid value
      const values = getDataSourceValues(data, dataSource);
      const validValues = values.filter(val => typeof val === 'number' && !isNaN(val));
      averageValue = validValues.length > 0 ? validValues[validValues.length - 1] : 0;
    }
    
    console.log(`Polygon ${polygonId} - Data source: ${dataSource}, Average value: ${averageValue}`);
  } catch (error) {
    console.error('Error calculating average value:', error);
    averageValue = 0;
  }
  
  return {
    polygonId,
    centerLat,
    centerLon,
    data,
    averageValue: Number(averageValue.toFixed(1)), // Round to 1 decimal place
    dataSource
  };
};

// Get values for a specific data source
const getDataSourceValues = (data: WeatherData, dataSource: string): number[] => {
  switch (dataSource) {
    case 'open-meteo':
    case 'temperature_2m':
    case 'temperature':
      return data.hourly.temperature_2m;
    case 'humidity':
    case 'relative_humidity_2m':
      return data.hourly.humidity;
    case 'wind_speed':
    case 'wind_speed_10m':
      return data.hourly.wind_speed_10m;
    case 'pressure':
    case 'surface_pressure':
      return data.hourly.surface_pressure;
    case 'mock-tropical':
      // Generate tropical weather simulation
      return data.hourly.temperature_2m.map(() => Math.random() * 15 + 25); // 25-40°C
    case 'mock-temperate':
      // Generate temperate weather simulation  
      return data.hourly.temperature_2m.map(() => Math.random() * 25 + 5); // 5-30°C
    default:
      return data.hourly.temperature_2m;
  }
};

// Generate mock data for development/fallback
const generateMockWeatherData = (startDate: string, endDate: string): WeatherData => {
  const start = dayjs(startDate);
  const end = dayjs(endDate);
  const hours = end.diff(start, 'hour');
  
  const time: string[] = [];
  const temperature_2m: number[] = [];
  const humidity: number[] = [];
  const wind_speed_10m: number[] = [];
  const surface_pressure: number[] = [];
  
  for (let i = 0; i <= hours; i++) {
    const currentTime = start.add(i, 'hour');
    time.push(currentTime.toISOString());
    
    // Generate realistic mock data
    temperature_2m.push(15 + Math.sin(i / 24 * 2 * Math.PI) * 10 + Math.random() * 5);
    humidity.push(40 + Math.random() * 40);
    wind_speed_10m.push(2 + Math.random() * 8);
    surface_pressure.push(1013 + Math.random() * 20 - 10);
  }
  
  return {
    hourly: {
      time,
      temperature_2m,
      humidity,
      wind_speed_10m,
      surface_pressure
    }
  };
};
