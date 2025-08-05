import { useState } from 'react';
import { Trash2, Edit3, Check, X, Info, Database, Palette, Clock, Zap } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import ColorRuleEditor from '../ColorRuleEditor';
import type { PolygonData } from '../../types';

const Sidebar = () => {
  const { state, dispatch } = useAppContext();
  const [editingPolygon, setEditingPolygon] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState('');
  const [showTooltip, setShowTooltip] = useState<string | null>(null);

  const handleDeletePolygon = (id: string) => {
    dispatch({ type: 'DELETE_POLYGON', payload: id });
  };

  const handleStartEdit = (polygon: PolygonData) => {
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

  const handleDataSourceChange = (dataSourceId: string) => {
    dispatch({ type: 'SET_DATA_SOURCE', payload: dataSourceId });
  };

  const handleToggleAnimations = () => {
    dispatch({ type: 'TOGGLE_ANIMATIONS' });
  };

  const selectedDataSource = state.dataSources.find(ds => ds.id === state.selectedDataSource);
  const currentColorRules = state.colorRules[state.selectedDataSource] || [];

  return (
    <div className={`w-80 bg-white border-r border-gray-200 overflow-y-auto flex flex-col transition-all duration-300 ${
      state.animationsEnabled ? 'transform' : ''
    }`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Database size={20} className="text-blue-600" />
          Weather Dashboard
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Manage polygons, data sources, and visualization settings
        </p>
      </div>

      {/* Data Source Selection */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <Database size={16} className="text-green-600" />
          <label className="text-sm font-medium text-gray-700">Data Source</label>
          <button
            onMouseEnter={() => setShowTooltip('dataSource')}
            onMouseLeave={() => setShowTooltip(null)}
            className="relative"
          >
            <Info size={14} className="text-gray-400 hover:text-gray-600" />
            {showTooltip === 'dataSource' && (
              <div className="absolute left-5 top-0 bg-black text-white text-xs p-2 rounded whitespace-nowrap z-50 animate-fade-in">
                Choose between live APIs and mock data sources
              </div>
            )}
          </button>
        </div>
        
        <select
          value={state.selectedDataSource}
          onChange={(e) => handleDataSourceChange(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        >
          {state.dataSources.map((source) => (
            <option key={source.id} value={source.id}>
              {source.name} {source.isLive ? '🌐' : '🔄'}
            </option>
          ))}
        </select>
        
        {selectedDataSource && (
          <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
            <div className="font-medium">{selectedDataSource.description}</div>
            <div className="mt-1">
              Status: {selectedDataSource.isLive ? (
                <span className="text-green-600 font-medium">Live API</span>
              ) : (
                <span className="text-blue-600 font-medium">Mock Data</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Settings */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <Zap size={16} className="text-yellow-600" />
          <label className="text-sm font-medium text-gray-700">Settings</label>
        </div>
        
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={state.animationsEnabled}
            onChange={handleToggleAnimations}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Enable animations</span>
          <button
            onMouseEnter={() => setShowTooltip('animations')}
            onMouseLeave={() => setShowTooltip(null)}
            className="relative"
          >
            <Info size={12} className="text-gray-400 hover:text-gray-600" />
            {showTooltip === 'animations' && (
              <div className="absolute left-5 top-0 bg-black text-white text-xs p-2 rounded whitespace-nowrap z-50 animate-fade-in">
                Smooth transitions and color animations
              </div>
            )}
          </button>
        </label>
      </div>

      {/* Polygons List */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <Palette size={16} className="text-purple-600" />
          <h3 className="text-sm font-medium text-gray-700">
            Polygons ({state.polygons.length})
          </h3>
        </div>
        
        {state.polygons.length === 0 ? (
          <div className="text-sm text-gray-500 italic bg-gray-50 p-3 rounded-md">
            No polygons drawn yet. Use the drawing tools on the map to create areas.
          </div>
        ) : (
          <div className="space-y-2">
            {state.polygons.map((polygon) => (
              <div
                key={polygon.id}
                className={`p-3 border border-gray-200 rounded-md bg-gray-50 hover:bg-gray-100 transition-all duration-200 ${
                  state.animationsEnabled ? 'transform hover:scale-[1.02]' : ''
                }`}
              >
                <div className="flex items-center justify-between">
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
                        className="p-1 text-green-600 hover:bg-green-100 rounded transition-colors"
                        title="Save"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="p-1 text-gray-400 hover:bg-gray-200 rounded transition-colors"
                        title="Cancel"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full border border-gray-300"
                            style={{ backgroundColor: state.colorRules[polygon.dataSource]?.[0]?.color || '#3b82f6' }}
                          />
                          <span className="text-sm font-medium text-gray-800">
                            {polygon.label || `Polygon ${polygon.id.slice(-4)}`}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {polygon.coordinates.length} points • {polygon.dataSource}
                        </div>
                        {polygon.lastUpdated && (
                          <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                            <Clock size={10} />
                            Updated: {new Date(polygon.lastUpdated).toLocaleTimeString()}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleStartEdit(polygon)}
                          className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                          title="Rename polygon"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeletePolygon(polygon.id)}
                          className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                          title="Delete polygon"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Color Rules Section */}
      <div className="flex-1 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Palette size={16} className="text-orange-600" />
          <h3 className="text-sm font-medium text-gray-700">Color Rules</h3>
          <button
            onMouseEnter={() => setShowTooltip('colorRules')}
            onMouseLeave={() => setShowTooltip(null)}
            className="relative"
          >
            <Info size={14} className="text-gray-400 hover:text-gray-600" />
            {showTooltip === 'colorRules' && (
              <div className="absolute left-5 top-0 bg-black text-white text-xs p-2 rounded whitespace-nowrap z-50 animate-fade-in">
                Define temperature ranges and their colors
              </div>
            )}
          </button>
        </div>
        
        {currentColorRules.length > 0 && (
          <div className="mb-4 p-3 bg-blue-50 rounded-md">
            <h4 className="text-xs font-medium text-blue-800 mb-2">Current Legend</h4>
            <div className="space-y-1">
              {currentColorRules.map((rule, index) => (
                <div key={index} className="flex items-center gap-2 text-xs">
                  <div
                    className="w-3 h-3 rounded-full border border-gray-300"
                    style={{ backgroundColor: rule.color }}
                  />
                  <span className="text-gray-700">
                    {rule.label || `${rule.operator} ${rule.value}°C`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <ColorRuleEditor 
          rules={currentColorRules}
          onChange={(newRules) => {
            dispatch({
              type: 'SET_COLOR_RULES',
              payload: { [state.selectedDataSource]: newRules }
            });
          }}
        />
      </div>
    </div>
  );
};

export default Sidebar;
