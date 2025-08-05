import { useState } from 'react';
import { AppProvider } from './context/AppContext';
import TimelineSlider from './components/TimelineSlider/TimelineSlider';
import Sidebar from './components/Sidebar/Sidebar';
import MapView from './components/MapView';
import Legend from './components/Legend/Legend';
import { Menu, X } from 'lucide-react';
import './App.css';

const App = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <AppProvider>
      <div className="flex flex-col h-screen bg-gray-100">
        {/* Mobile header with menu toggle */}
        <div className="md:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-800">Weather Dashboard</h1>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Timeline Slider */}
        <TimelineSlider />
        
        {/* Main content area */}
        <div className="flex flex-1 overflow-hidden relative">
          {/* Mobile sidebar overlay */}
          {sidebarOpen && (
            <div 
              className="md:hidden absolute inset-0 bg-black bg-opacity-50 z-40"
              onClick={() => setSidebarOpen(false)}
            />
          )}
          
          {/* Sidebar */}
          <div className={`
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            md:translate-x-0 
            transform transition-transform duration-300 ease-in-out
            absolute md:relative z-50 md:z-auto
            h-full
          `}>
            <Sidebar />
          </div>
          
          {/* Map area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 relative overflow-hidden">
              <MapView />
            </div>
          </div>
        </div>
        
        {/* Legend */}
        <Legend />
      </div>
    </AppProvider>
  );
};

export default App;
