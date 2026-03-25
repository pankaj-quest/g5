export class Persistence {
  private prefix: string
  private mode: 'localStorage' | 'cookie' | 'none'
  private cookieDomain: string

  constructor(
    token: string,
    mode: 'localStorage' | 'cookie' | 'none' = 'localStorage',
    cookieDomain = ''
  ) {
    this.prefix = `g5_${token}_`
    this.mode = mode
    this.cookieDomain = cookieDomain
  }

  get(key: string): string | null {
    try {
      if (this.mode === 'localStorage' && typeof localStorage !== 'undefined') {
        return localStorage.getItem(this.prefix + key)
      }
      if (this.mode === 'cookie' && typeof document !== 'undefined') {
        return this.getCookie(this.prefix + key)
      }
    } catch {
      // localStorage or cookie access may throw in some environments
    }
    return null
  }

  set(key: string, value: string, days?: number): void {
    try {
      if (this.mode === 'localStorage' && typeof localStorage !== 'undefined') {
        localStorage.setItem(this.prefix + key, value)
      } else if (this.mode === 'cookie' && typeof document !== 'undefined') {
        this.setCookie(this.prefix + key, value, days || 365)
      }
    } catch {
      // Silently fail if storage is unavailable
    }
  }

  remove(key: string): void {
    try {
      if (this.mode === 'localStorage' && typeof localStorage !== 'undefined') {
        localStorage.removeItem(this.prefix + key)
      } else if (this.mode === 'cookie' && typeof document !== 'undefined') {
        this.setCookie(this.prefix + key, '', -1)
      }
    } catch {
      // Silently fail
    }
  }

  private getCookie(name: string): string | null {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
    return match ? decodeURIComponent(match[2]) : null
  }

  private setCookie(name: string, value: string, days: number): void {
    const expires = new Date(Date.now() + days * 864e5).toUTCString()
    let cookie = `${name}=${encodeURIComponent(value)};expires=${expires};path=/;SameSite=Lax`
    if (this.cookieDomain) {
      cookie += `;domain=${this.cookieDomain}`
    }
    document.cookie = cookie
  }
}
