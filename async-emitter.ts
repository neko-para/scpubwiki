export interface SyncWildcastFunc {
  (event: string, param: object): void
}
export interface WildcastFunc {
  (event: string, param: object): Promise<void>
}

type SyncFuncs = ((param: any) => void)[]

export class Emitter<T extends Record<string, object>> {
  map: Map<
    keyof T & string,
    {
      [key in "before" | "on" | "after"]: SyncFuncs
    }
  >
  wc: SyncWildcastFunc[]

  constructor() {
    this.map = new Map()
    this.wc = []
  }

  wildcast(func: SyncWildcastFunc) {
    this.wc.push(func)
  }

  before<K extends keyof T & string>(name: K, func: (param: T[K]) => void) {
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

  on<K extends keyof T & string>(name: K, func: (param: T[K]) => void) {
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

  after<K extends keyof T & string>(name: K, func: (param: T[K]) => void) {
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

  off<K extends keyof T & string>(name: K, func: (param: T[K]) => void) {
    const obj = this.map.get(name)
    if (!obj) {
      return
    }
    for (const key of ["before", "on", "after"]) {
      const fs = obj[key as "before" | "on" | "after"]
      const idx = fs.indexOf(func)
      if (idx !== -1) {
        fs.splice(idx, 1)
      }
    }
  }

  async emit<K extends keyof T & string>(name: K, param: T[K]) {
    const obj = this.map.get(name) || {
      before: [],
      on: [],
      after: [],
    }
    for (const f of obj.before) {
      f(param)
    }
    for (const f of obj.on) {
      f(param)
    }
    for (const f of obj.after) {
      f(param)
    }
    for (const f of this.wc) {
      f(name, param)
    }
  }
}

type Funcs = ((param: any) => Promise<void>)[]

export class AsyncEmitter<T extends Record<string, object>> {
  map: Map<
    keyof T & string,
    {
      [key in "before" | "on" | "after"]: Funcs
    }
  >
  wc: WildcastFunc[]

  constructor() {
    this.map = new Map()
    this.wc = []
  }

  wildcast(func: WildcastFunc) {
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
      const fs = obj[key as "before" | "on" | "after"]
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
