import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { useMap } from 'react-leaflet';
import { useAppContext } from '../../context/AppContext';
import { v4 as uuidv4 } from 'uuid';

// Import leaflet-draw CSS
import 'leaflet-draw/dist/leaflet.draw.css';

// Extend the Leaflet types to include draw events
declare global {
  namespace L {
    namespace Draw {
      const Event: {
        CREATED: string;
        EDITED: string;
        DELETED: string;
        DRAWSTART: string;
        DRAWSTOP: string;
        DRAWVERTEX: string;
        EDITSTART: string;
        EDITMOVE: string;
        EDITRESIZE: string;
        EDITSTOP: string;
        DELETESTART: string;
        DELETESTOP: string;
      };
    }
  }
}

const PolygonTools: React.FC = () => {
  const map = useMap();
  const { state, dispatch } = useAppContext();
  const drawnItemsRef = useRef<L.FeatureGroup | null>(null);
  const controlRef = useRef<any>(null);

  useEffect(() => {
    if (!map) return;

    console.log('PolygonTools v3: Initializing with map:', map);

    // Load leaflet-draw dynamically
    const loadDrawLibrary = async () => {
      try {
        // Import leaflet-draw
        await import('leaflet-draw');
        
        console.log('Leaflet-draw loaded successfully');

        // Create a feature group for drawn items
        const drawnItems = new L.FeatureGroup();
        map.addLayer(drawnItems);
        drawnItemsRef.current = drawnItems;

        // Create drawing control
        const drawControl = new (L.Control as any).Draw({
          position: 'topright',
          draw: {
            polyline: false,
            marker: false,
            circle: false,
            circlemarker: false,
            polygon: {
              allowIntersection: false,
              drawError: {
                color: '#e1e100',
                message: '<strong>Error:</strong> Shape edges cannot cross!',
              },
              shapeOptions: {
                color: '#97009c',
                weight: 2,
                opacity: 0.8,
                fillOpacity: 0.3,
              },
              showArea: false,
              metric: false,
              feet: false,
            },
            rectangle: {
              shapeOptions: {
                color: '#97009c',
                weight: 2,
                opacity: 0.8,
                fillOpacity: 0.3,
              },
              showArea: false,
              metric: false,
              feet: false,
            },
          },
          edit: {
            featureGroup: drawnItems,
            remove: true,
          },
        });

        controlRef.current = drawControl;
        console.log('Adding draw control to map:', drawControl);
        map.addControl(drawControl);

        // Handle polygon creation
        const handleCreated = (e: any) => {
          console.log('Polygon created event:', e);
          
          try {
            const { layer, layerType } = e;
            let coordinates: [number, number][] = [];
            
            if (layerType === 'polygon') {
              const latlngs = layer.getLatLngs()[0];
              
              // Validate polygon has 3-12 points
              if (latlngs.length < 3) {
                alert('Polygon must have at least 3 points.');
                return;
              }
              if (latlngs.length > 12) {
                alert('Polygon cannot have more than 12 points. Please draw a simpler shape.');
                return;
              }
              
              coordinates = latlngs.map((point: L.LatLng) => [point.lat, point.lng]);
            } else if (layerType === 'rectangle') {
              const bounds = layer.getBounds();
              coordinates = [
                [bounds.getNorth(), bounds.getWest()],
                [bounds.getNorth(), bounds.getEast()],
                [bounds.getSouth(), bounds.getEast()],
                [bounds.getSouth(), bounds.getWest()],
              ];
            }

            if (coordinates.length === 0) {
              console.error('Failed to extract coordinates from layer');
              return;
            }

            const id = uuidv4();
            
            // Calculate center point for location detection
            const centerLat = coordinates.reduce((sum, coord) => sum + coord[0], 0) / coordinates.length;
            const centerLon = coordinates.reduce((sum, coord) => sum + coord[1], 0) / coordinates.length;
            
            // Simple location name (can be enhanced later)
            const defaultLabel = layerType === 'rectangle' 
              ? `Rectangle Area (${centerLat.toFixed(3)}, ${centerLon.toFixed(3)})`
              : `Polygon Area (${coordinates.length} points)`;

            // Prompt user for a custom label
            const userLabel = prompt(
              `Name this ${layerType}:`, 
              defaultLabel
            );
            
            if (userLabel === null) {
              // User cancelled, don't create polygon
              return;
            }

            const finalLabel = userLabel.trim() || defaultLabel;
            
            const newPolygon = {
              id,
              coordinates,
              dataSource: state.selectedDataSource || 'open-meteo',
              label: finalLabel,
            };

            // Add to our React state
            dispatch({
              type: 'ADD_POLYGON',
              payload: newPolygon,
            });

            // Add to drawn items for editing/deletion
            if (drawnItemsRef.current) {
              drawnItemsRef.current.addLayer(layer);
              // Store reference for deletion
              (layer as any)._polygonId = id;
              
              // Add a tooltip showing the polygon label
              layer.bindTooltip(finalLabel, {
                permanent: false,
                direction: 'center',
                className: 'polygon-tooltip'
              });
            }
            
            console.log('Polygon created successfully:', newPolygon);
          } catch (error) {
            console.error('Error creating polygon:', error);
            alert('Failed to create polygon. Please try again.');
          }
        };

        // Handle polygon deletion
        const handleDeleted = (e: any) => {
          try {
            const layers = e.layers;
            layers.eachLayer((layer: any) => {
              if (layer._polygonId) {
                dispatch({
                  type: 'DELETE_POLYGON',
                  payload: layer._polygonId,
                });
                console.log('Polygon deleted:', layer._polygonId);
              }
            });
          } catch (error) {
            console.error('Error deleting polygon:', error);
          }
        };

        // Attach event listeners using the actual event constants
        map.on('draw:created', handleCreated);
        map.on('draw:deleted', handleDeleted);

        console.log('Event listeners attached successfully');

        // Test that the controls are working
        console.log('Draw control methods available:', Object.keys(drawControl));

        return () => {
          console.log('Cleaning up PolygonTools');
          map.off('draw:created', handleCreated);
          map.off('draw:deleted', handleDeleted);
          if (controlRef.current) {
            map.removeControl(controlRef.current);
          }
          if (drawnItemsRef.current) {
            map.removeLayer(drawnItemsRef.current);
          }
        };

      } catch (error) {
        console.error('Failed to load leaflet-draw:', error);
      }
    };

    loadDrawLibrary();

  }, [map, dispatch, state.selectedDataSource]);

  return null;
};

export default PolygonTools;
