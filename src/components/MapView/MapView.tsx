import { useRef, useEffect } from 'react';
import { MapContainer, TileLayer, useMap, Polygon } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './mapStyles.css';
import { useAppContext } from '../../context/AppContext';
import PolygonTools from '../PolygonTools';

// Fix for default markers
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const DEFAULT_CENTER: [number, number] = [19.0760, 72.8777]; // Mumbai
const DEFAULT_ZOOM = 13;

const CenterResetButton = () => {
  const map = useMap();
  return (
    <button
      className="absolute top-4 right-4 z-[1000] hover:bg-gray-50 px-4 py-2 rounded-xl shadow-md border text-sm font-medium transition-colors"
      onClick={() => map.setView(DEFAULT_CENTER, DEFAULT_ZOOM)}
    >
      Recenter
    </button>
  );
};

const FocusPolygon = () => {
  const map = useMap();
  const { state, dispatch } = useAppContext();

  useEffect(() => {
    if (state.focusedPolygonId) {
      const polygon = state.polygons.find(p => p.id === state.focusedPolygonId);
      if (polygon && polygon.coordinates.length > 0) {
        // Calculate bounds of the polygon
        const latLngs = polygon.coordinates.map(coord => [coord[0], coord[1]] as [number, number]);
        const bounds = L.latLngBounds(latLngs);
        
        // Fit map to polygon bounds with some padding
        map.fitBounds(bounds, { 
          padding: [50, 50],
          maxZoom: 15 
        });
        
        // Clear focus after zooming
        setTimeout(() => {
          dispatch({
            type: 'FOCUS_POLYGON',
            payload: null
          });
        }, 1000);
      }
    }
  }, [state.focusedPolygonId, state.polygons, map, dispatch]);

  return null;
};

const MapView = () => {
  const { state } = useAppContext();
  const mapRef = useRef(null);

  // Simple function to get polygon color from rules
  const getPolygonColor = (polygonId: string) => {
    const polygon = state.polygons.find(p => p.id === polygonId);
    if (!polygon) return '#3b82f6';
    
    const rules = state.colorRules[polygon.dataSource] || [];
    if (rules.length > 0) {
      return rules[0].color;
    }
    return '#3b82f6';
  };

  return (
    <div className={`flex-1 relative bg-gray-100 h-full ${state.animationsEnabled ? 'transition-all duration-300' : ''}`}>
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
        className="z-0"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="© OpenStreetMap contributors"
        />
        {state.polygons.map((poly) => {
          const color = getPolygonColor(poly.id);
          
          return (
            <Polygon
              key={poly.id}
              positions={poly.coordinates}
              pathOptions={{ 
                color: color, 
                fillColor: color,
                fillOpacity: 0.5,
                weight: 2,
                opacity: 0.8,
                className: state.animationsEnabled ? 'polygon-animated' : ''
              }}
              eventHandlers={{
                mouseover: (e) => {
                  const layer = e.target;
                  layer.bindTooltip(poly.label || `Polygon ${poly.id.slice(-4)}`, {
                    permanent: false,
                    direction: 'center',
                    className: 'polygon-tooltip'
                  }).openTooltip();
                },
                mouseout: (e) => {
                  const layer = e.target;
                  layer.closeTooltip();
                }
              }}
            />
          );
        })}
        <CenterResetButton />
        <FocusPolygon />
        <PolygonTools />
      </MapContainer>
      
      {/* Map Instructions */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-md text-xs">
        <div className="font-medium mb-1">Map Controls:</div>
        <div>• Use polygon tool to draw areas</div>
        <div>• 3-12 points per polygon</div>
        <div>• Configure colors in sidebar</div>
      </div>
    </div>
  );
};

export default MapView;
