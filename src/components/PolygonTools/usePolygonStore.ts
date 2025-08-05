import { useState, useCallback } from 'react';
import type { PolygonData } from '../../types';

export const usePolygonStore = () => {
  const [polygons, setPolygons] = useState<PolygonData[]>([]);

  const addPolygon = useCallback((polygon: PolygonData) => {
    setPolygons(prev => [...prev, polygon]);
  }, []);

  const removePolygon = useCallback((id: string) => {
    setPolygons(prev => prev.filter(p => p.id !== id));
  }, []);

  const updatePolygon = useCallback((id: string, updates: Partial<PolygonData>) => {
    setPolygons(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }, []);

  return {
    polygons,
    addPolygon,
    removePolygon,
    updatePolygon,
  };
};
