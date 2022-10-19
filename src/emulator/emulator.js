import mitt from 'mitt'
import descs from './core.js'
import { data, getCard } from '../data.js'

const poolCount = {
  1: 18, 2: 15, 3: 13, 4: 11, 5: 9, 6: 6
}

const infrs = ['反应堆', '科技实验室', '高级科技实验室']

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
    this.mineral = 0
    this.gas = 0
    this.hand = Array(6).fill(null)
    this.present = Array(7).fill(null)
    this.flag = {} // 用于检测唯一

    this.bus.on('round-start', () => {
      this.flag = {}
    })
    this.bus.on('*', (ev, param) => {
      param = param || {}
      if ('card' in param) {
        if (param.card) {
          param.card.bus.emit(ev, param)
        }
      } else {
        this.enumPresent(c => {
          c.bus.emit(ev, param)
        })
      }
    })
  }

  enumPresent(func) {
    for (let i = 0; i < 7; i++) {
      if (this.present[i]) {
        if (func(this.present[i])) {
          return
        }
      }
    }
  }

  enter (cardt, pos) {
    const card = {
      template: cardt,
      name: cardt.name,
      race: cardt.race,
      level: cardt.level,
      unit: [],

      bus: mitt(),
      player: this,
      pos,

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
    this.present[pos] = card
    for (const k in cardt.unit) {
      card.unit.push(...Array(cardt.unit[k]).fill(k))
    }

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

    card.desc = descs[cardt.name](this, card, false).clear()

    this.bus.emit('card-enter', {
      card
    })

    this.bus.emit('post-enter', {
      card
    })
  }

  sell (pos) {
    this.bus.emit('card-sell', {
      selled: this.present[pos]
    })
    this.present[pos] = null
  }
}
