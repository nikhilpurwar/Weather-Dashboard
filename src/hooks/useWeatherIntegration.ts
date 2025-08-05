import { useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { fetchPolygonWeatherData, type PolygonWeatherData } from '../api/weatherApi';
import type { ColorRule } from '../types';

export const useWeatherIntegration = () => {
  const { state } = useAppContext();
  const [polygonWeatherData, setPolygonWeatherData] = useState<{[key: string]: PolygonWeatherData}>({});
  const [loading, setLoading] = useState(false);

  // Fetch weather data for all polygons when time range or polygons change
  useEffect(() => {
    const fetchAllPolygonData = async () => {
      if (state.polygons.length === 0) {
        setPolygonWeatherData({});
        return;
      }

      setLoading(true);
      const weatherPromises = state.polygons.map(polygon =>
        fetchPolygonWeatherData(
          polygon.id,
          polygon.coordinates,
          polygon.dataSource,
          state.selectedTime.start || undefined,
          state.selectedTime.end || undefined
        )
      );

      try {
        const results = await Promise.all(weatherPromises);
        const weatherMap = results.reduce((acc, data) => {
          acc[data.polygonId] = data;
          return acc;
        }, {} as {[key: string]: PolygonWeatherData});
        
        setPolygonWeatherData(weatherMap);
      } catch (error) {
        console.error('Failed to fetch weather data for polygons:', error);
      } finally {
        setLoading(false);
      }
    };

    // Debounce the API calls
    const timeoutId = setTimeout(fetchAllPolygonData, 500);
    return () => clearTimeout(timeoutId);
  }, [state.polygons, state.selectedTime]);

  // Function to get polygon color based on weather data and rules
  const getPolygonColor = (polygonId: string): string => {
    const weatherData = polygonWeatherData[polygonId];
    if (!weatherData) return '#6b7280'; // Gray if no data

    const polygon = state.polygons.find(p => p.id === polygonId);
    if (!polygon) return '#6b7280';

    const rules = state.colorRules[polygon.dataSource] || [];
    if (rules.length === 0) return '#3b82f6'; // Default blue

    // Apply rules in order
    for (const rule of rules) {
      if (matchesRule(weatherData.averageValue, rule)) {
        return rule.color;
      }
    }

    return '#6b7280'; // Default gray if no rules match
  };

  // Check if a value matches a color rule
  const matchesRule = (value: number, rule: ColorRule): boolean => {
    switch (rule.operator) {
      case '<':
        return value < rule.value;
      case '<=':
        return value <= rule.value;
      case '=':
        return Math.abs(value - rule.value) < 0.1; // Allow small tolerance for equality
      case '>=':
        return value >= rule.value;
      case '>':
        return value > rule.value;
      default:
        return false;
    }
  };

  return {
    polygonWeatherData,
    loading,
    getPolygonColor,
  };
};
