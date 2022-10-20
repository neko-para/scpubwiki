import emitter from '../async-emitter.js'
import descs from './data.js'
import { getUnit } from '../data'
import { Pool as _Pool } from './pool.js'
import { shuffle, 获得 } from './util.js'

export const Pool = _Pool

export const infrs = ['反应堆', '科技实验室', '高级科技实验室']

const upgrades = [
  null, 5, 7, 8, 9, 11
]

class Card {
  constructor (cardt, player) {
    this.bus = new emitter(),
    this.template = cardt,
    this.name = cardt.name,
    this.race = cardt.race,
    this.level = cardt.level,
    this.unit = [],
    this.upgrade = []

    this.player = player,
    this.pos = -1
    this.info = {}

    this.bus.on('*<', async (ev) => {
      player.log(`卡牌 ${this.pos} 接收到 ${ev}\n`)
    })

    this.bus.on('obtain-unit', async ({ unit }) => {
      await player.step(`卡牌 ${this.pos} ${this.name} 即将获得 ${unit.join(', ')}`)
      this.unit.push(...unit)
    })

    this.bus.on('round-end', async () => {
      if (this.infr_type() === 2) {
        await player.step(`卡牌 ${this.pos} ${this.name} 即将触发快速生产`)
        await player.bus.async_emit('fast-prod', {
          card: this
        })
      }
    })

    this.bus.on('switch-infr', async () => {
      const idx = this.find_infr ()
      if (idx !== -1) {
        const f = infrs.indexOf(this.unit[idx])
        if (f < 2) {
          await player.step(`卡牌 ${this.pos} ${this.name} 即将切换挂件`)
          await player.bus.async_emit('transform-unit', {
            card: this,
            index: [ idx ],
            to: infrs[1 - f]
          })
          await player.step(`卡牌 ${this.pos} ${this.name} 即将触发快速生产`)
          await player.bus.async_emit('fast-prod', {
            card: this
          })
        }
      }
    })

    this.bus.on('upgrade-infr', async () => {
      const idx = this.find_infr ()
      if (idx !== -1) {
        const f = infrs.indexOf(this.unit[idx])
        if (f < 2) {
          await player.step(`卡牌 ${this.pos} ${this.name} 即将将挂件变为高科`)
          await player.bus.async_emit('transform-unit', {
            card: this,
            index: [ idx ],
            to: '高级科技实验室'
          })
          await player.step(`卡牌 ${this.pos} ${this.name} 即将触发快速生产`)
          await player.bus.async_emit('fast-prod', {
            card: this
          })
        }
      }
    })

    this.bus.on('transform-unit', async ({ index, to }) => {
      await player.step(`卡牌 ${this.pos} ${this.name} 即将 ${index.join(', ')} 处的单位变为 ${to}`)
      index.forEach(i => {
        this.unit[i] = to
      })
    })

    this.bus.on('wrap-in', ({ unit }) => 获得(this, unit))
  }
  
  async load_default_unit () {
    await this.player.step(`卡牌 ${this.pos} ${this.name} 即将添加默认单位`)
    for (const k in this.template.unit) {
      this.unit.push(...Array(this.template.unit[k]).fill(k))
    }
  }

  take_at (at) {
    const u = this.unit[at]
    this.unit[at] = this.unit[this.unit.length - 1]
    this.unit.pop()
    return u
  }

  take_unit (u) {
    return take_at(this.unit.indexOf(u))
  }

  find_infr () {
    return this.unit.findIndex((v) => {
      return infrs.includes(v)
    })
  }

  infr_type () {
    const idx = this.find_infr()
    if (idx === -1) {
      return -1
    } else {
      return infrs.indexOf(this.unit[idx])
    }
  }

  power () {
    return this.locate('水晶塔').length + this.locate('虚空水晶塔').length
  }

  locateX (pred, cnt = -1) {
    const res = []
    if (cnt === -1) {
      cnt = this.unit.length
    }
    for (let i = 0; i < this.unit.length; i++) {
      if (pred(this.unit[i])) {
        res.push(i)
        if (res.length >= cnt) {
          return res.slice(0, cnt)
        }
      }
    }
    return res
  }

  locate (u, cnt = -1) {
    return this.locateX(unit => unit === u, cnt)
  }

  calculateValue () {
    let sum = 0
    this.unit.forEach(u => {
      sum += getUnit(u).value
    })
    return sum
  }
}

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
    this.stepper = null
    this.cache = ''

    this.bus.on('*<', (ev, param) => {
      param = param || {}
      this.log(`玩家接收到 ${ev}  -  `, true)
      if ('card' in param) {
        if (param.card) {
          this.log(`转发至第${param.card.pos}张卡牌`)
        } else {
          this.log('舍弃')
        }
      } else {
        this.log(`通知所有卡牌`)
      }
    })
    this.bus.on('*', async (ev, param) => {
      param = param || {}
      if ('card' in param) {
        if (param.card) {
          await param.card.bus.async_emit(`${ev}-before`, param)
          await param.card.bus.async_emit(ev, param)
          await param.card.bus.async_emit(`${ev}-after`, param)
        }
      } else {
        await this.bus.async_emit(`${ev}-before-dispatch`, param)
        await this.enumPresent(async c => {
          await c.bus.async_emit(ev, param)
        })
        await this.bus.async_emit(`${ev}-after-dispatch`, param)
      }
    })
    this.bus.on('round-start', () => {
      this.flag = {}
    })
    this.bus.on('wrap-after-dispatch', async ({ unit, info }) => {
      if (info.to === null) {
        const choice = []
        this.enumPresent(card => {
          if (card.race === 'P') {
            choice.push(card.pos)
          }
        })
        if (choice.length === 0) {
          return
        }
        shuffle(choice)
        info.to = this.present[choice[0]]
      }
      await this.bus.async_emit('wrap-in', {
        unit,
        card: info.to
      })
    })
  }

  async step (msg) {
    if (this.stepper) {
      await this.refresh()
      await this.stepper(msg)
    }
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

  async enumPresent (func) {
    for (let i = 0; i < 7; i++) {
      if (this.present[i]) {
        if (await func(this.present[i])) {
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
    this.enumPresent(() => n++)
    return n
  }

  async requestEnter (pos, query) {
    if (this.presentCount() === 7) {
      return false
    }
    const cardt = this.hand[pos]
    if (cardt.attr?.insert) {
      await this.step(`即将请求定点部署位置`)
      return this.enter(pos, await query())
    } else {
      for (let i = 0; i < 7; i++) {
        if (!this.present[i]) {
          await this.step(`即将进场到 ${i} 处`)
          return this.enter(pos, i)
        }
      }
    }
  }

  async insert (pos) {
    if (!this.present[pos]) {
      return true
    }
    for (let i = pos + 1; i < 7; i++) {
      if (!this.present[i]) {
        await this.step(`即将将 ${pos} 到 ${i - 1} 的卡牌右移`)
        while (i > pos) {
          this.present[i] = this.present[i - 1]
          this.present[i].pos = i
          i--
        }
        this.present[pos] = null
        return true
      }
    }
    for (let i = pos - 1; i >= 0; i--) {
      if (!this.present[i]) {
        await this.step(`即将将 ${i + 1} 到 ${pos} 的卡牌左移`)
        while (i < pos) {
          this.present[i] = this.present[i + 1]
          this.present[i].pos = i
          i++
        }
        this.present[pos] = null
        return true
      }
    }
    return false
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

  async combine (pos) {
    const cardt = this.hand[pos]
    const poses = this.findSame(cardt)
    if (poses.length < 2) {
      return false
    }
    await this.step(`即将移除 ${pos} 处手牌`)
    this.hand[pos] = null

    const cl = this.present[poses[0]]
    const cr = this.present[poses[1]]

    const card = new Card(cardt, this)
    card.gold = true
    card.pos = poses[0]
    card.unit = [
      ...cl.unit,
      ...cr.unit.filter(u => !infrs.includes(u))
    ]

    await cl.desc()
    await cr.desc()

    await this.step(`即将三连卡牌`)
    this.present[card.pos] = card
    this.present[poses[1]] = null

    await this.step(`即将绑定卡牌描述效果`)
    card.desc = descs[cardt.name](this, card, true, async msg => {
      await this.step(`卡牌 ${pos} ${cardt.name} 即将更新卡面描述`)
      card.announce = msg
      await this.refresh()
    }).clear()

    await this.step(`即将广播卡牌三连消息`)
    await this.bus.async_emit('card-combined', {
      card
    })

    await this.step(`即将触发进场效果`)
    await this.bus.async_emit('post-enter', {
      card
    })

    await this.refresh()
    return true
  }

  async enter (pos, into) {
    if (!await this.insert(into)) {
      return false
    }
    const cardt = this.hand[pos]

    await this.step(`即将移除 ${pos} 处手牌`)
    this.hand[pos] = null

    const card = new Card(cardt, this)
    if (cardt.attr?.gold) {
      card.darkgold = true
    }
    card.pos = into

    await card.load_default_unit()

    await this.step(`即将进场卡牌`)
    this.present[into] = card

    await this.step(`即将绑定卡牌描述效果`)
    card.desc = descs[cardt.name](this, card, false, async msg => {
      await this.step(`卡牌 ${pos} ${cardt.name} 即将更新卡面描述`)
      card.announce = msg
      await this.refresh()
    }).clear()

    await this.step(`即将广播卡牌进场消息`)
    await this.bus.async_emit('card-enter', {
      card
    })

    await this.step(`即将触发进场效果`)
    await this.bus.async_emit('post-enter', {
      card
    })

    await this.refresh()
    return true
  }

  async sell (pos) {
    const card = this.present[pos]

    await this.step(`即将广播卡牌出售消息`)
    await this.bus.async_emit('card-sell', {
      selled: card
    })

    await this.step(`卡牌 ${pos} ${this.present[pos].name} 即将移除`)
    this.present[pos] = null
    this.mineral += 1

    await this.step(`即将广播卡牌出售完成消息`)
    await this.bus.async_emit('card-selled', {
      card
    })
    await card.desc()
    await this.refresh()
  }

  async sell_hand (pos) {
    await this.step(`手牌 ${pos} ${this.hand[pos].name} 即将出售`)
    this.hand[pos] = null
    this.mineral += 1
    await this.refresh()
  }

  async obtain_hand (cardt) {
    for (let i = 0; i < 6; i++) {
      if (!this.hand[i]) {
        await this.step(`卡牌 ${cardt.name} 即将置入手牌`)
        this.hand[i] = cardt
        await this.refresh()
        return true
      }
    }
    return false
  }

  async next_round () {
    await this.step(`即将广播回合结束信息`)
    await this.bus.async_emit('round-end')
    
    await this.step(`即将更新信息`)
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
    
    await this.step(`即将广播回合开始信息`)
    await this.bus.async_emit('round-start')
    await this.refresh()
  }

  async do_refresh () {
    await this.step(`即将刷新还不存在的商店`)
    await this.bus.async_emit('refresh')
    await this.refresh()
  }

  async do_upgrade () {
    if (this.mineral >= this.upgrade_cost) {
      await this.step(`即将升级酒馆`)
      this.mineral -= this.upgrade_cost
      this.level++
      this.upgrade_cost = upgrades[this.level]
      
      await this.step(`即将广播酒馆升级信息`)
      await this.bus.async_emit('upgrade-pub')
      await this.refresh()
    }
  }
}
