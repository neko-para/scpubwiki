import emitter from '../async-emitter.js'
import descs from './data.js'
import { data, getCard, getUnit } from '../data'
import { Pool as _Pool } from './pool.js'

export const Pool = _Pool

export const infrs = ['反应堆', '科技实验室', '高级科技实验室']

const upgrades = [
  null, 5, 7, 8, 9, 11
]

export class Player {
  constructor () {
    this.bus = new emitter()
    
    this.level = 1
    this.upgrade_cost = upgrades[1]
    this.round = 1
    this.mineral = 3
    this.max_mineral = 3
    this.gas = 0

    this.hand = Array(6).fill(null)
    this.present = Array(7).fill(null)

    this.flag = {} // 用于检测唯一

    this.refresh = () => {}
    this.cache = ''

    this.bus.on('*<', (ev, param) => {
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

  calculateValue () {
    let sum = 0
    this.enumPresent(card => {
      sum += card.calculateValue()
    })
    return sum
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

      bus: new emitter(),
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
      },
      calculateValue () {
        let sum = 0
        this.unit.forEach(u => {
          sum += getUnit(u).value
        })
        return sum
      }
    }
    
    card.bus.on('*<', (ev) => {
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

    this.refresh()
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

    this.refresh()
    return true
  }

  sell (pos) {
    this.present[pos].desc()
    this.bus.emit('card-sell', {
      selled: this.present[pos]
    })
    this.present[pos] = null
    this.mineral += 1
    this.refresh()
  }

  sell_hand (pos) {
    this.hand[pos] = null
    this.mineral += 1
    this.refresh()
  }

  obtain_hand (cardt) {
    for (let i = 0; i < 6; i++) {
      if (!this.hand[i]) {
        this.hand[i] = cardt
        this.refresh()
        return true
      }
    }
    return false
  }

  next_round () {
    this.bus.emit('round-end')
    this.round++
    if (this.upgrade_cost > 0) {
      this.upgrade_cost--
    }
    if (this.max_mineral < 10) {
      this.max_mineral++
    }
    this.mineral = this.max_mineral
    if (this.gas < 6) {
      this.gas++
    }
    this.bus.emit('round-start')
    this.refresh()
  }

  do_refresh () {
    this.bus.emit('refresh')
    this.refresh()
  }

  do_upgrade () {
    if (this.mineral >= this.upgrade_cost) {
      this.mineral -= this.upgrade_cost
      this.level++
      this.upgrade_cost = upgrades[this.level]
      this.bus.emit('upgrade-pub')
      this.refresh()
    }
  }
}
