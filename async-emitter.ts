export interface NormalFunc {
  (param: object): void
}
export interface WildcastFunc {
  (event: string, param: object): void
}
export interface AsyncWildcastFunc {
  (event: string, param: object): Promise<void>
}

export class Emitter {
  map: Map<string, NormalFunc[]>
  wcf: WildcastFunc[]
  wca: WildcastFunc[]

  constructor() {
    this.map = new Map()
    this.wcf = []
    this.wca = []
  }

  wildcast(name: "*<" | "*", func: WildcastFunc) {
    if (name === "*<") {
      this.wcf.push(func)
    } else {
      this.wca.push(func)
    }
  }

  on(name: string, func: NormalFunc) {
    const arr = this.map.get(name)
    if (arr) {
      arr.push(func)
    } else {
      this.map.set(name, [func])
    }
  }

  off(name: string, func: NormalFunc) {
    const arr = this.map.get(name)
    if (arr) {
      if (func) {
        const idx = arr.indexOf(func)
        if (idx !== -1) {
          arr.splice(idx, 1)
        }
      } else {
        this.map.set(name, [])
      }
    }
  }

  emit(name: string, param: object) {
    if (name[name.length - 1] !== "$") {
      for (const f of this.wcf) {
        f(name, param)
      }
    }
    for (const f of this.map.get(name) || []) {
      f(param)
    }
    if (name[name.length - 1] !== "$") {
      for (const f of this.wca) {
        f(name, param)
      }
    }
  }
}

export class AsyncEmitter<T extends Record<string, object>> {
  map: Map<keyof T & string, ((param: any) => Promise<void>)[]>
  wcf: AsyncWildcastFunc[]
  wca: AsyncWildcastFunc[]

  constructor() {
    this.map = new Map()
    this.wcf = []
    this.wca = []
  }

  wildcast(name: "*<" | "*", func: AsyncWildcastFunc) {
    if (name === "*<") {
      this.wcf.push(func)
    } else {
      this.wca.push(func)
    }
  }

  on<K extends keyof T & string>(
    name: K,
    func: (param: T[K]) => Promise<void>
  ) {
    const arr = this.map.get(name)
    if (arr) {
      arr.push(func)
    } else {
      this.map.set(name, [func])
    }
  }

  off<K extends keyof T & string>(
    name: K,
    func: (param: T[K]) => Promise<void>
  ) {
    const arr = this.map.get(name)
    if (arr) {
      if (func) {
        const idx = arr.indexOf(func)
        if (idx !== -1) {
          arr.splice(idx, 1)
        }
      } else {
        this.map.set(name, [])
      }
    }
  }

  async async_emit<K extends keyof T & string>(name: K, param: T[K]) {
    if (name[name.length - 1] !== "$") {
      for (const f of this.wcf) {
        await f(name, param)
      }
    }
    for (const f of this.map.get(name) || []) {
      await f(param)
    }
    if (name[name.length - 1] !== "$") {
      for (const f of this.wca) {
        await f(name, param)
      }
    }
  }
}
