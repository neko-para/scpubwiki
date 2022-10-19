import mitt from 'mitt'
import descs from './data.js'
import { data, getCard } from '../data'

const poolCount = {
  1: 18, 2: 15, 3: 13, 4: 11, 5: 9, 6: 6
}

export const infrs = ['反应堆', '科技实验室', '高级科技实验室']

export class Pool {
  constructor () {
    this.pool = []
    for (const k in data) {
      const c = getCard(k)
      if (c.attr?.rare) {
        if (Math.random() <= 0.15) {
          this.pool.push(c)
        }
      } else {
        this.pool.push(...Array(poolCount[c.level]).fill(c))
      }
    }
  }
}

export class Player {
  constructor () {
    this.bus = mitt()
    this.level = 1
    this.hand = Array(6).fill(null)
    this.mineral = 0
    this.gas = 0
    this.present = Array(7).fill(null)
    this.flag = {} // 用于检测唯一
    this.refresh = () => {}
    this.cache = ''

    this.bus.on('*', (ev, param) => {
      param = param || {}
      this.log(`玩家接收到 ${ev}  -  `, true)
      if ('card' in param) {
        if (param.card) {
          this.log(`转发至第${param.card.pos}张卡牌`)
          param.card.bus.emit(ev, param)
        } else {
          this.log('舍弃')
        }
      } else {
        this.log(`通知所有卡牌`)
        this.enumPresent(c => {
          c.bus.emit(ev, param)
        })
      }
    })
    this.bus.on('round-start', () => {
      this.flag = {}
    })
  }

  log (str, caching = false) {
    this.cache += str
    if (!caching) {
      if (this.logger) {
        this.logger(this.cache)
      }
      this.cache = ''
    }
  }

  enumPresent (func) {
    for (let i = 0; i < 7; i++) {
      if (this.present[i]) {
        if (func(this.present[i])) {
          return
        }
      }
    }
  }

  presentCount () {
    let n = 0
    this.present.forEach(p => {
      if (p) {
        n++
      }
    })
    return n
  }

  async requestEnter (pos, query) {
    if (this.presentCount() === 7) {
      return false
    }
    const cardt = this.hand[pos]
    if (cardt.attr?.insert) {
      return this.enter(pos, await query())
    } else {
      for (let i = 0; i < 7; i++) {
        if (!this.present[i]) {
          return this.enter(pos, i)
        }
      }
    }
  }

  insert (pos) {
    if (!this.present[pos]) {
      return true
    }
    for (let i = pos + 1; i < 7; i++) {
      if (!this.present[i]) {
        while (i > pos) {
          this.present[i] = this.present[i - 1]
          this.present[i].pos = i
          i--
        }
        return true
      }
    }
    for (let i = pos - 1; i >= 0; i--) {
      if (!this.present[i]) {
        while (i < pos) {
          this.present[i] = this.present[i + 1]
          this.present[i].pos = i
          i++
        }
        return true
      }
    }
    return false
  }

  instantiate (cardt) {
    const card = {
      template: cardt,
      name: cardt.name,
      race: cardt.race,
      level: cardt.level,
      unit: [],

      bus: mitt(),
      player: this,
      pos: -1,

      load_default_unit () {
        for (const k in cardt.unit) {
          card.unit.push(...Array(cardt.unit[k]).fill(k))
        }
      },
      take_unit (at) {
        const u = this.unit[at]
        this.unit[at] = this.unit[this.unit.length - 1]
        this.unit.pop()
        return u
      },
      find_infr () {
        return this.unit.findIndex((v) => {
          return infrs.includes(v)
        })
      },
      infr_type () {
        const idx = this.find_infr()
        if (idx === -1) {
          return -1
        } else {
          return infrs.indexOf(this.unit[idx])
        }
      },
      power () {
        return this.locate('水晶塔', this.unit.length).length + this.locate('虚空水晶塔', this.unit.length).length
      },
      locate (u, cnt, pos = 0) {
        const res = []
        while (cnt-- > 0) {
          const idx = this.unit.indexOf(u, pos)
          if (idx === -1) {
            return res
          }
          res.push(idx)
          pos = idx + 1
        }
        return res
      }
    }
    
    card.bus.on('*', (ev) => {
      this.log(`卡牌 ${card.pos} 接收到 ${ev}\n`)
    })

    card.bus.on('obtain-unit', ({ unit }) => {
      card.unit.push(...unit)
    })
    card.bus.on('round-end', () => {
      if (card.infr_type() === 2) {
        this.bus.emit('fast-prod', {
          card
        })
      }
    })
    card.bus.on('switch-infr', () => {
      const idx = card.find_infr ()
      if (idx !== -1) {
        const f = infrs.indexOf(card.unit[idx])
        if (f < 2) {
          card.unit[idx] = infrs[1 - f]
          this.bus.emit('fast-prod', {
            card
          })
        }
      }
    })
    card.bus.on('upgrade-infr', () => {
      const idx = card.find_infr ()
      if (idx !== -1) {
        const f = infrs.indexOf(card.unit[idx])
        if (f < 2) {
          card.unit[idx] = '高级科技实验室'
          this.bus.emit('fast-prod', {
            card
          })
        }
      }
    })
    card.bus.on('transform-unit', ({ index, to }) => {
      index.forEach(i => {
        card.unit[i] = to
      })
    })
    return card
  }

  findSame (cardt) {
    const target = []
    this.enumPresent(card => {
      if (card.name === cardt.name && !card.gold) {
        target.push(card.pos)
      }
    })
    return target
  }

  canCombine (pos) {
    const cardt = this.hand[pos]
    return cardt && !cardt.attr?.gold && this.findSame(cardt).length >= 2
  }

  combine (pos) {
    const cardt = this.hand[pos]
    const poses = this.findSame(cardt)
    if (poses.length < 2) {
      return false
    }
    this.hand[pos] = null

    const cl = this.present[poses[0]]
    const cr = this.present[poses[1]]

    const card = this.instantiate(cardt)
    card.gold = true
    card.pos = poses[0]
    card.unit = [
      ...cl.unit,
      ...cr.unit.filter(u => !infrs.includes(u))
    ]

    cl.desc()
    cr.desc()

    this.present[card.pos] = card
    this.present[poses[1]] = null

    card.desc = descs[cardt.name](this, card, true, msg => {
      card.announce = msg
      this.refresh()
    }).clear()

    this.bus.emit('post-enter', {
      card
    })

    this.bus.emit('card-combined', {
      card
    })

    return true
  }

  enter (pos, into) {
    if (!this.insert(into)) {
      return false
    }
    const cardt = this.hand[pos]
    this.hand[pos] = null

    const card = this.instantiate(cardt)
    if (cardt.attr?.gold) {
      card.darkgold = true
    }
    card.pos = into
    card.load_default_unit()

    this.present[into] = card

    card.desc = descs[cardt.name](this, card, false, msg => {
      card.announce = msg
      this.refresh()
    }).clear()

    this.bus.emit('card-enter', {
      card
    })

    this.bus.emit('post-enter', {
      card
    })

    return true
  }

  sell (pos) {
    this.present[pos].desc()
    this.bus.emit('card-sell', {
      selled: this.present[pos]
    })
    this.present[pos] = null
    this.mineral += 1
  }

  sell_hand (pos) {
    this.hand[pos] = null
    this.mineral += 1
  }

  obtain_hand (cardt) {
    for (let i = 0; i < 6; i++) {
      if (!this.hand[i]) {
        this.hand[i] = cardt
        return true
      }
    }
    return false
  }
}
