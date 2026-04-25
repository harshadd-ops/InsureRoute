import axios from 'axios'

const API_ROOT = import.meta.env.VITE_API_BASE || 'https://insureroute-backend-758641920121.us-central1.run.app'
const BASE = `${API_ROOT}/api/v1`

/**
 * Fetch road-following coordinates for an ordered list of hub ids.
 * Backend uses OpenRouteService when OPENROUTESERVICE_API_KEY is set.
 * @param {string[]} pathIds
 * @returns {Promise<{ mode: string, coordinates: number[][], message?: string }>}
 */
export async function fetchRoadGeometry(pathIds, signal) {
  if (!pathIds || pathIds.length < 2) {
    return { mode: 'fallback', coordinates: [], variants: [], message: 'Not enough waypoints' }
  }
  try {
    const res = await axios.get(`${BASE}/map-directions`, {
      params: { path: JSON.stringify(pathIds) },
      timeout: 40000,
      signal,
    })
    return {
      mode: res.data?.mode || 'fallback',
      coordinates: res.data?.coordinates || [],
      variants: Array.isArray(res.data?.variants) ? res.data.variants : [],
      message: res.data?.message || null,
    }
  } catch (err) {
    if (err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError' || err?.name === 'AbortError')
      throw err
    return {
      mode: 'fallback',
      coordinates: [],
      variants: [],
      message: 'WARNING: Optimized route unavailable (backend unreachable)',
    }
  }
}
