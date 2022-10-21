import { CardInstance, Player } from "."
import { getUnit, data, getCard } from "../data"
import { shuffle, $, 获得, 获得N, 摧毁, 相邻两侧, 转换 } from "./util"
import { 科挂 } from "./terran"
import { Description } from "./types"
import { Card } from "../data/pubdata"
import { Unit } from "../data/pubdata"

function 虫卵牌描述(p: Player, c: CardInstance, g: boolean) {
  return $()
    .for(c)
    .bind("inject", async ({ unit }) => {
      await p.step(`即将注卵 ${unit.join(", ")}`)
      await 获得(c, unit)
    })
    .bind("round-start", async () => {
      let k = 0
      await 相邻两侧(c, async card => {
        if (card.race === "Z") {
          k++
        }
      })
      if (k === 2) {
        await 孵化(
          c,
          c.unit.filter(u => {
            const uu = getUnit(u)
            return uu?.tag && uu.tag.includes("生物单位")
          })
        )
        await 摧毁(c)
        c.player.mineral += 1
      }
    })
}

function 虫卵牌位(player: Player) {
  let idx = -1
  player.enumPresent(c => {
    if (c.name === "虫卵") {
      idx = c.pos
      return true
    }
  })
  return idx
}

async function 注卵(card: CardInstance, unit: string[]) {
  if (unit.length === 0) {
    return
  }
  let idx = 虫卵牌位(card.player)
  if (idx === -1) {
    for (let i = 0; i < 7; i++) {
      if (!card.player.present[i]) {
        idx = i
        break
      }
    }
    if (idx === -1) {
      return
    }
    await card.player.step(`即将在 ${idx} 创建虫卵`)
    const cc = new CardInstance(getCard("虫卵") as Card, card.player)
    cc.gold = true
    cc.pos = idx
    cc.desc = 虫卵牌描述(card.player, cc, false).clear()
    card.player.present[idx] = cc
  }
  await card.player.bus.async_emit("inject", {
    card: card.player.present[idx] as CardInstance,
    unit,
  })
}

async function 孵化(card: CardInstance, unit: string[]) {
  if (unit.length === 0) {
    return
  }
  await card.player.bus.async_emit("incubate", {
    card,
    unit,
  })
}

const Data: Description = {
  虫卵: 虫卵牌描述,
  虫群先锋: (p, c, g) =>
    $()
      .for(c)
      .bind("round-end", () => 获得N(c, "跳虫", g ? 4 : 2)),
  蟑螂小队: (p, c, g) =>
    $()
      .for(c)
      .bind("round-start", () => 转换(c, c.locate("蟑螂", g ? 2 : 1), "破坏者"))
      .bind("card-selled", () => 注卵(c, Array(g ? 4 : 2).fill("蟑螂"))),
  屠猎者: (p, c, g) =>
    $()
      .for(c)
      .bind("round-end", () => 转换(c, c.locate("刺蛇"), "刺蛇(精英)"))
      .bind("upgrade-pub", () => 获得(c, Array(g ? 2 : 1).fill("刺蛇(精英)"))),
  埋地刺蛇: (p, c, g) =>
    $()
      .for(c)
      .bind("card-selled", () => 注卵(c, Array(g ? 6 : 3).fill("刺蛇"))),
  变异军团: (p, c, g) =>
    $()
      .for(p)
      .bind("inject", () => 获得N(c, "被感染的陆战队员", g ? 2 : 1)),
  孵化蟑螂: (p, c, g) =>
    $()
      .for(c)
      .bind("round-end", () => 孵化(c, Array(g ? 4 : 2).fill("蟑螂"))),
  爆虫滚滚: (p, c, g) =>
    $()
      .for(c)
      .bind("round-end", async () => {
        let count = c.locateX(u => ["爆虫", "爆虫(精英)"].includes(u)).length
        await 孵化(c, Array(Math.floor(count / (g ? 15 : 20))).fill("爆虫"))
      })
      .for(p)
      .bind("sell-card", async ({ selled: card }) => {
        if (card === c || p.flag.爆虫滚滚) {
          return
        }
        const unit: string[] = []
        card.unit = card.unit.filter(u => {
          if (u === "跳虫") {
            unit.push("爆虫")
            return false
          } else if (u === "跳虫(精英)") {
            unit.push("爆虫(精英)")
            return false
          } else {
            return true
          }
        })
        p.flag.爆虫滚滚 = 1
        await 获得(c, unit)
      })
      // @ts-ignore
      .bind("card-sell-after-dispatch$", () => {
        p.flag.爆虫滚滚 = 0
      }),
  飞龙骑脸: (p, c, g) =>
    $()
      .for(c)
      .bind("card-selled", () => 孵化(c, Array(g ? 4 : 2).fill("异龙"))),
  凶残巨兽: (p, c, g) =>
    $()
      .for(c)
      .bind("card-selled", () => 注卵(c, Array(g ? 2 : 1).fill("雷兽"))),
  注卵虫后: (p, c, g) =>
    $()
      .for(c)
      .bind("round-start", () =>
        注卵(c, [
          ...Array(g ? 2 : 1).fill("蟑螂"),
          ...Array(g ? 2 : 1).fill("刺蛇"),
        ])
      ),
  孵化所: (p, c, g) =>
    $()
      .for(p)
      .bind("incubate", async () => {
        p.flag.孵化所 = null
      })
      // @ts-ignore
      .bind("incubate-into-before$", async () => {
        if (p.flag.孵化所) {
          if (c.pos < p.flag.孵化所.pos) {
            p.flag.孵化所 = c
          }
        } else {
          p.flag.孵化所 = c
        }
      })
      // @ts-ignore
      .bind("incubate-into-after$", async ({ unit, card }) => {
        if (card !== c || p.flag.孵化所 !== c) {
          return
        }
        if (unit.length > 0) {
          await 获得N(c, unit[unit.length - 1], g ? 3 : 2)
        }
      }),
  地底伏击: (p, c, g) =>
    $()
      .for(c)
      .bind("post-enter", () => 孵化(c, Array(g ? 2 : 1).fill("潜伏者"))),
  孵化刺蛇: (p, c, g) =>
    $()
      .for(c)
      .bind("round-end", () => 孵化(c, Array(g ? 2 : 1).fill("刺蛇(精英)"))),
  感染深渊: (p, c, g) =>
    $()
      .for(c)
      .bind("round-end", async () => {
        let n = 0
        await p.asyncEnumPresent(async card => {
          let nn = card.locate("陆战队员", g ? 4 : 2).length
          n += nn
          while (nn--) {
            card.take_unit("陆战队员")
          }
        })
        await 注卵(c, Array(n).fill("被感染的陆战队员"))
      })
      .bind("round-start", () =>
        p.asyncEnumPresent(async card =>
          转换(card, card.locate("被感染的陆战队员", g ? 2 : 1), "畸变体")
        )
      ),
  腐化大龙: (p, c, g) =>
    $()
      .for(c)
      .bind("round-end", () =>
        转换(c, c.locate("腐化者", g ? 4 : 2), "巢虫领主")
      )
      .bind("card-selled", () => 注卵(c, Array(g ? 4 : 2).fill("巢虫领主"))),
  空中管制: (p, c, g) =>
    $()
      .for(c)
      .bind("post-enter", () => 孵化(c, Array(g ? 6 : 3).fill("爆蚊")))
      .bind("round-end", () => 孵化(c, Array(g ? 2 : 1).fill("异龙(精英)"))),
  虫群大军: (p, c, g) =>
    $()
      .for(c)
      .bind("round-end", async () => {
        let n = 0
        await p.asyncEnumPresent(async card => {
          if (card.race === "Z") {
            n++
          }
        })
        if (n >= 4) {
          await 注卵(c, Array(g ? 2 : 1).fill("雷兽"))
        }
      }),
  终极进化: (p, c, g) =>
    $()
      .for(c)
      .bind("post-enter", () =>
        相邻两侧(c, async card =>
          转换(
            card,
            card.locateX(u => ["蟑螂", "蟑螂(精英)"].includes(u), g ? 2 : 1),
            "莽兽"
          )
        )
      ),
  凶猛巨兽: (p, c, g) =>
    $()
      .for(c)
      .bind("post-enter", () =>
        p.asyncEnumPresent(async card => {
          if (card.race === "Z") {
            await 获得N(card, "腐化者", g ? 4 : 2)
          }
        })
      )
      .bind("round-end", () =>
        相邻两侧(c, async card => {
          if (card.race === "Z") {
            await 获得N(card, "守卫", g ? 4 : 2)
          }
        })
      ),
  扎加拉: (p, c, g) =>
    $()
      .for(p)
      .bind("incubate", async ({ unit }) => {
        if (!p.flag.扎加拉) {
          await p.step(`扎加拉即将额外孵化 ${unit.join(", ")}`)
          p.flag.扎加拉 = 1
          await p.bus.async_emit("incubate-into", {
            card: c,
            unit,
          })
          if (g) {
            await 获得(c, ["巢虫领主"])
          }
        }
      })
      // @ts-ignore
      .bind("incubate-after$", () => (p.flag.扎加拉 = 0)),
  斯托科夫: (p, c, g) =>
    $()
      .for(c)
      .bind("post-enter", async () => {
        if (!("斯托科夫" in p.glob)) {
          p.glob.斯托科夫 = 0
        }
      })
      .for(p)
      // @ts-ignore
      .bind("card-enter-before$", ({ card }) => {
        if (card.level === 6 || card.race === "Z") {
          return
        }
        p.flag.斯托科夫E = 0
        p.flag.斯托科夫 = 0
        p.glob.斯托科夫 = 1 - p.glob.斯托科夫
      })
      .bind("card-enter", async ({ card }) => {
        if (card.level === 6 || card.race === "Z") {
          return
        }
        if (g) {
          if (p.flag.斯托科夫) {
            return
          }
          p.flag.斯托科夫 = 1
          p.flag.斯托科夫C = c
        } else {
          if (p.glob.斯托科夫 === 0) {
            if (p.flag.斯托科夫) {
              return
            }
            p.flag.斯托科夫 = 1
            p.flag.斯托科夫C = c
          }
        }
      })
      // @ts-ignore
      .bind("card-enter-after$", async ({ card }) => {
        if (card.level === 6 || card.race === "Z") {
          return
        }
        if (p.flag.斯托科夫E) {
          return
        }
        p.flag.斯托科夫E = 1
        if (p.flag.斯托科夫) {
          await 注卵(
            p.flag.斯托科夫C,
            card.unit.filter(u => {
              const uu = getUnit(u)
              if (!uu || uu.utyp !== "normal") {
                return false
              }
              return !uu.tag?.includes("英雄单位")
            })
          )
        }
      }),
  守卫巢穴: (p, c, g) =>
    $()
      .for(c)
      .bind("round-end", async () => {
        await 注卵(c, Array(g ? 2 : 1).fill("守卫"))
        await p.asyncEnumPresent(async card =>
          转换(
            card,
            card.locateX(u => ["异龙", "异龙(精英)"].includes(u), g ? 2 : 1),
            "守卫"
          )
        )
      }),
  生化危机: (p, c, g) =>
    $()
      .for(c)
      .bind(
        "round-end",
        科挂(c, 2, () =>
          注卵(c, [
            ...Array(g ? 2 : 1).fill("牛头人陆战队员"),
            ...Array(g ? 4 : 2).fill("科技实验室"),
          ])
        )
      ),
  雷兽窟: (p, c, g) =>
    $()
      .for(c)
      .bind("round-start", () => 转换(c, c.locate("幼雷兽", g ? 2 : 1), "雷兽"))
      .bind("round-end", () => 孵化(c, Array(g ? 2 : 1).fill("幼雷兽"))),
  优质基因: (p, c, g) =>
    $()
      .for(c)
      .bind("round-end", async () => {
        const idx = 虫卵牌位(p)
        if (idx === -1) {
          return
        }
        const egg = p.present[idx] as CardInstance
        let v = 0
        let u: string | null = null
        egg.unit.forEach(unit => {
          const uu = getUnit(unit) as Unit
          if (uu.utyp !== "normal") {
            return
          }
          if (!g && uu.tag?.includes("英雄单位")) {
            return
          }
          if (uu.value > v) {
            v = uu.value
            u = unit
          }
        })
        if (!u) {
          return
        }
        await p.asyncEnumPresent(async card => {
          if (card.race === "Z") {
            await 获得(card, [u as string])
          }
        })
        await 摧毁(egg)
      }),
  基因突变: (p, c, g) => {
    const f = () =>
      相邻两侧(c, async card => {
        if (card.race === "Z") {
          const us = card.unit
            .map((u, i) => {
              const uu = getUnit(u) as Unit
              return {
                idx: i,
                unit: u,
                value: uu.value,
                hero: uu.tag.includes("英雄单位"),
              }
            })
            .sort((a, b) => {
              if (a.value === b.value) {
                return a.idx - b.idx
              } else {
                return a.value - b.value
              }
            })
          let v = 0
          let u: string | null = null
          us.forEach(ui => {
            if (ui.hero) {
              return
            }
            if (ui.value > v) {
              v = ui.value
              u = ui.unit
            }
          })
          if (!u) {
            return
          }
          await 转换(
            card,
            us.slice(0, g ? 2 : 1).map(ui => ui.idx),
            u
          )
        }
      })
    return $().for(c).bind("post-enter", f).bind("card-selled", f)
  },
  机械感染: (p, c, g) =>
    $()
      .for(c)
      .bind("round-start", async () => {
        if (c.locateX(u => ["雷兽", "雷兽(基因)"].includes(u)).length >= 4) {
          c.desc()
          c.desc = $().clear()
        }
      })
      .bind("round-end", () => 孵化(c, ["被感染的女妖"])),
}

export default Data
