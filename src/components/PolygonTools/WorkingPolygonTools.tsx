import { useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet-draw';
import { useMap } from 'react-leaflet';
import { useAppContext } from '../../context/AppContext';
import { getPolygonColor, getPolygonOpacity } from '../../utils/colorUtils';
import { v4 as uuidv4 } from 'uuid';

// Import CSS
import 'leaflet-draw/dist/leaflet.draw.css';

const WorkingPolygonTools: React.FC = () => {
  const map = useMap();
  const { state, dispatch } = useAppContext();
  const drawnItemsRef = useRef<L.FeatureGroup | null>(null);
  const drawControlRef = useRef<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const isInitializedRef = useRef(false);
  const polygonLayersRef = useRef<Map<string, L.Layer>>(new Map());

  // Helper function to update polygon color based on weather data
  const updatePolygonColor = useCallback((layer: any, polygonId: string) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    const polygon = state.polygons.find(p => p.id === polygonId);
    if (!polygon || !polygon.weatherData) return;

    const colorRules = state.colorRules[state.selectedDataSource] || [];
    const selectedParameter = state.selectedParameter;
    
    // Get weather data - use first data point for current conditions
    const weatherData = {
      hourly: {
        temperature_2m: polygon.weatherData.map(d => d.temperature),
        relative_humidity_2m: polygon.weatherData.map(d => d.humidity),
        wind_speed_10m: polygon.weatherData.map(d => d.windSpeed),
        precipitation: polygon.weatherData.map(d => d.precipitation),
      }
    };

    const newColor = getPolygonColor(weatherData, selectedParameter, colorRules);
    const newOpacity = getPolygonOpacity(weatherData.hourly.temperature_2m[0] || 20, selectedParameter);

    // Update layer style
    if (layer && layer.setStyle) {
      layer.setStyle({
        color: newColor,
        fillColor: newColor,
        fillOpacity: newOpacity,
        weight: 2,
        opacity: 0.8,
      });
      console.log(`Updated polygon ${polygonId} color to ${newColor}`);
    }
  }, [state.polygons, state.colorRules, state.selectedDataSource, state.selectedParameter]);

  useEffect(() => {
    if (!map || isInitializedRef.current) {
      return;
    }

    console.log('WorkingPolygonTools: Setting up drawing controls');

    // Wait for map to be ready
    map.whenReady(() => {
      try {
        console.log('Map is ready, initializing draw controls');
        
        // Create feature group for drawn items
        const drawnItems = new L.FeatureGroup();
        map.addLayer(drawnItems);
        drawnItemsRef.current = drawnItems;
        console.log('Feature group created and added to map');

        // Create simple draw control with dynamic colors
        const getDefaultShapeOptions = () => {
          const defaultColor = '#97009c'; // Default purple
          return {
            color: defaultColor,
            weight: 2,
            opacity: 0.8,
            fillOpacity: 0.3,
          };
        };

        const drawControl = new L.Control.Draw({
          position: 'topright', // This will be manually repositioned
          draw: {
            polygon: {
              allowIntersection: false,
              drawError: {
                color: '#e1e100',
                message: '<strong>Error:</strong> Shape edges cannot cross!',
              },
              shapeOptions: getDefaultShapeOptions(),
              showArea: false,
              metric: false,
              feet: false,
            },
            rectangle: {
              shapeOptions: getDefaultShapeOptions(),
              showArea: false,
              metric: false,
            },
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
        console.log('Adding draw control to map:', drawControl);
        map.addControl(drawControl);
        
        // Force the control to appear on the right side below zoom controls
        setTimeout(() => {
          const drawContainer = drawControl.getContainer();
          if (drawContainer) {
            // Find the leaflet top-right container
            const topRightContainer = map.getContainer().querySelector('.leaflet-top.leaflet-right');
            if (topRightContainer) {
              // Remove from current position if already there
              if (drawContainer.parentElement) {
                drawContainer.parentElement.removeChild(drawContainer);
              }
              
              // Add to top-right container
              topRightContainer.appendChild(drawContainer);
              
              // Style the container to position it below zoom controls
              drawContainer.style.marginTop = '90px'; // Space for zoom controls + padding
              drawContainer.style.marginRight = '0px';
              drawContainer.style.marginLeft = '0px';
              drawContainer.style.position = 'relative';
              
              console.log('Draw controls repositioned below zoom controls');
            }
          }
        }, 100);
        
        console.log('Draw control added to map successfully');

        // Event handlers with eslint-disable for any types
        const onDrawCreated = async (e: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
          console.log('onDrawCreated called with:', e);
          
          const { layer, layerType } = e;
          drawnItems.addLayer(layer);
          
          // Extract coordinates
          let coordinates: [number, number][] = [];
          
          if (layerType === 'polygon') {
            const latLngs = layer.getLatLngs()[0];
            coordinates = latLngs.map((point: L.LatLng) => [point.lat, point.lng]);
          } else if (layerType === 'rectangle') {
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
            
            // Calculate center point for location detection
            const centerLat = coordinates.reduce((sum, coord) => sum + coord[0], 0) / coordinates.length;
            const centerLon = coordinates.reduce((sum, coord) => sum + coord[1], 0) / coordinates.length;
            
            // Get location name using reverse geocoding
            let detectedLocation = '';
            try {
              const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${centerLat}&lon=${centerLon}&zoom=18&addressdetails=1`
              );
              const data = await response.json();
              
              if (data && data.display_name) {
                // Extract meaningful parts of the address
                const address = data.address || {};
                const parts = [];
                
                if (address.neighbourhood) parts.push(address.neighbourhood);
                else if (address.suburb) parts.push(address.suburb);
                else if (address.village) parts.push(address.village);
                else if (address.town) parts.push(address.town);
                else if (address.city) parts.push(address.city);
                
                if (address.state_district && !parts.length) parts.push(address.state_district);
                if (address.state) parts.push(address.state);
                
                detectedLocation = parts.slice(0, 2).join(', ') || 'Unknown Location';
              }
            } catch (error) {
              console.warn('Failed to fetch location:', error);
              detectedLocation = `Location (${centerLat.toFixed(3)}, ${centerLon.toFixed(3)})`;
            }
            
            // Create default label with detected location
            const defaultLabel = `${detectedLocation} - ${layerType}`;
            
            // Prompt user for a custom label with detected location pre-filled
            const userLabel = prompt(
              `Name this ${layerType}:`, 
              defaultLabel
            );
            
            if (userLabel === null) {
              // User cancelled, remove the layer and don't create polygon
              drawnItems.removeLayer(layer);
              return;
            }

            const finalLabel = userLabel.trim() || defaultLabel;
            
            const newPolygon = {
              id,
              coordinates,
              dataSource: state.selectedDataSource || 'open-meteo',
              label: finalLabel,
            };
            
            // Store polygon ID on layer for deletion and future color updates
            (layer as any)._polygonId = id; // eslint-disable-line @typescript-eslint/no-explicit-any
            (layer as any)._layerRef = layer; // eslint-disable-line @typescript-eslint/no-explicit-any
            
            // Store layer reference for future color updates
            polygonLayersRef.current.set(id, layer);
            
            // Add tooltip with label
            layer.bindTooltip(finalLabel, {
              permanent: false,
              direction: 'center',
              className: 'polygon-tooltip'
            });
            
            dispatch({
              type: 'ADD_POLYGON',
              payload: newPolygon,
            });
            
            console.log('Polygon added:', newPolygon);
            
            // Update polygon color after weather data loads (with a delay)
            setTimeout(() => {
              updatePolygonColor(layer, id);
            }, 2000);
          }
        };

        const onDrawDeleted = (e: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
          console.log('onDrawDeleted called with:', e);
          
          e.layers.eachLayer((layer: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
            if (layer._polygonId) {
              // Remove from layer reference
              polygonLayersRef.current.delete(layer._polygonId);
              
              dispatch({
                type: 'DELETE_POLYGON',
                payload: layer._polygonId,
              });
              console.log('Polygon deleted:', layer._polygonId);
            }
          });
        };

        // Attach event listeners using string events to avoid type issues
        map.on('draw:created', onDrawCreated);
        map.on('draw:deleted', onDrawDeleted);

        console.log('Event listeners attached');

        // Mark as initialized to prevent duplicate setup
        isInitializedRef.current = true;

        // Return cleanup function
        return () => {
          console.log('Cleaning up WorkingPolygonTools');
          map.off('draw:created', onDrawCreated);
          map.off('draw:deleted', onDrawDeleted);
          
          if (drawControlRef.current) {
            map.removeControl(drawControlRef.current);
          }
          
          if (drawnItemsRef.current) {
            map.removeLayer(drawnItemsRef.current);
          }
          
          // Reset initialization flag
          isInitializedRef.current = false;
        };

      } catch (error) {
        console.error('Error setting up draw controls:', error);
      }
    });

  }, [map, dispatch, state.selectedDataSource, state.selectedParameter, updatePolygonColor]);

  // Separate useEffect to update polygon colors when weather data changes
  useEffect(() => {
    // Update colors for all polygons when weather data or color rules change
    state.polygons.forEach(polygon => {
      if (polygon.weatherData && polygon.weatherData.length > 0) {
        const layer = polygonLayersRef.current.get(polygon.id);
        if (layer) {
          updatePolygonColor(layer, polygon.id);
        }
      }
    });
  }, [state.polygons, state.colorRules, state.selectedDataSource, state.selectedParameter, updatePolygonColor]);

  return null;
};

export default WorkingPolygonTools;
