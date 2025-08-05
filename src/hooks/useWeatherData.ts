import { useState, useEffect } from 'react';
import { fetchWeatherData } from '../api/weatherApi';

export const useWeatherData = (lat: number, lon: number, startTime?: string, endTime?: string) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!lat || !lon) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchWeatherData(lat, lon);
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch weather data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [lat, lon, startTime, endTime]);

  return { data, loading, error };
};
