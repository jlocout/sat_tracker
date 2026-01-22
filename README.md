# Satellite Tracker

A real-time 3D satellite tracking application that visualizes orbital paths and satellite positions on an interactive globe. Built with React, Cesium, and ASP.NET Core.

## Features

- **Real-time 3D Visualization**: Interactive globe powered by Cesium displaying satellite positions in real-time
- **Orbital Path Tracking**: Toggle orbital tracks for individual satellites to visualize their complete orbit
- **Detailed Satellite Information**: View orbital elements including inclination, eccentricity, mean motion, and raw TLE data
- **Live TLE Data**: Fetches up-to-date Two-Line Element (TLE) data from Space-Track.org or CelesTrak
- **Smooth Animations**: Time-based satellite propagation using SGP4 algorithm for accurate position calculations
- **50+ Satellites**: Tracks multiple satellites simultaneously with labels and selection capabilities

## Tech Stack

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **Cesium** - 3D geospatial visualization platform
- **satellite.js** - SGP4 satellite orbit propagation

### Backend
- **ASP.NET Core** - Microservice for TLE data retrieval
- **Space-Track.org API** - Authenticated TLE data source
- **CelesTrak** - Public TLE data fallback

## Prerequisites

Before running this project, ensure you have the following installed:

- **Node.js** (v16 or higher) and npm
- **.NET SDK** (v6.0 or higher)
- **Cesium Ion Access Token** - Get one free at [https://ion.cesium.com](https://ion.cesium.com)
- **Space-Track.org Account** (optional) - For authenticated TLE access at [https://www.space-track.org](https://www.space-track.org)

## Quick Start

The easiest way to run the entire application is using the provided startup script:

```bash
# Clone the repository
git clone https://github.com/yourusername/sat_tracker.git
cd sat_tracker

# Make the startup script executable
chmod +x startup.sh

# Start both frontend and backend
./startup.sh dev
```

The application will be available at `http://localhost:5173`

## Manual Setup

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
npm install
```

2. Create a `.env` file with your Cesium Ion access token:
```bash
echo "VITE_CESIUM_ION_ACCESS_TOKEN=your_token_here" > .env
```

3. (Optional) Configure the backend API URL:
```bash
echo "VITE_API_BASE_URL=http://localhost:5000" >> .env
```

4. Start the development server:
```bash
npm run dev
```

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend/TLE
```

2. (Optional) Create a `.env` file with Space-Track credentials for authenticated access:
```bash
echo "SPACETRACK_USERNAME=your_username" > .env
echo "SPACETRACK_PASSWORD=your_password" >> .env
```

If credentials are not provided, the backend will fall back to public CelesTrak data.

3. Run the backend service:
```bash
dotnet run --project SatTracker.Api.csproj
```

The API will be available at `http://localhost:5000`

## Usage

### Startup Script Commands

The `startup.sh` script supports multiple modes:

```bash
# Development mode (starts backend + frontend dev server)
./startup.sh dev

# Preview mode (starts backend + production build preview)
./startup.sh preview

# Backend only (runs backend in foreground)
./startup.sh backend

# Stop all services
./startup.sh stop
```

### Using the Application

1. **Select a Satellite**: Click on any yellow satellite point on the globe
2. **View Details**: The info box displays orbital parameters and TLE data
3. **Toggle Orbital Track**: Click the "Show Sat Track" button to visualize the satellite's complete orbital path
4. **Navigate**: Use mouse to rotate, zoom, and pan around the globe
   - Left-click + drag: Rotate globe
   - Right-click + drag: Pan
   - Scroll: Zoom in/out

## Project Structure

```
sat_tracker/
├── frontend/               # React + Cesium frontend application
│   ├── src/
│   │   ├── main.jsx       # React entry point
│   │   └── utils/
│   │       └── satelliteHelpers.js  # Orbital track calculation
│   ├── App.jsx            # Main Cesium viewer component
│   ├── App.css            # Application styles
│   ├── index.css          # Global styles
│   ├── index.html         # HTML entry point
│   ├── package.json       # Frontend dependencies
│   └── vite.config.js     # Vite configuration
├── backend/
│   └── TLE/               # ASP.NET Core TLE microservice
│       ├── Services/
│       │   └── TleService.cs    # TLE fetching logic
│       ├── Models/
│       │   └── TleModel.cs      # TLE data model
│       ├── Program.cs           # API endpoint configuration
│       └── SatTracker.Api.csproj
├── startup.sh             # Unified startup script
└── README.md             # This file
```

## Configuration

### Environment Variables

#### Frontend (`.env` in `frontend/` directory)
```env
VITE_CESIUM_ION_ACCESS_TOKEN=your_cesium_token
VITE_API_BASE_URL=http://localhost:5000  # Optional, defaults to same origin
```

#### Backend (`.env` in `backend/TLE/` directory)
```env
SPACETRACK_USERNAME=your_username  # Optional, falls back to CelesTrak
SPACETRACK_PASSWORD=your_password  # Optional
```

## API Endpoints

### GET `/api/tles`
Returns an array of satellite TLE data objects.

**Response:**
```json
[
  {
    "name": "ISS (ZARYA)",
    "tle1": "1 25544U 98067A   ...",
    "tle2": "2 25544  51.6416 ..."
  }
]
```

## Development

### Frontend Development
```bash
cd frontend
npm run dev      # Start dev server
npm run build    # Build for production
npm run preview  # Preview production build
```

### Backend Development
```bash
cd backend/TLE
dotnet run                    # Run in development mode
dotnet build                  # Build the project
dotnet test                   # Run tests (if available)
```

## Orbital Mechanics

This application uses the SGP4 (Simplified General Perturbations 4) propagator to calculate satellite positions. The orbital elements displayed include:

- **Inclination**: Angle between orbital plane and equator
- **RAAN**: Right Ascension of Ascending Node
- **Eccentricity**: Orbital shape (0 = circular, >0 = elliptical)
- **Argument of Perigee**: Angle to lowest orbital point
- **Mean Anomaly**: Position along orbit at epoch
- **Mean Motion**: Orbits per day

## Troubleshooting

### Backend won't start
- Ensure .NET SDK is installed: `dotnet --version`
- Check if port 5000 is available: `lsof -ti:5000`
- Stop existing processes: `./startup.sh stop`

### Frontend shows no satellites
- Check backend is running at `http://localhost:5000/api/tles`
- Verify CORS is enabled in backend `Program.cs`
- Check browser console for errors

### Missing Cesium Ion token
- Sign up at [https://ion.cesium.com](https://ion.cesium.com)
- Create a new access token
- Add to `frontend/.env` file

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Cesium](https://cesium.com/) for the amazing 3D geospatial platform
- [Space-Track.org](https://www.space-track.org) for providing satellite TLE data
- [CelesTrak](https://celestrak.org/) for public TLE data access
- [satellite.js](https://github.com/shashwatak/satellite-js) for SGP4 implementation

## Resources

- [TLE Format Documentation](https://en.wikipedia.org/wiki/Two-line_element_set)
- [SGP4 Orbit Propagation](https://en.wikipedia.org/wiki/Simplified_perturbations_models)
- [Cesium Documentation](https://cesium.com/learn/)
- [Space-Track API Documentation](https://www.space-track.org/documentation)
