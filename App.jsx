import { useEffect, useRef } from 'react'
import { Viewer, Ion } from 'cesium'
import "cesium/Build/Cesium/Widgets/widgets.css"
import './App.css'

// Set your Cesium ion access token here
Ion.defaultAccessToken = import.meta.env.VITE_CESIUM_ION_ACCESS_TOKEN;

if (import.meta.env.DEV) {
  console.log('Cesium running in development mode');
  if (!Ion.defaultAccessToken) {
    console.warn("Cesium Ion Access Token is missing. Please set VITE_CESIUM_ION_ACCESS_TOKEN in your .env or .env.development file.");
  }
}

function App() {
  const cesiumContainer = useRef(null)

  useEffect(() => {
    if (cesiumContainer.current) {
      const viewer = new Viewer(cesiumContainer.current, {
        terrainProvider: undefined,
      })

      return () => {
        if (viewer && !viewer.isDestroyed()) {
          viewer.destroy()
        }
      }
    }
  }, [])

  return (
    <div ref={cesiumContainer} className="cesium-container" />
  )
}

export default App