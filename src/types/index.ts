export interface TimeRange {
  start: string | null; // ISO string
  end: string | null;
}

export interface ColorRule {
  operator: '<' | '<=' | '=' | '>=' | '>';
  value: number;
  color: string;
  label?: string;
}

export interface WeatherDataPoint {
  temperature: number;
  humidity: number;
  windSpeed: number;
  precipitation: number;
  timestamp: string;
}

export interface DataSource {
  id: string;
  name: string;
  description: string;
  apiUrl?: string;
  isLive: boolean;
  parameters: string[];
}

export interface PolygonData {
  id: string;
  coordinates: [number, number][];
  dataSource: string;
  label: string; // Made required for better UX
  weatherData?: WeatherDataPoint[];
  lastUpdated?: string;
}

export interface AppState {
  polygons: PolygonData[];
  selectedTime: TimeRange;
  colorRules: {
    [dataSource: string]: ColorRule[];
  };
  dataSources: DataSource[];
  selectedDataSource: string;
  focusedPolygonId: string | null;
  weatherCache: {
    [key: string]: {
      data: WeatherDataPoint[];
      timestamp: number;
      expires: number;
    };
  };
  animationsEnabled: boolean;
}

export type Action =
  | { type: 'ADD_POLYGON'; payload: PolygonData }
  | { type: 'DELETE_POLYGON'; payload: string }
  | { type: 'UPDATE_POLYGON'; payload: { id: string; updates: Partial<PolygonData> } }
  | { type: 'FOCUS_POLYGON'; payload: string | null }
  | { type: 'SET_TIME'; payload: TimeRange }
  | { type: 'SET_COLOR_RULES'; payload: { [dataSource: string]: ColorRule[] } }
  | { type: 'SET_DATA_SOURCE'; payload: string }
  | { type: 'ADD_DATA_SOURCE'; payload: DataSource }
  | { type: 'SET_WEATHER_DATA'; payload: { polygonId: string; data: WeatherDataPoint[] } }
  | { type: 'SET_CACHE'; payload: { key: string; data: WeatherDataPoint[]; ttl: number } }
  | { type: 'CLEAR_EXPIRED_CACHE' }
  | { type: 'TOGGLE_ANIMATIONS' }
  | { type: 'LOAD_FROM_STORAGE'; payload: Partial<AppState> };
