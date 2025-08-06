import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet-draw';
import { useMap } from 'react-leaflet';
import { useAppContext } from '../../context/AppContext';
import { v4 as uuidv4 } from 'uuid';

// Import CSS
import 'leaflet-draw/dist/leaflet.draw.css';

const BasicPolygonTools: React.FC = () => {
  const map = useMap();
  const { state, dispatch } = useAppContext();
  const drawnItemsRef = useRef<L.FeatureGroup | null>(null);
  const drawControlRef = useRef<L.Control.Draw | null>(null);

  useEffect(() => {
    if (!map) {
      console.log('No map available');
      return;
    }

    console.log('BasicPolygonTools: Setting up drawing controls');

    // Wait for map to be ready
    map.whenReady(() => {
      try {
        console.log('Map is ready, initializing draw controls');
        
        // Create feature group for drawn items
        const drawnItems = new L.FeatureGroup();
        map.addLayer(drawnItems);
        drawnItemsRef.current = drawnItems;
        console.log('Feature group created and added to map');

        // Create simple draw control
        const drawControl = new L.Control.Draw({
          position: 'topright',
          draw: {
            polygon: true,
            rectangle: true,
            polyline: false,
            circle: false,
            marker: false,
            circlemarker: false,
          },
          edit: {
            featureGroup: drawnItems,
            remove: true,
          },
        });

        drawControlRef.current = drawControl;
        map.addControl(drawControl);
        console.log('Draw control added to map successfully');

        // Event handlers
        const onDrawCreated = (e: L.DrawEvents.Created) => {
          console.log('onDrawCreated called with:', e);
          
          const { layer, layerType } = e;
          drawnItems.addLayer(layer);
          
          // Extract coordinates
          let coordinates: [number, number][] = [];
          
          if (layerType === 'polygon') {
            const polygon = layer as L.Polygon;
            const latLngs = polygon.getLatLngs()[0] as L.LatLng[];
            coordinates = latLngs.map(point => [point.lat, point.lng]);
          } else if (layerType === 'rectangle') {
            const rectangle = layer as L.Rectangle;
            const bounds = rectangle.getBounds();
            coordinates = [
              [bounds.getNorth(), bounds.getWest()],
              [bounds.getNorth(), bounds.getEast()],
              [bounds.getSouth(), bounds.getEast()],
              [bounds.getSouth(), bounds.getWest()],
            ];
          }
          
          if (coordinates.length > 0) {
            const id = uuidv4();
            const label = `${layerType} ${id.slice(0, 8)}`;
            
            const newPolygon = {
              id,
              coordinates,
              dataSource: state.selectedDataSource || 'open-meteo',
              label,
            };
            
            // Store polygon ID on layer for deletion
            (layer as any)._polygonId = id;
            
            dispatch({
              type: 'ADD_POLYGON',
              payload: newPolygon,
            });
            
            console.log('Polygon added:', newPolygon);
          }
        };

        const onDrawDeleted = (e: L.DrawEvents.Deleted) => {
          console.log('onDrawDeleted called with:', e);
          
          e.layers.eachLayer((layer: any) => {
            if (layer._polygonId) {
              dispatch({
                type: 'DELETE_POLYGON',
                payload: layer._polygonId,
              });
              console.log('Polygon deleted:', layer._polygonId);
            }
          });
        };

        // Attach event listeners
        map.on(L.Draw.Event.CREATED, onDrawCreated);
        map.on(L.Draw.Event.DELETED, onDrawDeleted);

        console.log('Event listeners attached');

        // Return cleanup function
        return () => {
          console.log('Cleaning up BasicPolygonTools');
          map.off(L.Draw.Event.CREATED, onDrawCreated);
          map.off(L.Draw.Event.DELETED, onDrawDeleted);
          
          if (drawControlRef.current) {
            map.removeControl(drawControlRef.current);
          }
          
          if (drawnItemsRef.current) {
            map.removeLayer(drawnItemsRef.current);
          }
        };

      } catch (error) {
        console.error('Error setting up draw controls:', error);
      }
    });

  }, [map, dispatch, state.selectedDataSource]);

  return null;
};

export default BasicPolygonTools;
