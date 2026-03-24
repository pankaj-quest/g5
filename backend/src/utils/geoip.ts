import geoip from 'geoip-lite'

export interface GeoResult {
  ip?: string
  country?: string
  region?: string
  city?: string
}

export function resolveGeo(ip?: string): GeoResult {
  if (!ip) return {}
  const geo = geoip.lookup(ip)
  if (!geo) return { ip }
  return {
    ip,
    country: geo.country,
    region: geo.region,
    city: geo.city,
  }
}
