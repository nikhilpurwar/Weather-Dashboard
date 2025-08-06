import type { ColorRule } from '../types';

/**
 * Get color based on temperature danger levels (default coloring)
 */
export const getTemperatureDangerColor = (temperature: number): string => {
  // Temperature danger levels in Celsius
  if (temperature <= 0) return '#000080'; // Navy blue - freezing
  if (temperature <= 10) return '#0066CC'; // Blue - very cold
  if (temperature <= 20) return '#00CC66'; // Green - comfortable
  if (temperature <= 30) return '#FFCC00'; // Yellow - warm
  if (temperature <= 35) return '#FF6600'; // Orange - hot
  if (temperature <= 40) return '#FF0000'; // Red - very hot
  return '#800000'; // Dark red - extreme heat
};

/**
 * Get color based on custom color rules
 */
export const getColorFromRules = (value: number, rules: ColorRule[]): string | null => {
  if (!rules || rules.length === 0) return null;

  // Sort rules by value to ensure proper precedence
  const sortedRules = [...rules].sort((a, b) => a.value - b.value);

  for (const rule of sortedRules) {
    switch (rule.operator) {
      case '<':
        if (value < rule.value) return rule.color;
        break;
      case '<=':
        if (value <= rule.value) return rule.color;
        break;
      case '=':
        if (Math.abs(value - rule.value) < 0.1) return rule.color; // Allow small tolerance
        break;
      case '>=':
        if (value >= rule.value) return rule.color;
        break;
      case '>':
        if (value > rule.value) return rule.color;
        break;
    }
  }

  return null;
};

/**
 * Get polygon color based on weather data and color rules
 */
export const getPolygonColor = (
  weatherData: { hourly?: Record<string, number[]> } | null,
  selectedParameter: string,
  colorRules: ColorRule[]
): string => {
  if (!weatherData || !weatherData.hourly) {
    return '#97009c'; // Default purple color
  }

  // Get current or latest temperature value
  const hourlyData = weatherData.hourly;
  let currentValue: number;

  switch (selectedParameter) {
    case 'temperature':
      currentValue = hourlyData.temperature_2m?.[0] || 20;
      break;
    case 'humidity':
      currentValue = hourlyData.relative_humidity_2m?.[0] || 50;
      break;
    case 'windSpeed':
      currentValue = hourlyData.wind_speed_10m?.[0] || 0;
      break;
    case 'precipitation':
      currentValue = hourlyData.precipitation?.[0] || 0;
      break;
    default:
      currentValue = hourlyData.temperature_2m?.[0] || 20;
  }

  // First, try to get color from custom rules
  const ruleColor = getColorFromRules(currentValue, colorRules);
  if (ruleColor) {
    return ruleColor;
  }

  // Fallback to temperature danger color if no rules match
  if (selectedParameter === 'temperature') {
    return getTemperatureDangerColor(currentValue);
  }

  // Default color for other parameters
  return '#97009c';
};

/**
 * Get opacity based on value intensity
 */
export const getPolygonOpacity = (value: number, parameter: string): number => {
  switch (parameter) {
    case 'temperature':
      // Higher opacity for extreme temperatures
      if (value <= 0 || value >= 40) return 0.8;
      if (value <= 10 || value >= 35) return 0.6;
      return 0.4;
    case 'humidity':
      // Higher opacity for very high/low humidity
      if (value <= 20 || value >= 80) return 0.8;
      return 0.5;
    case 'windSpeed':
      // Higher opacity for high wind speeds
      if (value >= 20) return 0.8;
      if (value >= 10) return 0.6;
      return 0.4;
    case 'precipitation':
      // Higher opacity for heavy precipitation
      if (value >= 10) return 0.8;
      if (value >= 5) return 0.6;
      return 0.4;
    default:
      return 0.5;
  }
};
