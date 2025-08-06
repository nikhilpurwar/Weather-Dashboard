import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { useMap } from 'react-leaflet';
import { useAppContext } from '../../context/AppContext';
import { v4 as uuidv4 } from 'uuid';

// Force load leaflet-draw CSS
import 'leaflet-draw/dist/leaflet.draw.css';

const PolygonToolsSimple: React.FC = () => {
  const map = useMap();
  const { state, dispatch } = useAppContext();
  const isInitialized = useRef(false);

  useEffect(() => {
    if (!map || isInitialized.current) return;
    
    console.log('PolygonToolsSimple: Starting initialization');

    // Wait for map to be fully loaded
    const initializeAfterMapLoad = () => {
      try {
        // Import leaflet-draw and initialize
        import('leaflet-draw').then(() => {
          console.log('Leaflet-draw imported successfully');
          
          // Add a feature group for drawn items
          const drawnItems = new L.FeatureGroup();
          map.addLayer(drawnItems);
          console.log('Feature group added to map');

          // Create draw controls with minimal config
          const drawControlOptions = {
            position: 'topright',
            draw: {
              polygon: {
                shapeOptions: {
                  color: '#97009c',
                  weight: 2,
                  opacity: 0.8,
                  fillOpacity: 0.3,
                }
              },
              rectangle: {
                shapeOptions: {
                  color: '#97009c', 
                  weight: 2,
                  opacity: 0.8,
                  fillOpacity: 0.3,
                }
              },
              polyline: false,
              circle: false,
              marker: false,
              circlemarker: false,
            },
            edit: {
              featureGroup: drawnItems,
              remove: true
            }
          };

          // Create the draw control using any to bypass type issues
          const DrawControl = (L.Control as any).Draw;
          const drawControl = new DrawControl(drawControlOptions);
          
          console.log('Draw control created:', drawControl);
          map.addControl(drawControl);
          console.log('Draw control added to map');

          // Simple event handlers
          map.on('draw:created', function (e: any) {
            console.log('Draw created event fired:', e);
            
            const layer = e.layer;
            const type = e.layerType;
            
            console.log('Layer created:', { layer, type });
            
            // Add layer to feature group
            drawnItems.addLayer(layer);
            
            // Extract coordinates based on type
            let coordinates: [number, number][] = [];
            
            if (type === 'polygon') {
              const latlngs = layer.getLatLngs()[0];
              coordinates = latlngs.map((point: L.LatLng) => [point.lat, point.lng]);
            } else if (type === 'rectangle') {
              const bounds = layer.getBounds();
              coordinates = [
                [bounds.getNorth(), bounds.getWest()],
                [bounds.getNorth(), bounds.getEast()], 
                [bounds.getSouth(), bounds.getEast()],
                [bounds.getSouth(), bounds.getWest()],
              ];
            }
            
            if (coordinates.length > 0) {
              const id = uuidv4();
              const label = `${type.charAt(0).toUpperCase() + type.slice(1)} ${id.slice(0, 8)}`;
              
              const polygon = {
                id,
                coordinates,
                dataSource: state.selectedDataSource || 'open-meteo',
                label,
              };
              
              // Store ID on layer for deletion
              (layer as any)._polygonId = id;
              
              // Add to state
              dispatch({
                type: 'ADD_POLYGON',
                payload: polygon,
              });
              
              console.log('Polygon added to state:', polygon);
            }
          });
          
          map.on('draw:deleted', function (e: any) {
            console.log('Draw deleted event fired:', e);
            
            e.layers.eachLayer(function (layer: any) {
              if (layer._polygonId) {
                dispatch({
                  type: 'DELETE_POLYGON',
                  payload: layer._polygonId,
                });
                console.log('Polygon deleted from state:', layer._polygonId);
              }
            });
          });
          
          isInitialized.current = true;
          console.log('PolygonToolsSimple: Initialization complete');
          
        }).catch((error) => {
          console.error('Failed to import leaflet-draw:', error);
        });
        
      } catch (error) {
        console.error('Error in initializeAfterMapLoad:', error);
      }
    };

    // Initialize immediately or after a short delay
    if (map.getContainer()) {
      setTimeout(initializeAfterMapLoad, 100);
    } else {
      map.whenReady(initializeAfterMapLoad);
    }

  }, [map, dispatch, state.selectedDataSource]);

  return null;
};

export default PolygonToolsSimple;
