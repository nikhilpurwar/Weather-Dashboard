import { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { ChevronUp, ChevronDown } from 'lucide-react';

const Legend = () => {
  const { state } = useAppContext();
  const [isExpanded, setIsExpanded] = useState(false);

  const renderColorRules = () => {
    const allRules = Object.entries(state.colorRules).flatMap(([dataSource, rules]) =>
      rules.map(rule => ({ ...rule, dataSource }))
    );

    if (allRules.length === 0) {
      return <p className="text-gray-500 text-xs">No color rules defined</p>;
    }

    return (
      <div className={`grid gap-2 transition-all duration-300 ${
        isExpanded 
          ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
          : 'grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8'
      }`}>
        {allRules.slice(0, isExpanded ? allRules.length : 8).map((rule, index) => (
          <div key={index} className={`flex items-center gap-1.5 bg-gray-50 p-1.5 rounded-md ${
            isExpanded ? 'flex-row' : 'flex-col sm:flex-row'
          }`}>
            <div
              className="w-3 h-3 rounded flex-shrink-0"
              style={{ backgroundColor: rule.color }}
            />
            <div className={`min-w-0 flex-1 ${isExpanded ? '' : 'text-center sm:text-left'}`}>
              {isExpanded && (
                <div className="text-xs font-medium text-gray-600 truncate">
                  {rule.dataSource}
                </div>
              )}
              <div className={`text-xs text-gray-900 truncate ${isExpanded ? '' : 'leading-tight'}`}>
                {rule.label || `${rule.operator} ${rule.value}`}
              </div>
            </div>
          </div>
        ))}
        {!isExpanded && allRules.length > 8 && (
          <div className="flex items-center justify-center text-xs text-gray-500 bg-gray-100 p-1.5 rounded-md">
            +{allRules.length - 8} more
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`bg-white border-t shadow-sm transition-all duration-300 ${
      isExpanded ? 'legend-expanded' : 'legend-compact'
    }`}>
      <div className="px-3 py-2 sm:px-4">
        {/* Compact Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-semibold text-gray-800">🎨 Legend</h3>
            <div className="text-xs text-gray-500">
              📍 {state.polygons.length}
            </div>
            <div className="text-xs text-gray-500 hidden sm:block">
              {state.selectedTime.start && state.selectedTime.end ? (
                <span>
                  🕐 {new Date(state.selectedTime.start).toLocaleDateString()}
                </span>
              ) : (
                <span>🕐 No time</span>
              )}
            </div>
          </div>
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors p-2 -m-1 rounded hover:bg-gray-100 min-h-[44px] sm:min-h-auto sm:p-1"
            aria-label={isExpanded ? "Collapse legend" : "Expand legend"}
          >
            {isExpanded ? (
              <>
                <span className="hidden sm:inline">Collapse</span>
                <ChevronDown size={14} />
              </>
            ) : (
              <>
                <span className="hidden sm:inline">Expand</span>
                <ChevronUp size={14} />
              </>
            )}
          </button>
        </div>
        
        {/* Color Rules */}
        <div className={`transition-all duration-300 ${isExpanded ? 'mb-3' : 'mb-1'}`}>
          {renderColorRules()}
        </div>
        
        {/* Extended Info (only when expanded) */}
        {isExpanded && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-2 border-t border-gray-100">
            <div className="text-xs text-gray-500">
              � Data Source: {state.dataSources.find(ds => ds.id === state.selectedDataSource)?.name || 'Unknown'}
            </div>
            <div className="text-xs text-gray-500 sm:text-right">
              {state.selectedTime.start && state.selectedTime.end ? (
                <span>
                  🕐 {new Date(state.selectedTime.start).toLocaleString()} - {new Date(state.selectedTime.end).toLocaleString()}
                </span>
              ) : (
                <span>🕐 No time range selected</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Legend;
