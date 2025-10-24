# GI Yatra - Karnataka GI Explorer

# GI Yatra Frontend

> A modern React application for exploring Karnataka's Geographical Indication (GI) locations and planning smart offline trips with native maps integration.

---

## ✨ Key Features

### GI Locations Management

* View all Karnataka GI locations with detailed information
* Search and filter locations by district
* Add new locations with image upload
* Responsive grid layout with modern UI
* Lazy-loaded images with fallback placeholders
* Clean product badges: all locations are visible, but the "Not for sale" text is hidden; a Buy button appears only when stock (> 0) is available

### Services Directory

* Browse hotels, restaurants, transport, and other services
* Filter by service type with intuitive icons
* Contact information and ratings display
* Add your business to help travelers
* Service-specific styling and categorization

### Smart Trip Planning

* Offline schedule generation (no backend required)
* Multi-step trip creation wizard
* Visual location selection interface
* Automatic day-wise itinerary creation
* Time-optimized routing with travel buffers
* Trip progress tracking and editing

### Native Maps Integration

* No API keys required
* Opens routes in device's native map apps (Google Maps, Apple Maps, etc.)
* Turn-by-turn navigation support
* Real-time traffic updates
* Offline maps capability

### Geolocation Features

* "Use My Location" with reverse geocoding
* Converts GPS coordinates to readable addresses
* Uses OpenStreetMap Nominatim (no API keys)

### Production Ready

* Global error boundary for crash protection
* Robust image handling with SafeImage component
* Client-side trip storage using localStorage
* Responsive design for all devices
* Modern UI with smooth animations

---

## 🚀 Quick Start

### Prerequisites

* Node.js 16+ and npm
* Backend server running at `http://127.0.0.1:8000`

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build

# Serve production build
npm run serve
```

### Configuration

Create a `.env` file in the project root if you need to point the frontend to a different backend API:

```bash
REACT_APP_API_URL=https://your-backend.example.com
```

No Google Maps API keys are needed; routes open in the device’s native maps app.

---

## 📁 Project Structure

```
giyatra_frontend/
├── public/
│   ├── index.html
│   ├── manifest.json
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── GILocations.js
│   │   ├── GILocationsList.js
│   │   ├── CreateGILocation.js
│   │   ├── Services.js
│   │   ├── ServicesList.js
│   │   ├── CreateService.js
│   │   ├── TripPlanning.js
│   │   ├── TripsList.js
│   │   ├── TripPlanner.js
│   │   ├── TripMap.js
│   │   └── AppErrorBoundary.js
│   ├── services/
│   │   ├── giyatraApi.js
│   │   └── localTripStorage.js
│   ├── styles/
│   │   ├── index.css
│   │   ├── App.css
│   │   ├── GILocations.css
│   │   ├── Services.css
│   │   └── TripPlanning.css
│   ├── App.js
│   └── index.js
├── package.json
└── README.md
```

---

## 🛠️ API Integration

### GI Locations APIs

* `GET /api/gi-locations/` - List all locations
* `POST /api/gi-locations/` - Create location
* `GET /api/gi-locations/{id}/` - Get location details
* `PATCH /api/gi-locations/{id}/` - Update location
* `DELETE /api/gi-locations/{id}/` - Delete location
* `GET /api/gi-locations/districts/` - Get all districts

### Services APIs

* `GET /api/ad-locations/` - List all services
* `POST /api/ad-locations/` - Create service
* `GET /api/ad-locations/service_types/` - Get service types

### Trip Planning APIs

* `GET /api/trips/` - List trips
* `POST /api/trips/` - Create trip
* `POST /api/trips/{id}/add_location/` - Add location
* `POST /api/trips/{id}/generate_schedule/` - AI Schedule Generation
* `GET /api/trips/{id}/schedule/` - Get optimized schedule

---

## 🎨 UI/UX Features

### Modern Design System

* Gradient backgrounds and glassmorphism effects
* Responsive grid layouts
* Interactive hover effects and animations
* Loading states and error handling
* Mobile-first responsive design
* Accessibility (WCAG compliant)

---

## ⚡ Performance Optimizations

* Code splitting and lazy loading
* Image optimization
* Service worker for offline functionality
* Bundle size optimization with tree shaking

---

## 🔧 Development Features

* Hot reloading
* ESLint configuration
* Error boundaries
* Console logging
* TypeScript-ready structure

---

## 🚀 Deployment

### Netlify

```bash
npm run build
netlify deploy --prod --dir=build
```

### Vercel

```bash
npm install -g vercel
vercel --prod
```

### GitHub Pages

```bash
npm install --save-dev gh-pages
npm run deploy
```

### AWS S3

```bash
npm run build
aws s3 sync build/ s3://your-bucket-name --acl public-read
```

---

## 📱 Progressive Web App (PWA)

* App manifest for installability
* Service worker for offline use
* App icons and splash screens
* Theme colors and display modes

---

## 🔒 Privacy & Security

* No authentication required
* Local storage only (no server-side persistence)
* No tracking or analytics
* HTTPS recommended
* No API keys required

---


## 🙏 Acknowledgments

* **Karnataka GI Directory** for location data
* **OpenStreetMap** contributors for geocoding
* **React Team** for the framework
* **Open Source Community** for tools and inspiration

---

**Built with care for Karnataka’s authentic Geographical Indications**
