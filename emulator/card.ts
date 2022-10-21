import { Player, infrs } from "."
import { AsyncEmitter } from "../async-emitter"
import { CardKey, getUnit, UnitKey } from "../data"
import { Card, Race } from "../data/types"
import { BusInfo } from "./types"
import { 获得, 相邻两侧, 获得N } from "./util"

export class CardInstance {
  bus: AsyncEmitter<BusInfo>
  template: Card
  name: CardKey
  race: Race
  level: number
  unit: UnitKey[]
  upgrade: string[]
  player: Player
  pos: number
  info: Record<string, any>
  announce: string

  desc: () => void

  darkgold?: boolean
  gold?: boolean
  void?: boolean

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
          this.take_units("虚空水晶塔", n)
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

  take_at(at: number) {
    const u = this.unit[at]
    this.unit[at] = this.unit[this.unit.length - 1]
    this.unit.pop()
    return u
  }

  take_unit(u: UnitKey) {
    return this.take_at(this.unit.indexOf(u))
  }

  take_units(u: UnitKey, n: number) {
    while (n--) {
      this.take_at(this.unit.indexOf(u))
    }
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

  locateX(pred: (unit: UnitKey) => boolean, cnt = -1) {
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

  locate(u: UnitKey, cnt = -1) {
    return this.locateX(unit => unit === u, cnt)
  }

  count(u: UnitKey, maxi = -1) {
    return this.locate(u, maxi).length
  }

  calculateValue() {
    let sum = 0
    this.unit.forEach(u => (sum += getUnit(u).value))
    return sum
  }
}