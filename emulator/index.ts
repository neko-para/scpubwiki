import { Card, Race, Unit, Upgrade } from "../data/pubdata.d"

import { AsyncEmitter } from "../async-emitter.js"
import descs from "./data.js"
import { getUnit } from "../data"
import { Pool } from "./pool.js"
import { shuffle, 相邻两侧, 获得, 获得N } from "./util.js"

export { Pool }

export const infrs = ["反应堆", "科技实验室", "高级科技实验室"]

const upgrades = [0, 5, 7, 8, 9, 11, 0]

export type BusInfo = {
  "obtain-unit": {
    card: CardInstance
    unit: string[]
  }
  "transform-unit": {
    card: CardInstance
    index: number[]
    to: string
  }
  "fast-prod": {
    card: CardInstance
  }
  "switch-infr": {
    card: CardInstance
  }
  "upgrade-infr": {
    card: CardInstance
  }
  "task-done": {
    card: CardInstance
  }
  "wrap-in": {
    card: CardInstance
    unit: string[]
  }
  incubate: {
    card: CardInstance
    unit: string[]
  }
  "incubate-into": {
    card: CardInstance
    unit: string[]
  }
  "card-enter": {
    card: CardInstance
  }
  "post-enter": {
    card: CardInstance
  }
  "card-selled": {
    card: CardInstance
  }
  "card-combined": {
    card: CardInstance
  }

  "upgrade-pub": {}
  refresh: {}
  "round-start": {}
  "round-end": {}
  "sell-card": {
    selled: CardInstance
  }
  "destroy-card": {
    destroyed: CardInstance
  }
  "discover-card": {
    filter: (card: Card) => boolean
  }
}

export class CardInstance {
  bus: AsyncEmitter<BusInfo>
  template: Card
  name: string
  race: Race
  level: number
  unit: string[]
  upgrade: Upgrade[]
  player: Player
  pos: number
  info: Record<string, any>
  announce: string

  desc: () => Promise<void>

  darkgold?: boolean
  gold?: boolean

  constructor(cardt: Card, player: Player) {
    this.bus = new AsyncEmitter()
    this.template = cardt
    this.name = cardt.name
    this.race = cardt.race
    this.level = cardt.level
    this.unit = []
    this.upgrade = []
    this.player = player
    this.pos = -1
    this.info = {}
    this.announce = ""
    this.desc = async () => {}

    this.bus.on("obtain-unit", async ({ unit }) => {
      await player.step(
        `卡牌 ${this.pos} ${this.name} 即将获得 ${unit.join(", ")}`
      )
      this.unit.push(...unit)
    })

    this.bus.on("round-end", async () => {
      if (this.infr_type() === 2) {
        await player.step(`卡牌 ${this.pos} ${this.name} 即将触发快速生产`)
        await player.bus.async_emit("fast-prod", {
          card: this,
        })
      }
    })

    this.bus.on("switch-infr", async () => {
      const idx = this.find_infr()
      if (idx !== -1) {
        const f = infrs.indexOf(this.unit[idx])
        if (f < 2) {
          await player.step(`卡牌 ${this.pos} ${this.name} 即将切换挂件`)
          await player.bus.async_emit("transform-unit", {
            card: this,
            index: [idx],
            to: infrs[1 - f],
          })
          await player.step(`卡牌 ${this.pos} ${this.name} 即将触发快速生产`)
          await player.bus.async_emit("fast-prod", {
            card: this,
          })
        }
      }
    })

    this.bus.on("upgrade-infr", async () => {
      const idx = this.find_infr()
      if (idx !== -1) {
        const f = infrs.indexOf(this.unit[idx])
        if (f < 2) {
          await player.step(`卡牌 ${this.pos} ${this.name} 即将将挂件变为高科`)
          await player.bus.async_emit("transform-unit", {
            card: this,
            index: [idx],
            to: "高级科技实验室",
          })
          await player.step(`卡牌 ${this.pos} ${this.name} 即将触发快速生产`)
          await player.bus.async_emit("fast-prod", {
            card: this,
          })
        }
      }
    })

    this.bus.on("transform-unit", async ({ index, to }) => {
      await player.step(
        `卡牌 ${this.pos} ${this.name} 即将 ${index.join(
          ", "
        )} 处的单位变为 ${to}`
      )
      index.forEach(i => {
        this.unit[i] = to
      })
    })

    this.bus.on("wrap-in", ({ unit }) => 获得(this, unit))

    this.bus.on("incubate", ({ unit }) =>
      相邻两侧(this, async c => {
        if (c.race === "Z") {
          await this.player.bus.async_emit("incubate-into", {
            card: c,
            unit,
          })
        }
      })
    )

    this.bus.on("incubate-into", ({ unit }) => 获得(this, unit))

    this.bus.on("card-selled", async () => {
      const n = this.locate("虚空水晶塔").length
      await 相邻两侧(this, async card => {
        if (card.race === "P" && n > 0) {
          await this.player.step(
            `即将转移 ${n} 虚空水晶塔到卡牌 ${card.pos} ${card.name}`
          )
          for (let i = 0; i < n; i++) {
            this.take_unit("虚空水晶塔")
          }
          await 获得N(card, "虚空水晶塔", n)
        }
      })
    })
  }

  async load_default_unit() {
    await this.player.step(`卡牌 ${this.pos} ${this.name} 即将添加默认单位`)
    for (const k in this.template.unit) {
      this.unit.push(...Array(this.template.unit[k]).fill(k))
    }
  }

  take_at(at) {
    const u = this.unit[at]
    this.unit[at] = this.unit[this.unit.length - 1]
    this.unit.pop()
    return u
  }

  take_unit(u) {
    return this.take_at(this.unit.indexOf(u))
  }

  find_infr() {
    return this.unit.findIndex(v => {
      return infrs.includes(v)
    })
  }

  infr_type() {
    const idx = this.find_infr()
    if (idx === -1) {
      return -1
    } else {
      return infrs.indexOf(this.unit[idx])
    }
  }

  self_power() {
    return this.locate("水晶塔").length + this.locate("虚空水晶塔").length
  }

  power() {
    let n = this.self_power()

    if (this.pos > 0) {
      const c = this.player.present[this.pos - 1]
      n += c ? c.self_power() : 0
    }
    if (this.pos < 6 && this.player.present[this.pos + 1]) {
      const c = this.player.present[this.pos + 1]
      n += c ? c.self_power() : 0
    }
    return n
  }

  locateX(pred: (unit: string) => boolean, cnt = -1) {
    const res: number[] = []
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

  locate(u, cnt = -1) {
    return this.locateX(unit => unit === u, cnt)
  }

  calculateValue() {
    let sum = 0
    this.unit.forEach(u => {
      const uu = getUnit(u)
      sum += uu ? uu.value : 0
    })
    return sum
  }
}

export class Player {
  bus: AsyncEmitter<BusInfo>
  level: number
  upgrade_cost: number
  round: number
  mineral: number
  max_mineral: number
  gas: number
  hand: (Card | null)[]
  present: (CardInstance | null)[]
  flag: Record<string, any>
  glob: Record<string, any>

  refresh: { (): Promise<void> } | { (): void }
  stepper: { (msg: string): Promise<void> } | null
  cache: string

  constructor() {
    this.bus = new AsyncEmitter()

    this.level = 1
    this.upgrade_cost = upgrades[1]
    this.round = 1
    this.mineral = 3
    this.max_mineral = 3
    this.gas = 0

    this.hand = Array(6).fill(null)
    this.present = Array(7).fill(null)

    this.flag = {} // 用于检测唯一
    this.glob = {} // 用于跨回合状态, 如毛子

    this.refresh = () => {}
    this.stepper = null
    this.cache = ""

    this.bus.wildcast("*<", async (ev, param) => {
      param = param || {}
      if ("card" in param) {
        // @ts-ignore
        if (param.card) {
          // @ts-ignore
          await this.bus.async_emit(`${ev}-before$`, param)
        }
      } else {
        // @ts-ignore
        await this.bus.async_emit(`${ev}-before-dispatch$`, param)
      }
    })
    this.bus.wildcast("*", async (ev, param) => {
      param = param || {}
      if ("card" in param) {
        // @ts-ignore
        if (param.card) {
          // @ts-ignore
          await param.card.bus.async_emit(ev, param)
          // @ts-ignore
          await this.bus.async_emit(`${ev}-after$`, param)
        }
      } else {
        await this.asyncEnumPresent(async c => {
          // @ts-ignore
          await c.bus.async_emit(ev, param)
        })
        // @ts-ignore
        await this.bus.async_emit(`${ev}-after-dispatch$`, param)
      }
    })
    this.bus.on("round-start", async () => {
      this.flag = {}
    })
    // @ts-ignore
    this.bus.on("wrap-after-dispatch$", async ({ unit, info }) => {
      if (info.to === null) {
        const choice: number[] = []
        this.enumPresent((card: CardInstance) => {
          if (card.race === "P") {
            choice.push(card.pos)
          }
        })
        if (choice.length === 0) {
          return
        }
        shuffle(choice)
        info.to = this.present[choice[0]]
      }
      await this.bus.async_emit("wrap-in", {
        unit,
        card: info.to,
      })
    })
    this.bus.on("destroy-card", async ({ destroyed: card }) => {
      await this.step(`卡牌 ${card.pos} ${card.name} 即将移除`)
      this.present[card.pos] = null

      if (card.desc) {
        await card.desc()
      }
      await this.refresh()
    })
  }

  async step(msg: string) {
    if (this.stepper) {
      await this.refresh()
      await this.stepper(msg)
    }
  }

  enumPresent(func: (card: CardInstance) => boolean | void) {
    for (let i = 0; i < 7; i++) {
      const p = this.present[i]
      if (p && func(p)) {
        return
      }
    }
  }

  async asyncEnumPresent(
    func: (card: CardInstance) => Promise<boolean | void>
  ) {
    for (let i = 0; i < 7; i++) {
      const p = this.present[i]
      if (p && (await func(p))) {
        return
      }
    }
  }

  calculateValue() {
    let sum = 0
    this.enumPresent(card => {
      sum += card.calculateValue()
    })
    return sum
  }

  presentCount() {
    let n = 0
    this.enumPresent(() => {
      n++
    })
    return n
  }

  async requestEnter(pos, query) {
    if (this.presentCount() === 7) {
      return false
    }
    const cardt = this.hand[pos] as Card
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

  async insert(pos: number) {
    if (!this.present[pos]) {
      return true
    }
    for (let i = pos + 1; i < 7; i++) {
      if (!this.present[i]) {
        await this.step(`即将将 ${pos} 到 ${i - 1} 的卡牌右移`)
        while (i > pos) {
          this.present[i] = this.present[i - 1]
          // @ts-ignore
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
          // @ts-ignore
          this.present[i].pos = i
          i++
        }
        this.present[pos] = null
        return true
      }
    }
    return false
  }

  findSame(cardt: Card) {
    const target: number[] = []
    this.enumPresent(card => {
      if (card.name === cardt.name && !card.gold) {
        target.push(card.pos)
      }
    })
    return target
  }

  canCombine(pos: number) {
    const cardt = this.hand[pos]
    return cardt && !cardt.attr?.gold && this.findSame(cardt).length >= 2
  }

  async combine(pos: number) {
    const cardt = this.hand[pos] as Card
    const poses = this.findSame(cardt)
    if (poses.length < 2) {
      return false
    }
    await this.step(`即将移除 ${pos} 处手牌`)
    this.hand[pos] = null

    const cl = this.present[poses[0]] as CardInstance
    const cr = this.present[poses[1]] as CardInstance

    const card = new CardInstance(cardt, this)
    card.gold = true
    card.pos = poses[0]
    card.unit = [...cl.unit, ...cr.unit.filter(u => !infrs.includes(u))]

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
    await this.bus.async_emit("card-combined", {
      card,
    })

    await this.step(`即将触发进场效果`)
    await this.bus.async_emit("post-enter", {
      card,
    })

    await this.refresh()
    return true
  }

  async enter(pos: number, into: number) {
    if (!(await this.insert(into))) {
      return false
    }
    const cardt = this.hand[pos]

    if (!cardt) {
      return false
    }

    await this.step(`即将移除 ${pos} 处手牌`)
    this.hand[pos] = null

    const card = new CardInstance(cardt, this)
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
    await this.bus.async_emit("card-enter", {
      card,
    })

    await this.step(`即将触发进场效果`)
    await this.bus.async_emit("post-enter", {
      card,
    })

    await this.refresh()
    return true
  }

  async sell(pos: number) {
    const card = this.present[pos] as CardInstance

    await this.step(`即将广播卡牌出售消息`)
    await this.bus.async_emit("sell-card", {
      selled: card,
    })

    await this.step(`卡牌 ${pos} ${card.name} 即将移除`)
    this.present[pos] = null
    this.mineral += 1

    await this.step(`即将广播卡牌出售完成消息`)
    await this.bus.async_emit("card-selled", {
      card,
    })
    await card.desc()
    await this.refresh()
  }

  async destroy(pos: number) {
    const card = this.present[pos] as CardInstance

    await this.step(`即将广播卡牌摧毁消息`)
    await this.bus.async_emit("destroy-card", {
      destroyed: card,
    })
  }

  async sell_hand(pos: number) {
    await this.step(`手牌 ${pos} ${this.hand[pos]?.name} 即将出售`)
    this.hand[pos] = null
    this.mineral += 1
    await this.refresh()
  }

  async obtain_hand(cardt: Card) {
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

  async next_round() {
    await this.step(`即将广播回合结束信息`)
    await this.bus.async_emit("round-end", {})

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
    await this.bus.async_emit("round-start", {})
    await this.refresh()
  }

  async do_refresh() {
    await this.step(`即将刷新还不存在的商店`)
    await this.bus.async_emit("refresh", {})
    await this.refresh()
  }

  async do_upgrade() {
    if (this.mineral >= this.upgrade_cost) {
      await this.step(`即将升级酒馆`)
      this.mineral -= this.upgrade_cost
      this.level++
      this.upgrade_cost = upgrades[this.level]

      await this.step(`即将广播酒馆升级信息`)
      await this.bus.async_emit("upgrade-pub", {})
      await this.refresh()
    }
  }
}
