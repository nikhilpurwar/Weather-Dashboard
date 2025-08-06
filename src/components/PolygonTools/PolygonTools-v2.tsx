import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { useMap } from 'react-leaflet';
import { useAppContext } from '../../context/AppContext';
import { v4 as uuidv4 } from 'uuid';

// Import leaflet-draw CSS directly
import 'leaflet-draw/dist/leaflet.draw.css';

const PolygonTools: React.FC = () => {
  const map = useMap();
  const { state, dispatch } = useAppContext();
  const drawnItemsRef = useRef<L.FeatureGroup | null>(null);
  const controlRef = useRef<L.Control.Draw | null>(null);

  useEffect(() => {
    if (!map) return;

    console.log('PolygonTools: Initializing with map:', map);

    // Import leaflet-draw dynamically to avoid SSR issues
    import('leaflet-draw').then(() => {
      console.log('Leaflet-draw loaded successfully');

      // Create a feature group for drawn items
      const drawnItems = new L.FeatureGroup();
      map.addLayer(drawnItems);
      drawnItemsRef.current = drawnItems;

      // Create drawing options
      const drawOptions = {
        position: 'topright' as L.ControlPosition,
        draw: {
          polyline: false as const,
          marker: false as const,
          circle: false as const,
          circlemarker: false as const,
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
      };

      // Create the draw control
      const drawControl = new L.Control.Draw(drawOptions);
      controlRef.current = drawControl;

      console.log('Adding draw control to map:', drawControl);
      map.addControl(drawControl);

      // Handle polygon creation
      const handleCreated = async (e: L.DrawEvents.Created) => {
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

      // Attach event listeners
      map.on(L.Draw.Event.CREATED, handleCreated);
      map.on(L.Draw.Event.DELETED, handleDeleted);

      console.log('Event listeners attached successfully');

      // Cleanup function
      return () => {
        console.log('Cleaning up PolygonTools');
        map.off(L.Draw.Event.CREATED, handleCreated);
        map.off(L.Draw.Event.DELETED, handleDeleted);
        if (controlRef.current) {
          map.removeControl(controlRef.current);
        }
        if (drawnItemsRef.current) {
          map.removeLayer(drawnItemsRef.current);
        }
      };
    }).catch((error) => {
      console.error('Failed to load leaflet-draw:', error);
    });
  }, [map, dispatch, state.selectedDataSource]);

  return null;
};

export default PolygonTools;
