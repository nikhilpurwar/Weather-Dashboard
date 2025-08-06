import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet-draw';
import { v4 as uuidv4 } from 'uuid';
import { useAppContext } from '../../context/AppContext';
import { getLocationNameCached } from '../../utils/geocoding';

interface PolygonToolsProps {
  map: L.Map | null;
}

const PolygonTools: React.FC<PolygonToolsProps> = ({ map }) => {
  const { state, dispatch } = useAppContext();
  const drawnItemsRef = useRef<L.FeatureGroup | null>(null);

  useEffect(() => {
    if (!map) return;

    // Create a feature group for drawn items
    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);
    drawnItemsRef.current = drawnItems;

    // Create the draw control
    const drawControl = new L.Control.Draw({
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
          icon: new L.DivIcon({
            iconSize: new L.Point(8, 8),
            className: 'leaflet-div-icon leaflet-editing-icon',
          }),
          maxPoints: 12,
        },
        rectangle: {
          shapeOptions: {
            color: '#97009c',
            weight: 2,
            opacity: 0.8,
            fillOpacity: 0.3,
          },
        },
      },
      edit: {
        featureGroup: drawnItems,
        remove: true,
      },
    });

    map.addControl(drawControl);

    // Handle polygon creation
    const handleCreated = async (e: L.LeafletEvent) => {
      try {
        const event = e as L.LeafletEvent & { layer: L.Layer; layerType: string };
        const layer = event.layer;
        let coordinates: [number, number][] = [];
        
        if (layer instanceof L.Polygon) {
          const latlngs = layer.getLatLngs()[0] as L.LatLng[];
          
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
        } else if (layer instanceof L.Rectangle) {
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
        const layerType = layer instanceof L.Rectangle ? 'rectangle' : 'polygon';
        
        // Calculate center point for location detection
        const centerLat = coordinates.reduce((sum, coord) => sum + coord[0], 0) / coordinates.length;
        const centerLon = coordinates.reduce((sum, coord) => sum + coord[1], 0) / coordinates.length;
        
        // Get location name automatically
        let detectedLocation = 'Loading location...';
        try {
          detectedLocation = await getLocationNameCached(centerLat, centerLon);
        } catch (error) {
          console.warn('Failed to detect location:', error);
          detectedLocation = `Location (${centerLat.toFixed(3)}, ${centerLon.toFixed(3)})`;
        }
        
        // Generate a default label with detected location
        const defaultLabel = layerType === 'rectangle' 
          ? `${detectedLocation} (Rectangle)`
          : `${detectedLocation} (${coordinates.length} points)`;

        // Prompt user for a custom label with auto-detected location pre-filled
        const userLabel = prompt(
          `Name this ${layerType} (${coordinates.length} points):\n\nDetected location: ${detectedLocation}`, 
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
          (layer as L.Layer & { _polygonId?: string })._polygonId = id;
          
          // Add a tooltip showing the polygon label
          layer.bindTooltip(finalLabel, {
            permanent: false,
            direction: 'center',
            className: 'polygon-tooltip'
          });

          // Show tooltip on hover
          layer.on('mouseover', () => {
            layer.openTooltip();
          });
          
          layer.on('mouseout', () => {
            layer.closeTooltip();
          });
        }
        
        console.log('Polygon created:', newPolygon);
      } catch (error) {
        console.error('Error creating polygon:', error);
        alert('Failed to create polygon. Please try again.');
      }
    };

    // Handle polygon deletion
    const handleDeleted = (e: L.LeafletEvent) => {
      try {
        const event = e as L.LeafletEvent & { layers: L.LayerGroup };
        event.layers.eachLayer((layer: L.Layer) => {
          const polygonLayer = layer as L.Layer & { _polygonId?: string };
          if (polygonLayer._polygonId) {
            dispatch({
              type: 'DELETE_POLYGON',
              payload: polygonLayer._polygonId,
            });
            console.log('Polygon deleted:', polygonLayer._polygonId);
          }
        });
      } catch (error) {
        console.error('Error deleting polygon:', error);
      }
    };

    // Attach event listeners
    map.on(L.Draw.Event.CREATED, handleCreated);
    map.on(L.Draw.Event.DELETED, handleDeleted);

    // Cleanup function
    return () => {
      map.off(L.Draw.Event.CREATED, handleCreated);
      map.off(L.Draw.Event.DELETED, handleDeleted);
      map.removeControl(drawControl);
      map.removeLayer(drawnItems);
    };
  }, [map, dispatch, state.polygons.length, state.selectedDataSource]);

  return null;
};

export default PolygonTools;
