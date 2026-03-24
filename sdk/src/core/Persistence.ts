export class Persistence {
  private prefix: string
  private mode: 'localStorage' | 'cookie' | 'none'

  constructor(token: string, mode: 'localStorage' | 'cookie' | 'none' = 'localStorage') {
    this.prefix = `g5_${token}_`
    this.mode = mode
  }

  get(key: string): string | null {
    if (this.mode === 'localStorage' && typeof localStorage !== 'undefined') {
      return localStorage.getItem(this.prefix + key)
    }
    if (this.mode === 'cookie') {
      return this.getCookie(this.prefix + key)
    }
    return null
  }

  set(key: string, value: string, days?: number): void {
    if (this.mode === 'localStorage' && typeof localStorage !== 'undefined') {
      localStorage.setItem(this.prefix + key, value)
    } else if (this.mode === 'cookie') {
      this.setCookie(this.prefix + key, value, days || 365)
    }
  }

  remove(key: string): void {
    if (this.mode === 'localStorage' && typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.prefix + key)
    } else if (this.mode === 'cookie') {
      this.setCookie(this.prefix + key, '', -1)
    }
  }

  private getCookie(name: string): string | null {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
    return match ? decodeURIComponent(match[2]) : null
  }

  private setCookie(name: string, value: string, days: number): void {
    const expires = new Date(Date.now() + days * 864e5).toUTCString()
    document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires};path=/;SameSite=Lax`
  }
}
