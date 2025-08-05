# 🌤️ Weather Dashboard

A modern, interactive weather visualization dashboard built with React, TypeScript, and Leaflet. Draw polygons on the map, configure dynamic color rules, and visualize real-time weather data with multiple data sources and advanced features.

![Weather Dashboard](https://img.shields.io/badge/React-19+-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4+-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ (recommended 20+)
- **npm** 9+ or **yarn** 1.22+
- Modern web browser with ES2020+ support

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/nikhilpurwar/Weather-Dashboard.git
cd Weather-Dashboard
```

2. **Install dependencies**
```bash
npm install
```

3. **Start development server**
```bash
npm run dev
```

4. **Open your browser**
Navigate to `http://localhost:5173` (or the port shown in terminal)

### Build for Production

```bash
# Build optimized production bundle
npm run build

# Preview production build locally
npm run preview

# Run linting
npm run lint
```

## 📋 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build production-ready bundle |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint for code quality checks |

## 🎯 Features

### ✨ Core Features

- **🗺️ Interactive Map**: Leaflet-powered mapping with pan, zoom, and reset controls
- **📐 Polygon Drawing**: Create custom areas with 3-12 points or rectangles
- **⏱️ Timeline Control**: 30-day time window with hourly precision slider
- **🎨 Dynamic Coloring**: Rule-based polygon visualization with real-time updates
- **📊 Multiple Data Sources**: Temperature, humidity, wind speed, pressure, and more
- **🌍 Live Weather Data**: Open-Meteo API integration with automatic data fetching

### 🎁 Bonus Features

- **🏷️ Polygon Labeling**: Custom naming and inline editing of polygons
- **💾 Data Persistence**: localStorage saves your settings across sessions
- **📱 Mobile Responsive**: Optimized for mobile devices and tablets
- **🔄 Multiple Data Sources**: Switch between live and mock weather data
- **🎬 Animations**: Smooth transitions and polygon color animations
- **👁️ Quick Navigation**: Click polygons in sidebar to center map view
- **📋 Compact Legend**: Collapsible legend that saves screen space
- **🎨 Enhanced UI**: Modern design with icons, gradients, and smooth animations

## 🛠️ Tech Stack

### Frontend
- **React 19+** - Modern React with concurrent features
- **TypeScript 5+** - Type-safe development
- **Vite** - Lightning-fast build tool and dev server
- **Tailwind CSS v4** - Utility-first CSS framework

### Mapping & Visualization
- **Leaflet** - Interactive maps
- **React-Leaflet** - React components for Leaflet
- **Leaflet-Draw** - Drawing tools and controls

### State Management & APIs
- **React Context API** - Global state management
- **Open-Meteo API** - Free weather data service
- **localStorage** - Client-side data persistence

### UI Components & Icons
- **Lucide React** - Beautiful, customizable icons
- **React-Range** - Advanced range slider component

## 🎮 How to Use

### 1. Drawing Polygons
1. Click the **polygon tool** 📐 on the map
2. Click to place vertices (3-12 points maximum)
3. Double-click to complete the polygon
4. Use **rectangle tool** for quick rectangular areas

### 2. Timeline Control
1. Use the **dual slider** at the top to select time range
2. Drag handles to adjust start/end times
3. See real-time feedback of selected dates and times

### 3. Data Sources & Color Rules
1. Select a **data source** in the sidebar (Temperature, Humidity, etc.)
2. Add **color rules** with operators (`<`, `<=`, `=`, `>=`, `>`) and values
3. Use color picker or predefined colors
4. Rules are applied in order - first match determines polygon color

### 4. Polygon Management
1. **Rename**: Click the edit ✏️ icon next to any polygon
2. **View**: Click the eye 👁️ icon to center map on polygon
3. **Delete**: Click the trash 🗑️ icon to remove polygon
4. **Toggle Animations**: Enable/disable smooth color transitions

### 5. Legend & Status
1. View **compact legend** at the bottom showing color rules
2. **Expand/collapse** legend for detailed information
3. See polygon count and selected time range
4. Current data source and status information

## 📊 Data Sources

| Source | Description | Unit | API Parameter |
|--------|-------------|------|---------------|
| **Temperature** | Air temperature at 2m height | °C | `temperature_2m` |
| **Humidity** | Relative humidity | % | `relative_humidity_2m` |
| **Wind Speed** | Wind speed at 10m height | m/s | `wind_speed_10m` |
| **Precipitation** | Total precipitation | mm | `precipitation` |
| **Mock Data** | Simulated weather patterns | Various | Local generation |

## 🏗️ Project Structure

```
src/
├── components/
│   ├── MapView/            # Leaflet map with drawing tools
│   ├── TimelineSlider/     # Time range selection component
│   ├── Sidebar/            # Controls and configuration panel
│   ├── Legend/             # Compact, responsive color legend
│   ├── PolygonTools/       # Drawing tools and polygon management
│   └── ColorRuleEditor/    # Dynamic color rule configuration
├── context/
│   └── AppContext.tsx      # Global state management with persistence
├── hooks/
│   └── useWeatherData.ts   # Weather API integration and caching
├── api/
│   └── weatherApi.ts       # Open-Meteo API client
├── types/
│   └── index.ts           # TypeScript interfaces and types
└── utils/                 # Utility functions and helpers
```

## ⚙️ Configuration

### Environment Variables

Create `.env.local` for custom configuration:

```env
# Optional: Custom API base URL
VITE_WEATHER_API_BASE_URL=https://api.open-meteo.com/v1/forecast

# Optional: Enable debug mode
VITE_DEBUG=true
```

### Customization

#### Adding New Data Sources
1. Update `dataSources` array in `AppContext.tsx`
2. Add API mapping in `weatherApi.ts`
3. Extend `WeatherDataPoint` interface in `types/index.ts`

#### Custom Map Tiles
```tsx
// In MapView.tsx, replace TileLayer URL
<TileLayer
  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
  attribution="© OpenStreetMap contributors"
/>
```

#### Color Themes
Modify Tailwind CSS classes in components or update `tailwind.config.js`

## 🔧 Development

### Code Quality
- **ESLint** - Configured with React and TypeScript rules
- **TypeScript** - Strict mode enabled for type safety
- **Prettier** - Code formatting (configure in your editor)

### Performance Features
- **Debounced API calls** - Prevents excessive requests
- **Efficient re-rendering** - Context-based state management  
- **Lazy loading** - Components load data only when needed
- **Error boundaries** - Graceful fallbacks for API failures
- **Responsive design** - Mobile-first approach

### Browser Support
- **Chrome** 90+
- **Firefox** 88+
- **Safari** 14+
- **Edge** 90+

## 🐛 Troubleshooting

### Common Issues

**Map not loading:**
- Check internet connection
- Verify Leaflet CSS imports in `main.tsx`
- Clear browser cache and localStorage

**Weather data not updating:**
- Check browser console for API errors
- Verify polygon coordinates are valid (latitude: -90 to 90, longitude: -180 to 180)
- Check Open-Meteo API status

**Drawing tools not working:**
- Ensure map container has proper height/width
- Check for JavaScript errors in console
- Verify Leaflet and React-Leaflet versions

**Performance issues:**
- Limit number of polygons (recommended: < 50)
- Use shorter time ranges for better performance
- Check browser memory usage

## 📱 Mobile Support

The dashboard is fully responsive and mobile-optimized:
- **Touch-friendly** drawing tools
- **Collapsible sidebar** with overlay on mobile
- **Compact timeline** slider for small screens
- **Optimized legend** that saves screen space
- **Touch gestures** for map navigation

## 🔮 Future Enhancements

- **Advanced Polygon Editing**: Vertex manipulation and reshaping
- **Data Export**: CSV/JSON export of weather data
- **Offline Support**: Service worker for offline functionality
- **Custom Map Layers**: Satellite imagery, weather overlays
- **Time-lapse Animation**: Visualize weather changes over time
- **Multi-user Collaboration**: Share and collaborate on maps
- **Advanced Analytics**: Weather trend analysis and forecasting

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/nikhilpurwar/Weather-Dashboard/issues) page
2. Create a new issue with detailed description
3. Provide browser version and steps to reproduce

## 🌟 Acknowledgments

- [Open-Meteo](https://open-meteo.com/) for free weather API
- [Leaflet](https://leafletjs.com/) for mapping functionality
- [React-Leaflet](https://react-leaflet.js.org/) for React integration
- [Tailwind CSS](https://tailwindcss.com/) for styling framework
- [Lucide](https://lucide.dev/) for beautiful icons

---

**Built with ❤️ by [Nikhil Purwar](https://github.com/nikhilpurwar)**

Made with React 19, TypeScript, and modern web technologies.
