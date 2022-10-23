import { canElite, elited, getUpgrade, isBiological, UnitKey } from "../data"
import { Race } from "../data/types"
import { CardInstance } from "./card"
import { Description } from "./types"
import {
  $,
  Binder,
  shuffle,
  右侧,
  夺取,
  左侧,
  相邻两侧,
  获得,
  获得N,
  转换,
} from "./util"

function 黑暗容器S(
  card: CardInstance
): (param: { selled: CardInstance }) => Promise<void> {
  return async ({ selled }) => {
    if (selled.pos + 1 === card.pos || selled.pos - 1 === card.pos) {
      if (selled.level >= 1) {
        await card.player.bus.async_emit("gain-darkness", {
          card,
          darkness: selled.level >= 4 ? 2 : 1,
        })
      }
    }
  }
}

function 黑暗容器D(
  card: CardInstance
): (param: { destroyed: CardInstance }) => Promise<void> {
  return async ({ destroyed }) => {
    if (destroyed.pos + 1 === card.pos || destroyed.pos - 1 === card.pos) {
      if (destroyed.level >= 1) {
        await card.player.bus.async_emit("gain-darkness", {
          card,
          darkness: destroyed.level >= 4 ? 2 : 1,
        })
      }
    }
  }
}

function 黑暗容器(
  card: CardInstance,
  announce: (msg: string) => Promise<void>
) {
  return (binder: Binder) => {
    binder
      .for(card)
      .bind("post-enter", async () => {
        card.info.黑暗值 = 0
        await announce(`黑暗值: 0`)
      })
      .bind("sell-card", 黑暗容器S(card))
      .bind("destroy-card", 黑暗容器D(card))
      .bind("gain-darkness", async ({ darkness }) => {
        card.info.黑暗值 += darkness
        await card.player.bus.async_emit("flash-annouce", {
          card,
        })
      })
      .bind("flash-annouce", () => announce(`黑暗值: ${card.info.黑暗值}`))
  }
}

function 供养(card: CardInstance, unit: UnitKey, essence: number) {
  return (binder: Binder) => {
    binder.for(card).bind("card-selled", async () => {
      await 右侧(card, async c => {
        const n = card.locate("精华").length
        await 获得N(c, unit, Math.floor(n / essence))
        if (c.template.attr?.origin) {
          await 获得N(c, "精华", n)
        }
      })
    })
  }
}

const Data: Description = {
  原始蟑螂: (p, c, g) => $().apply(供养(c, "原始蟑螂", 1)),
  不死队: (p, c, g, a) =>
    $()
      .apply(黑暗容器(c, a))
      .bind("gain-darkness", () => 获得N(c, "不死队", g ? 2 : 1)),
  紧急部署: () => $(),
  原始刺蛇: (p, c, g) =>
    $()
      .apply(供养(c, "原始刺蛇", 1))
      .for(c)
      .bind("round-end", () =>
        获得(c, [
          ...Array(g ? 2 : 1).fill("原始刺蛇"),
          ...Array(g ? 4 : 2).fill("精华"),
        ])
      ),
  原始异龙: (p, c, g) =>
    $()
      .for(p)
      .bind("card-enter", async () => {
        await 右侧(c, cc => 获得N(cc, "精华", g ? 2 : 1))
      })
      .bind("round-end", async () => {
        let n = 0
        p.asyncEnumPresent(async card => {
          const cnt = card.count("精华")
          n += cnt
          card.take_units("精华", cnt)
        })
        await 获得N(c, "原始异龙", Math.floor(n / 2))
      }),
  虚空大军: (p, c, g) =>
    $()
      .for(c)
      .bind("round-end", async () => {
        const rs: {
          [r in Race]?: true
        } = {}
        await p.asyncEnumPresent(async card => (rs[card.race] = true))
        let units: UnitKey[] = []
        if (rs.T) {
          units.push(...Array(g ? 2 : 1).fill("歌利亚"))
        }
        if (rs.Z) {
          units.push(...Array(g ? 2 : 1).fill("刺蛇"))
        }
        if (rs.P) {
          units.push(...Array(g ? 2 : 1).fill("龙骑士"))
        }
        await 获得(c, units)
      }),
  鲜血猎手: (p, c, g, a) =>
    $()
      .apply(黑暗容器(c, a))
      .bind("gain-darkness", () => 获得N(c, "鲜血猎手", g ? 2 : 1)),
  暴掠龙: (p, c, g) =>
    $()
      .for(c)
      .apply(供养(c, "暴掠龙", 2))
      .bind("round-end", () =>
        获得(c, [
          ...Array(g ? 2 : 1).fill("暴掠龙"),
          ...Array(g ? 4 : 2).fill("精华"),
        ])
      ),
  适者生存: (p, c, g) =>
    $()
      .for(c)
      .bind("round-end", async () => {
        const choice: {
          card: CardInstance
          index: number
        }[] = []
        await p.asyncEnumPresent(async card => {
          card
            .locateX(unit => canElite(unit) && isBiological(unit))
            .forEach(index => {
              choice.push({
                card,
                index,
              })
            })
        })
        for (const { card, index } of shuffle(choice).slice(0, g ? 8 : 5)) {
          await 转换(card, [index], elited(card.unit[index]))
        }
      }),
  毁灭者: (p, c, g, a) =>
    $()
      .apply(黑暗容器(c, a))
      .bind("card-selled", async () => {
        await 左侧(c, async card =>
          获得N(
            card,
            "毁灭者",
            Math.max(Math.min(c.info.黑暗值 - 1, g ? 30 : 10), 0)
          )
        )
      }),
  原始点火虫: (p, c, g) =>
    $()
      .for(c)
      .bind("round-end", () =>
        获得N(
          c,
          "原始点火虫",
          Math.max(0, 2 * c.count("精华", 10) - c.count("原始点火虫"))
        )
      ),
  原始雷兽: (p, c, g) =>
    $()
      .apply(供养(c, "原始雷兽", 4))
      .for(c)
      .bind("round-end", async () => {
        await 获得N(c, "原始雷兽", g ? 2 : 1)
        let n = 0
        await p.asyncEnumPresent(async card => {
          if (card.race === "N" && card !== c) {
            n++
          }
        })
        await 获得N(c, "精华", n)
      }),
  马拉什: (p, c, g) =>
    $()
      .for(c)
      .bind("round-end", () =>
        相邻两侧(c, async card => {
          card.void = true
        })
      ),
  黑暗预兆: (p, c, g) =>
    $()
      .for(c)
      .bind("round-end", async () => {
        const rs: {
          [r in Race]?: true
        } = {}
        await p.asyncEnumPresent(async card => (rs[card.race] = true))
        if (rs.T && rs.P && rs.Z && rs.N) {
          await 获得N(c, "混合体毁灭者", g ? 4 : 2)
        }
      }),
  阿拉纳克: (p, c, g) =>
    $()
      .for(c)
      .bind("post-enter", async () => {
        const cs: CardInstance[] = []
        await p.asyncEnumPresent(async card => {
          if (card !== c) {
            cs.push(card)
          }
        })
        shuffle(cs)
        for (const card of cs.slice(0, 2)) {
          card.upgrade.forEach(u => {
            if (c.upgrade.indexOf(u) === -1 || !getUpgrade(u).novr) {
              c.upgrade.push(u)
            }
          })
          c.upgrade = c.upgrade.slice(0, 5)
          await 夺取(c, card)
        }
        // TODO: 考虑如何处理献祭
      }),
  天罚行者: (p, c, g, a) =>
    $()
      .apply(黑暗容器(c, a))
      .bind("post-enter", async () => {
        let n = 0
        await p.asyncEnumPresent(async card => {
          if (card.info.黑暗值 && card.level <= 4) {
            n += card.info.黑暗值
            card.info.黑暗值 = 0
            await p.bus.async_emit("flash-annouce", {
              card,
            })
          }
        })
        await p.bus.async_emit("gain-darkness", {
          card: c,
          darkness: n,
        })
        await 获得N(c, "天罚行者", Math.floor(n / 5))
      })
      .bind("round-end", () =>
        获得N(
          c,
          "天罚行者",
          (g ? 2 : 1) * Math.min(2, Math.floor(c.info.黑暗值 / 10))
        )
      ),
  德哈卡: (p, c, g) =>
    $()
      .for(p)
      .bindAfter("round-start", async () => {
        if (p.glob.德哈卡) {
          p.glob.德哈卡 = 0
          await p.bus.async_emit("discover-card", {
            filter: c => {
              return c.level < 5 && !!c.attr?.origin
            },
          })
        }
      })
      .for(c)
      .bind("sell-card", async ({ selled }) => {
        if (selled.count("精华") >= 3) {
          await 获得N(c, "德哈卡分身", g ? 4 : 2)
        }
      })
      .bind("round-end", async () => {
        if (p.mineral >= 1) {
          p.glob.德哈卡 = 1
        }
      }),
  我叫小明: (p, c, g) =>
    $()
      .for(c)
      .bind("post-enter", () =>
        左侧(c, async card => {
          await p.obtain_hand(card.template)
        })
      )
      .bind("card-selled", () =>
        左侧(c, async card => {
          await p.bus.async_emit("gain-upgrade", {
            card,
            upgrade: "星空加速",
          })
        })
      ),
  豆浆油条KT1: (p, c) =>
    $()
      .for(c)
      .bind("post-enter", async () => {
        await p.bus.async_emit("gain-upgrade", {
          card: c,
          upgrade: null,
        })
        await 相邻两侧(c, async card => {
          await p.bus.async_emit("gain-upgrade", {
            card,
            upgrade: null,
          })
        })
      }),
  豆浆油条: (p, c) =>
    $()
      .for(c)
      .bind("round-end", () =>
        p.asyncEnumPresent(async card => {
          if (card.pos > c.pos) {
            card.void = true
          }
        })
      ),
}

export default Data
