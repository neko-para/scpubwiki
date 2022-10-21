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
    const obj = this.map.get(name)
    if (obj) {
      obj.push(func)
    } else {
      this.map.set(name, [func])
    }
  }

  off(name: string, func: NormalFunc) {
    const obj = this.map.get(name)
    if (obj) {
      if (func) {
        const idx = obj.indexOf(func)
        if (idx !== -1) {
          obj.splice(idx, 1)
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

type Funcs = ((param: any) => Promise<void>)[]

export class AsyncEmitter<T extends Record<string, object>> {
  map: Map<
    keyof T & string,
    {
      before: Funcs
      on: Funcs
      after: Funcs
    }
  >
  wc: AsyncWildcastFunc[]

  constructor() {
    this.map = new Map()
    this.wc = []
  }

  wildcast(func: AsyncWildcastFunc) {
    this.wc.push(func)
  }

  before<K extends keyof T & string>(
    name: K,
    func: (param: T[K]) => Promise<void>
  ) {
    const obj = this.map.get(name)
    if (obj) {
      obj.before.push(func)
    } else {
      this.map.set(name, {
        before: [func],
        on: [],
        after: [],
      })
    }
  }

  on<K extends keyof T & string>(
    name: K,
    func: (param: T[K]) => Promise<void>
  ) {
    const obj = this.map.get(name)
    if (obj) {
      obj.on.push(func)
    } else {
      this.map.set(name, {
        before: [],
        on: [func],
        after: [],
      })
    }
  }

  after<K extends keyof T & string>(
    name: K,
    func: (param: T[K]) => Promise<void>
  ) {
    const obj = this.map.get(name)
    if (obj) {
      obj.after.push(func)
    } else {
      this.map.set(name, {
        before: [],
        on: [],
        after: [func],
      })
    }
  }

  off<K extends keyof T & string>(
    name: K,
    func: (param: T[K]) => Promise<void>
  ) {
    const obj = this.map.get(name)
    if (!obj) {
      return
    }
    for (const key of ["before", "on", "after"]) {
      const fs = obj[key] as Funcs
      const idx = fs.indexOf(func)
      if (idx !== -1) {
        fs.splice(idx, 1)
      }
    }
  }

  async async_emit<K extends keyof T & string>(name: K, param: T[K]) {
    const obj = this.map.get(name) || {
      before: [],
      on: [],
      after: [],
    }
    for (const f of obj.before) {
      await f(param)
    }
    for (const f of obj.on) {
      await f(param)
    }
    for (const f of obj.after) {
      await f(param)
    }
    for (const f of this.wc) {
      await f(name, param)
    }
  }
}
