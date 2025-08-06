import { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import ColorRuleEditor from '../ColorRuleEditor';
import { Trash2, Plus, Edit3, Check, X, Eye } from 'lucide-react';
import type { ColorRule, PolygonData } from '../../types';

const Sidebar = () => {
  const { state, dispatch } = useAppContext();
  const [selectedSource, setSelectedSource] = useState(state.selectedParameter || 'temperature');
  const [editingPolygon, setEditingPolygon] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState('');

  const dataSources = [
    { value: 'temperature', label: 'Temperature (°C)', unit: '°C' },
    { value: 'humidity', label: 'Humidity (%)', unit: '%' },
    { value: 'windSpeed', label: 'Wind Speed (m/s)', unit: 'm/s' },
    { value: 'precipitation', label: 'Precipitation (mm)', unit: 'mm' },
  ];

  const weatherDataSources = [
    { id: 'open-meteo', name: 'Open-Meteo (Live API)', icon: '🌐' },
    { id: 'mock-tropical', name: 'Mock - Tropical Climate', icon: '🔄' }
  ];

  const handleDataSourceChange = (dataSourceId: string) => {
    dispatch({ type: 'SET_DATA_SOURCE', payload: dataSourceId });
  };

  const handleRuleChange = (rules: ColorRule[]) => {
    dispatch({
      type: 'SET_COLOR_RULES',
      payload: {
        [selectedSource]: rules,
      },
    });
  };

  const handleParameterChange = (parameter: string) => {
    setSelectedSource(parameter);
    dispatch({ type: 'SET_PARAMETER', payload: parameter });
  };

  const deletePolygon = (id: string) => {
    dispatch({
      type: 'DELETE_POLYGON',
      payload: id,
    });
  };

  const handleStartEdit = (polygon: { id: string; label?: string }) => {
    setEditingPolygon(polygon.id);
    setEditingLabel(polygon.label || `Polygon ${polygon.id.slice(-4)}`);
  };

  const handleSaveEdit = (polygonId: string) => {
    if (editingLabel.trim()) {
      dispatch({
        type: 'UPDATE_POLYGON',
        payload: {
          id: polygonId,
          updates: { label: editingLabel.trim() }
        }
      });
    }
    setEditingPolygon(null);
    setEditingLabel('');
  };

  const handleCancelEdit = () => {
    setEditingPolygon(null);
    setEditingLabel('');
  };

  const handleViewPolygon = (polygon: PolygonData) => {
    // Dispatch an action to focus on this polygon
    dispatch({
      type: 'FOCUS_POLYGON',
      payload: polygon.id
    });
  };

  const addDefaultRules = () => {
    const defaultRules = [
      { operator: '<' as const, value: 10, color: '#3b82f6' },
      { operator: '>=' as const, value: 10, color: '#ef4444' },
    ];
    handleRuleChange(defaultRules);
  };

  return (
    <div className="w-80 bg-white border-r shadow-lg flex flex-col max-h-full overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50 flex-shrink-0">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <span className="text-2xl">🌤️</span>
          Dashboard Controls
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Manage weather data visualization
        </p>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">

      {/* Weather Data Source Selection */}
      <div className="p-4 border-b bg-white">
        <label className="block mb-3 text-sm font-medium text-gray-700 flex items-center gap-2">
          <span className="text-lg">🌍</span>
          Weather Data Source
        </label>
        <select
          value={state.selectedDataSource}
          onChange={(e) => handleDataSourceChange(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
        >
          {weatherDataSources.map((source) => (
            <option key={source.id} value={source.id}>
              {source.icon} {source.name}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
          <span>💡</span>
          Choose between live APIs and mock data sources
        </p>
      </div>

      {/* Animation Settings */}
      <div className="p-4 border-b bg-white">
        <label className="block mb-3 text-sm font-medium text-gray-700 flex items-center gap-2">
          <span className="text-lg">✨</span>
          Display Settings
        </label>
        <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200">
          <input
            type="checkbox"
            checked={state.animationsEnabled}
            onChange={() => dispatch({ type: 'TOGGLE_ANIMATIONS' })}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Enable smooth animations</span>
          <span className="text-lg">🎭</span>
        </label>
        <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
          <span>💫</span>
          Toggle smooth transitions and hover effects
        </p>
      </div>

      {/* Data Parameter Selection */}
      <div className="p-4 border-b">
        <label className="block mb-2 text-sm font-medium text-gray-700">
          Select Parameter
        </label>
        <select
          value={selectedSource}
          onChange={(e) => setSelectedSource(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {dataSources.map((source) => (
            <option key={source.value} value={source.value}>
              {source.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500 mt-1">
          Configure color rules for {dataSources.find(d => d.value === selectedSource)?.label}
        </p>
      </div>

      {/* Color Rules */}
      <div className="p-4 border-b flex-1">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-md font-medium text-gray-700">Color Rules</h3>
          {(!state.colorRules[selectedSource] || state.colorRules[selectedSource].length === 0) && (
            <button
              onClick={addDefaultRules}
              className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
            >
              <Plus className="w-3 h-3 inline mr-1" />
              Add Default
            </button>
          )}
        </div>
        
        {/* Parameter Selection */}
        <div className="mb-4">
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Parameter for Coloring
          </label>
          <select
            value={selectedSource}
            onChange={(e) => handleParameterChange(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {dataSources.map((source) => (
              <option key={source.value} value={source.value}>
                {source.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Choose which parameter to use for polygon coloring
          </p>
        </div>
        
        <ColorRuleEditor
          rules={state.colorRules[selectedSource] || []}
          onChange={handleRuleChange}
        />
      </div>

      {/* Polygon List */}
      <div className="p-4">
        <h3 className="text-md font-medium text-gray-700 mb-3">
          Polygons ({state.polygons.length})
        </h3>
        {state.polygons.length === 0 ? (
          <p className="text-sm text-gray-500 italic">
            No polygons created yet. Use the map drawing tools to create polygons.
          </p>
        ) : (
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {state.polygons.map((polygon, index) => (
              <div
                key={polygon.id}
                className="flex items-center justify-between p-2 bg-gray-50 rounded"
              >
                {editingPolygon === polygon.id ? (
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="text"
                      value={editingLabel}
                      onChange={(e) => setEditingLabel(e.target.value)}
                      className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit(polygon.id);
                        if (e.key === 'Escape') handleCancelEdit();
                      }}
                    />
                    <button
                      onClick={() => handleSaveEdit(polygon.id)}
                      className="p-1 text-green-600 hover:bg-green-100 rounded"
                      title="Save"
                    >
                      <Check size={14} />
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="p-1 text-gray-400 hover:bg-gray-200 rounded"
                      title="Cancel"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex-1">
                      <div className="text-sm font-medium">
                        {polygon.label || `Polygon ${index + 1}`}
                      </div>
                      <div className="text-xs text-gray-500">
                        {polygon.dataSource} • {polygon.coordinates.length} points
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleViewPolygon(polygon)}
                        className="p-1 text-green-600 hover:bg-green-100 rounded"
                        title="View on map"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={() => handleStartEdit(polygon)}
                        className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                        title="Rename polygon"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => deletePolygon(polygon.id)}
                        className="p-1 text-red-600 hover:bg-red-100 rounded"
                        title="Delete polygon"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="p-4 bg-gray-50 border-t text-xs text-gray-600 flex-shrink-0">
        <div className="font-medium mb-1">Instructions:</div>
        <ul className="space-y-1">
          <li>• Use drawing tools on the map</li>
          <li>• Set color rules for data visualization</li>
          <li>• Adjust timeline to see changes</li>
        </ul>
      </div>
      
      </div>
    </div>
  );
};

export default Sidebar;
