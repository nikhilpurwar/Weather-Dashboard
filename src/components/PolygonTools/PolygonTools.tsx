import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-draw';
import { useAppContext } from '../../context/AppContext';
import { v4 as uuidv4 } from 'uuid';

const PolygonTools = () => {
  const map = useMap();
  const { state, dispatch } = useAppContext();
  const drawnItemsRef = useRef<L.FeatureGroup | null>(null);

  useEffect(() => {
    // Create a feature group to store drawn items
    const drawnItems = new L.FeatureGroup();
    drawnItemsRef.current = drawnItems;
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
          guidelineDistance: 10,
          maxPoints: 12,
        },
        polyline: false,
        circle: false,
        rectangle: {
          shapeOptions: {
            color: '#3b82f6',
            weight: 2,
            fillOpacity: 0.3,
          },
        },
        marker: false,
        circlemarker: false,
      },
      edit: {
        featureGroup: drawnItems,
        remove: true,
      },
    });

    map.addControl(drawControl);

    // Handle polygon creation
    const handleCreated = (e: L.LeafletEvent) => {
      const event = e as L.LeafletEvent & { layer: L.Layer; layerType: string };
      const layer = event.layer;
      let coordinates: [number, number][] = [];
      
      if (layer instanceof L.Polygon) {
        const latlngs = layer.getLatLngs()[0] as L.LatLng[];
        if (latlngs.length < 3) {
          alert('Polygon must have at least 3 points.');
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
      const polygonCount = state.polygons.length + 1;
      const layerType = layer instanceof L.Rectangle ? 'rectangle' : 'polygon';
      
      // Generate a default label based on type and count
      const defaultLabel = layerType === 'rectangle' 
        ? `Rectangle ${polygonCount}`
        : `Area ${polygonCount}`;

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
        dataSource: 'temperature_2m', // Default data source
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
    };

    // Handle polygon deletion
    const handleDeleted = (e: L.LeafletEvent) => {
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
  }, [map, dispatch, state.polygons.length]);

  return null;
};

export default PolygonTools;
