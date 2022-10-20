export default class AsyncEmitter {
  constructor () {
    this.map = new Map()
  }

  on (name, func) {
    const arr = this.map.get(name)
    if (arr) {
      arr.push(func)
    } else {
      this.map.set(name, [ func ])
    }
  }

  off (name, func) {
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

  emit (name, param) {
    if (name[name.length - 1] !== '$') {
      for (const f of this.map.get('*<') || []) {
        f(name, param)
      }
    }
    for (const f of this.map.get(name) || []) {
      f(param)
    }
    if (name[name.length - 1] !== '$') {
      for (const f of this.map.get('*') || []) {
        f(name, param)
      }
    }
  }
  
  async async_emit (name, param) {
    if (name[name.length - 1] !== '$') {
      for (const f of this.map.get('*<') || []) {
        await f(name, param)
      }
    }
    for (const f of this.map.get(name) || []) {
      await f(param)
    }
    if (name[name.length - 1] !== '$') {
      for (const f of this.map.get('*') || []) {
        await f(name, param)
      }
    }
  }
}