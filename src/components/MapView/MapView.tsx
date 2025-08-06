import { useRef, useEffect } from 'react';
import { MapContainer, TileLayer, useMap, Polygon } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './mapStyles.css';
import { useAppContext } from '../../context/AppContext';
import { useWeatherIntegration } from '../../hooks/useWeatherIntegration';
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
  
  const handleRecenter = () => {
    // Try to get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          map.setView([latitude, longitude], DEFAULT_ZOOM);
        },
        (error) => {
          console.warn('Geolocation failed, using default center:', error);
          map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
        },
        { timeout: 5000, enableHighAccuracy: true }
      );
    } else {
      // Fallback to default center if geolocation is not supported
      map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
    }
  };

  return (
    <button
      className="absolute top-4 right-4 z-[1000] hover:bg-gray-50 px-4 py-2 rounded-xl shadow-md border text-sm font-medium transition-colors"
      onClick={handleRecenter}
    >
      📍 Recenter
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
  const { getPolygonColor, polygonWeatherData, loading } = useWeatherIntegration();
  const mapRef = useRef(null);

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
                  const weatherData = polygonWeatherData[poly.id];
                  
                  let tooltipContent = poly.label || `Polygon ${poly.id.slice(-4)}`;
                  
                  if (weatherData && weatherData.data && weatherData.data.hourly) {
                    // Get current weather values for all parameters
                    const data = weatherData.data.hourly;
                    const timeIndex = data.time.length > 0 ? data.time.length - 1 : 0; // Use latest data
                    
                    const temperature = data.temperature_2m[timeIndex];
                    const humidity = data.humidity[timeIndex];
                    const windSpeed = data.wind_speed_10m[timeIndex];
                    const pressure = data.surface_pressure[timeIndex];
                    
                    // Build comprehensive weather info
                    const weatherInfo = [];
                    if (typeof temperature === 'number' && !isNaN(temperature)) {
                      weatherInfo.push(`🌡️ ${temperature.toFixed(1)}°C`);
                    }
                    if (typeof humidity === 'number' && !isNaN(humidity)) {
                      weatherInfo.push(`💧 ${humidity.toFixed(1)}%`);
                    }
                    if (typeof windSpeed === 'number' && !isNaN(windSpeed)) {
                      weatherInfo.push(`💨 ${windSpeed.toFixed(1)}m/s`);
                    }
                    if (typeof pressure === 'number' && !isNaN(pressure)) {
                      weatherInfo.push(`🔽 ${pressure.toFixed(0)}hPa`);
                    }
                    
                    if (weatherInfo.length > 0) {
                      tooltipContent += '\n' + weatherInfo.join(' | ');
                    } else {
                      tooltipContent += '\nNo weather data available';
                    }
                  } else {
                    tooltipContent += '\n🔄 Loading weather data...';
                  }
                  
                  layer.bindTooltip(tooltipContent, {
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
        {loading && (
          <div className="text-blue-600 mt-1">
            🔄 Loading weather data...
          </div>
        )}
      </div>
    </div>
  );
};

export default MapView;
