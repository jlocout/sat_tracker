import * as satellite from 'satellite.js'
import { Cartesian3 } from 'cesium'

/**
 * Generate orbital track positions for a satellite
 * @param {string} tle1 - First line of TLE data
 * @param {string} tle2 - Second line of TLE data
 * @param {number} samplesPerOrbit - Number of position samples per orbit (default: 120)
 * @param {number} numOrbits - Number of orbits to trace (default: 1)
 * @returns {Cartesian3[]} Array of Cartesian3 positions representing the orbital path
 */
export function getSatelliteTrack(tle1, tle2, samplesPerOrbit = 120, numOrbits = 1) {
  try {
    // Parse the TLE to get satellite record
    const satrec = satellite.twoline2satrec(tle1, tle2)

    // Calculate orbital period from mean motion
    // satrec.no is mean motion in radians/minute
    // Convert to revolutions per day, then to period in minutes
    const meanMotionRevPerDay = (satrec.no * 1440) / (2 * Math.PI)
    const orbitalPeriodMinutes = 1440 / meanMotionRevPerDay // minutes per orbit

    // Total time span to trace
    const totalMinutes = orbitalPeriodMinutes * numOrbits
    const timeStepMinutes = totalMinutes / samplesPerOrbit

    const positions = []
    const now = new Date()

    // Sample positions along the orbit
    for (let i = 0; i <= samplesPerOrbit; i++) {
      const futureTime = new Date(now.getTime() + i * timeStepMinutes * 60 * 1000)

      // Propagate satellite to this time
      const positionAndVelocity = satellite.propagate(satrec, futureTime)
      const positionEci = positionAndVelocity.position

      // Skip if propagation failed
      if (!positionEci || typeof positionEci.x === 'undefined') {
        continue
      }

      // Convert ECI coordinates to geodetic (lat, lon, height)
      const gmst = satellite.gstime(futureTime)
      const positionGd = satellite.eciToGeodetic(positionEci, gmst)

      const longitude = satellite.radiansToDegrees(positionGd.longitude)
      const latitude = satellite.radiansToDegrees(positionGd.latitude)
      const height = positionGd.height * 1000 // Convert km to meters

      // Convert to Cesium Cartesian3
      positions.push(Cartesian3.fromDegrees(longitude, latitude, height))
    }

    return positions
  } catch (error) {
    console.error('Error generating satellite track:', error)
    return []
  }
}
