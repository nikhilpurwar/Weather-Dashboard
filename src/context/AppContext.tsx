import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { AppState, Action, DataSource } from '../types';
import dayjs from 'dayjs';

const STORAGE_KEY = 'weather-dashboard-state';

// Default data sources with both live and mock options
const defaultDataSources: DataSource[] = [
  {
    id: 'open-meteo',
    name: 'Open-Meteo',
    description: 'Free weather API with global coverage',
    apiUrl: 'https://api.open-meteo.com/v1/forecast',
    isLive: true,
    parameters: ['temperature_2m', 'relative_humidity_2m', 'wind_speed_10m', 'precipitation']
  },
  {
    id: 'mock-tropical',
    name: 'Mock - Tropical Climate', 
    description: 'Simulated tropical weather patterns',
    isLive: false,
    parameters: ['temperature', 'humidity', 'wind_speed', 'precipitation']
  }
];

const initialState: AppState = {
  polygons: [],
  selectedTime: { 
    start: dayjs().subtract(1, 'hour').toISOString(),
    end: dayjs().toISOString()
  },
  colorRules: {
    'temperature_2m': [
      { operator: '<', value: 10, color: '#3b82f6', label: 'Cold' },
      { operator: '>=', value: 10, color: '#ef4444', label: 'Hot' },
    ],
    'open-meteo': [
      { operator: '<', value: 10, color: '#3b82f6', label: 'Cold' },
      { operator: '>=', value: 10, color: '#10b981', label: 'Mild' },
      { operator: '>=', value: 25, color: '#f59e0b', label: 'Warm' },
      { operator: '>=', value: 35, color: '#ef4444', label: 'Hot' }
    ],
    'mock-tropical': [
      { operator: '<', value: 25, color: '#10b981', label: 'Comfortable' },
      { operator: '>=', value: 25, color: '#f59e0b', label: 'Warm' },
      { operator: '>=', value: 32, color: '#ef4444', label: 'Very Hot' }
    ],
    'mock-temperate': [
      { operator: '<', value: 5, color: '#3b82f6', label: 'Cold' },
      { operator: '>=', value: 5, color: '#10b981', label: 'Cool' },
      { operator: '>=', value: 20, color: '#f59e0b', label: 'Warm' }
    ]
  },
  dataSources: defaultDataSources,
  selectedDataSource: 'open-meteo',
  focusedPolygonId: null,
  weatherCache: {},
  animationsEnabled: true
};

// Utility functions for localStorage
const saveToStorage = (state: AppState) => {
  try {
    const stateToSave = {
      polygons: state.polygons,
      colorRules: state.colorRules,
      selectedDataSource: state.selectedDataSource,
      animationsEnabled: state.animationsEnabled
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
  } catch (error) {
    console.warn('Failed to save state to localStorage:', error);
  }
};

const loadFromStorage = (): Partial<AppState> | null => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.warn('Failed to load state from localStorage:', error);
  }
  return null;
};

// Clear expired cache entries
const clearExpiredCache = (cache: AppState['weatherCache']) => {
  const now = Date.now();
  const cleaned = { ...cache };
  
  Object.keys(cleaned).forEach(key => {
    if (cleaned[key].expires < now) {
      delete cleaned[key];
    }
  });
  
  return cleaned;
};

function appReducer(state: AppState, action: Action): AppState {
  let newState: AppState;
  
  switch (action.type) {
    case 'ADD_POLYGON':
      newState = { ...state, polygons: [...state.polygons, action.payload] };
      break;
    case 'DELETE_POLYGON':
      newState = {
        ...state,
        polygons: state.polygons.filter(p => p.id !== action.payload),
      };
      break;
    case 'UPDATE_POLYGON':
      newState = {
        ...state,
        polygons: state.polygons.map(p => 
          p.id === action.payload.id 
            ? { ...p, ...action.payload.updates }
            : p
        )
      };
      break;
    case 'FOCUS_POLYGON':
      newState = { ...state, focusedPolygonId: action.payload };
      break;
    case 'SET_TIME':
      newState = { ...state, selectedTime: action.payload };
      break;
    case 'SET_COLOR_RULES':
      newState = { ...state, colorRules: { ...state.colorRules, ...action.payload } };
      break;
    case 'SET_DATA_SOURCE':
      newState = { ...state, selectedDataSource: action.payload };
      break;
    case 'ADD_DATA_SOURCE':
      newState = { 
        ...state, 
        dataSources: [...state.dataSources, action.payload] 
      };
      break;
    case 'SET_WEATHER_DATA':
      newState = {
        ...state,
        polygons: state.polygons.map(p =>
          p.id === action.payload.polygonId
            ? { ...p, weatherData: action.payload.data, lastUpdated: new Date().toISOString() }
            : p
        )
      };
      break;
    case 'SET_CACHE':
      newState = {
        ...state,
        weatherCache: {
          ...state.weatherCache,
          [action.payload.key]: {
            data: action.payload.data,
            timestamp: Date.now(),
            expires: Date.now() + action.payload.ttl
          }
        }
      };
      break;
    case 'CLEAR_EXPIRED_CACHE':
      newState = {
        ...state,
        weatherCache: clearExpiredCache(state.weatherCache)
      };
      break;
    case 'TOGGLE_ANIMATIONS':
      newState = { ...state, animationsEnabled: !state.animationsEnabled };
      break;
    case 'LOAD_FROM_STORAGE':
      newState = { ...state, ...action.payload };
      break;
    default:
      return state;
  }
  
  // Save to localStorage after state updates (except for cache operations)
  if (action.type !== 'SET_CACHE' && action.type !== 'CLEAR_EXPIRED_CACHE' && action.type !== 'LOAD_FROM_STORAGE') {
    saveToStorage(newState);
  }
  
  return newState;
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
}>({ state: initialState, dispatch: () => null });

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load state from localStorage on mount
  useEffect(() => {
    const savedState = loadFromStorage();
    if (savedState) {
      dispatch({ type: 'LOAD_FROM_STORAGE', payload: savedState });
    }
  }, []);

  // Clear expired cache periodically
  useEffect(() => {
    const interval = setInterval(() => {
      dispatch({ type: 'CLEAR_EXPIRED_CACHE' });
    }, 30 * 60 * 1000); // 30 minutes

    return () => clearInterval(interval);
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
