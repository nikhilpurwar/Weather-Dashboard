import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-draw';

const SimplePolygonTools = () => {
  const map = useMap();

  useEffect(() => {
    try {
      // Create a feature group to store drawn items
      const drawnItems = new L.FeatureGroup();
      map.addLayer(drawnItems);

      const drawControl = new L.Control.Draw({
        draw: {
          polygon: {
            allowIntersection: false,
            shapeOptions: {
              color: '#3b82f6',
              weight: 2,
              fillOpacity: 0.3,
            },
            showArea: true,
          },
          polyline: false,
          circle: false,
          rectangle: false,
          marker: false,
          circlemarker: false,
        },
        edit: {
          featureGroup: drawnItems,
        },
      });

      map.addControl(drawControl);

      return () => {
        map.removeControl(drawControl);
        map.removeLayer(drawnItems);
      };
    } catch (error) {
      console.error('Error setting up polygon tools:', error);
    }
  }, [map]);

  return null;
};

export default SimplePolygonTools;
