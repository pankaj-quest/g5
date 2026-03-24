import { UAParser } from 'ua-parser-js'

export interface DeviceResult {
  os?: string
  browser?: string
  deviceType?: 'mobile' | 'tablet' | 'desktop' | 'unknown'
}

export function parseDevice(userAgent?: string): DeviceResult {
  if (!userAgent) return { deviceType: 'unknown' }
  const parser = new UAParser(userAgent)
  const result = parser.getResult()

  let deviceType: DeviceResult['deviceType'] = 'desktop'
  const deviceKind = result.device.type
  if (deviceKind === 'mobile') deviceType = 'mobile'
  else if (deviceKind === 'tablet') deviceType = 'tablet'
  else if (!deviceKind) deviceType = 'desktop'
  else deviceType = 'unknown'

  return {
    os: result.os.name,
    browser: result.browser.name,
    deviceType,
  }
}
