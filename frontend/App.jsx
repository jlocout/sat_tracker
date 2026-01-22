import { useEffect, useRef } from 'react'
import { Viewer, Ion, Cartesian3, CallbackProperty, Color, JulianDate } from 'cesium'
import * as satellite from 'satellite.js'
import "cesium/Build/Cesium/Widgets/widgets.css"
import './App.css'
import { getSatelliteTrack } from './src/utils/satelliteHelpers'

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
    let viewer
    let mounted = true

    async function init() {
      if (!cesiumContainer.current) return
      viewer = new Viewer(cesiumContainer.current, {
        terrainProvider: undefined,
        shouldAnimate: true, // Ensure time flows so satellites move
      })

      // Add track toggle button outside the info box
      const toggleButton = document.createElement('button')
      toggleButton.textContent = 'Show Sat Track'
      toggleButton.style.cssText = 'position: absolute; top: 50px; right: 10px; z-index: 1000; padding: 8px 16px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; display: none;'
      viewer.container.appendChild(toggleButton)

      toggleButton.addEventListener('click', function() {
        const entity = viewer.selectedEntity
        if (entity && entity.trackEntity) {
          const currentlyShown = entity.trackEntity.polyline.show.getValue()
          entity.trackEntity.polyline.show = !currentlyShown
          toggleButton.textContent = currentlyShown ? 'Show Sat Track' : 'Hide Sat Track'
        }
      })

      // Show/hide button based on selection
      viewer.selectedEntityChanged.addEventListener(function() {
        if (viewer.selectedEntity && viewer.selectedEntity.trackEntity) {
          const isShown = viewer.selectedEntity.trackEntity.polyline.show.getValue()
          toggleButton.textContent = isShown ? 'Hide Sat Track' : 'Show Sat Track'
          toggleButton.style.display = 'block'
        } else {
          toggleButton.style.display = 'none'
        }
      })

      // Fetch TLEs from backend (use VITE_API_BASE_URL if provided)
      try {
        const base = import.meta.env.VITE_API_BASE_URL || ''
        const baseNormalized = base.endsWith('/') ? base.slice(0, -1) : base
        const url = baseNormalized ? `${baseNormalized}/api/tles` : '/api/tles'
        const resp = await fetch(url)
        if (!resp.ok) throw new Error('Failed to fetch TLEs')
        const tles = await resp.json()

        // Prevent race conditions: stop if component unmounted or viewer destroyed
        if (!mounted || !viewer || viewer.isDestroyed()) return

        tles.slice(0, 50).forEach((t) => {
          try {
            const satrec = satellite.twoline2satrec(t.tle1, t.tle2)
            const trackPositions = getSatelliteTrack(t.tle1, t.tle2)

            const positionProperty = new CallbackProperty(function (time) {
              try {
                const now = JulianDate.toDate(time)
                const pv = satellite.propagate(satrec, now)
                const posEci = pv.position
                if (!posEci) return Cartesian3.fromDegrees(0, 0, 0)
                const gmst = satellite.gstime(now)
                const geo = satellite.eciToGeodetic(posEci, gmst)
                const lon = satellite.radiansToDegrees(geo.longitude)
                const lat = satellite.radiansToDegrees(geo.latitude)
                const height = geo.height * 1000 // km -> meters
                return Cartesian3.fromDegrees(lon, lat, height)
              } catch (e) {
                console.error("Satellite propagation error:", e)
                return Cartesian3.fromDegrees(0, 0, 0)
              }
            }, false)

            // Format orbital elements for display
            const inclination = satellite.radiansToDegrees(satrec.inclo).toFixed(4)
            const raan = satellite.radiansToDegrees(satrec.nodeo).toFixed(4)
            const eccentricity = satrec.ecco.toFixed(7)
            const argPerigee = satellite.radiansToDegrees(satrec.argpo).toFixed(4)
            const meanAnomaly = satellite.radiansToDegrees(satrec.mo).toFixed(4)
            const meanMotion = (satrec.no * 1440 / (2 * Math.PI)).toFixed(4) // rad/min -> rev/day

            // Add satellite point (without polyline)
            const satelliteEntity = viewer.entities.add({
              id: t.name,
              name: t.name,
              description: `
                <h3>${t.name}</h3>
                <ul style="list-style: none; padding: 0; margin: 0; line-height: 1.5;">
                  <li><strong>Catalog Number:</strong> ${satrec.satnum}</li>
                  <li><strong>Inclination:</strong> ${inclination}°</li>
                  <li><strong>RA of Ascending Node:</strong> ${raan}°</li>
                  <li><strong>Eccentricity:</strong> ${eccentricity}</li>
                  <li><strong>Argument of Perigee:</strong> ${argPerigee}°</li>
                  <li><strong>Mean Anomaly:</strong> ${meanAnomaly}°</li>
                  <li><strong>Mean Motion:</strong> ${meanMotion} revs/day</li>
                </ul>
                <div style="margin-top: 10px;">
                  <strong>Raw TLE:</strong>
                  <pre style="font-family: monospace; font-size: 11px; overflow-x: auto; padding: 5px; background: rgba(255, 255, 255, 0.1); border-radius: 4px;">${t.tle1}\n${t.tle2}</pre>
                </div>
              `,
              position: positionProperty,
              point: {
                pixelSize: 6,
                color: Color.YELLOW,
                outlineWidth: 1,
                outlineColor: Color.BLACK,
              },
              label: {
                text: t.name,
                font: '12px sans-serif',
                style: undefined,
                horizontalOrigin: undefined,
                pixelOffset: undefined,
              },
            })

            // Add orbital track as separate entity
            const trackEntity = viewer.entities.add({
              id: `${t.name}-track`,
              name: `${t.name} Track`,
              polyline: {
                positions: trackPositions,
                width: 2,
                material: Color.YELLOW.withAlpha(0.5),
                show: false,
              },
            })

            // Link track to satellite for easy access
            satelliteEntity.trackEntity = trackEntity
          } catch (e) {
            // ignore malformed TLEs
            console.warn('Skipping TLE', t.name, e)
          }
        })
      } catch (e) {
        console.error('Error loading TLEs:', e)
      }
    }

    init()

    return () => {
      mounted = false
      if (viewer && !viewer.isDestroyed()) viewer.destroy()
    }
  }, [])

  return (
    <div ref={cesiumContainer} className="cesium-container" />
  )
}

export default App