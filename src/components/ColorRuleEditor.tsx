import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

type Rule = {
  operator: '<' | '<=' | '=' | '>=' | '>';
  value: number;
  color: string;
};

type Props = {
  rules: Rule[];
  onChange: (rules: Rule[]) => void;
};

const ColorRuleEditor: React.FC<Props> = ({ rules, onChange }) => {
  const handleRuleChange = (index: number, field: keyof Rule, value: string | number) => {
    const updated = [...rules];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const addRule = () => {
    onChange([...rules, { operator: '>=', value: 0, color: '#3b82f6' }]);
  };

  const removeRule = (index: number) => {
    const updated = rules.filter((_, i) => i !== index);
    onChange(updated);
  };

  const predefinedColors = [
    '#ef4444', '#f97316', '#f59e0b', '#eab308', 
    '#84cc16', '#22c55e', '#10b981', '#14b8a6',
    '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
    '#8b5cf6', '#a855f7', '#d946ef', '#ec4899'
  ];

  return (
    <div className="space-y-3">
      {rules.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500 mb-2">No color rules defined</p>
          <button
            onClick={addRule}
            className="inline-flex items-center px-3 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add First Rule
          </button>
        </div>
      ) : (
        <>
          {rules.map((rule, index) => (
            <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <select
                value={rule.operator}
                onChange={(e) => handleRuleChange(index, 'operator', e.target.value)}
                className="p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="<">{'<'}</option>
                <option value="<=">{'<='}</option>
                <option value="=">{'='}</option>
                <option value=">=">{'>='}</option>
                <option value=">">{'>'}</option>
              </select>

              <input
                type="number"
                value={rule.value}
                onChange={(e) => handleRuleChange(index, 'value', Number(e.target.value))}
                className="w-20 p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Value"
              />

              <div className="flex items-center gap-1">
                <input
                  type="color"
                  value={rule.color}
                  onChange={(e) => handleRuleChange(index, 'color', e.target.value)}
                  className="w-10 h-8 border border-gray-300 rounded cursor-pointer"
                />
                <div className="flex flex-wrap gap-1">
                  {predefinedColors.slice(0, 4).map((color) => (
                    <button
                      key={color}
                      onClick={() => handleRuleChange(index, 'color', color)}
                      className="w-4 h-4 rounded border border-gray-300"
                      style={{ backgroundColor: color }}
                      title={`Use color ${color}`}
                    />
                  ))}
                </div>
              </div>

              <button
                onClick={() => removeRule(index)}
                className="text-red-500 hover:text-red-700 p-1 transition-colors"
                title="Remove rule"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}

          <button
            onClick={addRule}
            className="w-full flex items-center justify-center px-3 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Another Rule
          </button>
        </>
      )}

      {rules.length > 0 && (
        <div className="text-xs text-gray-500 mt-2">
          <p>Rules are applied in order. First matching rule determines the color.</p>
        </div>
      )}
    </div>
  );
};

export default ColorRuleEditor;
