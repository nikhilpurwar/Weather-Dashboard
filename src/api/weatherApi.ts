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
  
  const url = `https://archive-api.open-meteo.com/v1/archive`;
  
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
      }
    });

    // Map the API response to our interface
    return {
      hourly: {
        time: response.data.hourly.time || [],
        temperature_2m: response.data.hourly.temperature_2m || [],
        humidity: response.data.hourly.relative_humidity_2m || [],
        wind_speed_10m: response.data.hourly.wind_speed_10m || [],
        surface_pressure: response.data.hourly.surface_pressure || [],
      }
    };
  } catch (error) {
    console.error('Failed to fetch weather data:', error);
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
  
  const startDate = startTime ? dayjs(startTime).format('YYYY-MM-DD') : undefined;
  const endDate = endTime ? dayjs(endTime).format('YYYY-MM-DD') : undefined;
  
  const data = await fetchWeatherData(centerLat, centerLon, startDate, endDate);
  
  // Calculate average value for the time range
  let averageValue = 0;
  if (startTime && endTime) {
    const startHour = dayjs(startTime).hour();
    const endHour = dayjs(endTime).hour();
    const startIndex = data.hourly.time.findIndex(time => 
      dayjs(time).isSame(dayjs(startTime), 'day') && dayjs(time).hour() >= startHour
    );
    const endIndex = data.hourly.time.findIndex(time => 
      dayjs(time).isSame(dayjs(endTime), 'day') && dayjs(time).hour() <= endHour
    );
    
    if (startIndex >= 0 && endIndex >= 0) {
      const values = getDataSourceValues(data, dataSource).slice(startIndex, endIndex + 1);
      averageValue = values.reduce((sum, val) => sum + (val || 0), 0) / values.length;
    }
  } else {
    // Use current hour value
    const currentHourIndex = data.hourly.time.findIndex(time => 
      dayjs(time).isSame(dayjs(), 'hour')
    );
    if (currentHourIndex >= 0) {
      const values = getDataSourceValues(data, dataSource);
      averageValue = values[currentHourIndex] || 0;
    }
  }
  
  return {
    polygonId,
    centerLat,
    centerLon,
    data,
    averageValue,
    dataSource
  };
};

// Get values for a specific data source
const getDataSourceValues = (data: WeatherData, dataSource: string): number[] => {
  switch (dataSource) {
    case 'temperature_2m':
      return data.hourly.temperature_2m;
    case 'humidity':
      return data.hourly.humidity;
    case 'wind_speed':
      return data.hourly.wind_speed_10m;
    case 'pressure':
      return data.hourly.surface_pressure;
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
