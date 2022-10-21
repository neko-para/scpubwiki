import { CardInstance } from "."
import { getUnit, data } from "../data"
import { Unit } from "../data/types"
import { Description } from "./types"
import { shuffle, $, 获得, 获得N, 相邻两侧, 转换 } from "./util"

async function 折跃(card: CardInstance, unit: string[]) {
  await card.player.step(
    `卡牌 ${card.pos} ${card.name} 即将折跃 ${unit.join(", ")}`
  )
  await card.player.bus.async_emit("wrap", {
    unit,
    info: {
      to: null,
    },
  })
}

async function 集结部队(card: CardInstance, id: number) {
  await card.player.step(
    `卡牌 ${card.pos} ${card.name} 即将重新集结部队, 描述 ${id}`
  )
  await card.player.bus.async_emit("regroup", {
    card,
    id,
  })
}

function 集结(card: CardInstance, power: number, id: number) {
  return async () => {
    let n = 0
    if (card.power() >= power * 2) {
      n++
    }
    if (card.power() >= power) {
      n++
    }
    if (card.player.flag.阿塔尼斯) {
      n++
    }
    while (n--) {
      await 集结部队(card, id)
    }
  }
}

const Data: Description = {
  折跃援军: (p, c, g) =>
    $()
      .for(c)
      .bind("card-selled", () =>
        折跃(c, [
          ...Array(g ? 2 : 1).fill("狂热者"),
          ...Array(g ? 4 : 2).fill("追猎者"),
        ])
      ),
  发电站: () => $(),
  供能中心: (p, c, g) =>
    $()
      .for(p)
      .bind("upgrade-pub", () => 获得N(c, "水晶塔", g ? 2 : 1)),
  龙骑兵团: (p, c, g) =>
    $()
      .for(c)
      .bind("round-end", () => 获得N(c, "零件", g ? 4 : 2))
      .bind("card-selled", () =>
        折跃(c, Array(c.locate("零件").length).fill("龙骑士"))
      ),
  万叉奔腾: (p, c, g) =>
    $()
      .for(c)
      .bind("round-end", 集结(c, 2, 0))
      .bind("regroup", () => 获得N(c, "狂热者", g ? 2 : 1)),
  折跃信标: (p, c, g) =>
    $()
      .for(c)
      .bind("wrap", async ({ unit, info }) => {
        if (info.to === null) {
          info.to = c
        }
      }),
  艾尔之刃: (p, c, g) =>
    $()
      .for(c)
      .bind("post-enter", () =>
        相邻两侧(c, async card => {
          if (card.race === "P") {
            await 获得N(card, "水晶塔", g ? 2 : 1)
          }
        })
      ),
  折跃部署: (p, c, g) =>
    $()
      .for(c)
      .bind("round-end", () => 折跃(c, Array(g ? 3 : 2).fill("追猎者")))
      .bind("round-start", () => 折跃(c, Array(g ? 2 : 1).fill("狂热者"))),
  暗影卫队: (p, c, g) =>
    $()
      .for(c)
      .bind("post-enter", async () => {
        c.upgrade.push("暗影战士")
      })
      .bind("round-end", 集结(c, 3, 0))
      .bind("regroup", () => 获得N(c, "黑暗圣堂武士", g ? 2 : 1))
      .bind("round-end", async () => {
        if (c.power() >= 6) {
          await 获得(c, ["黑暗圣堂武士"])
        }
      }),
  重回战场: (p, c, g) =>
    $()
      .for(c)
      .bind("post-enter", () =>
        p.asyncEnumPresent(async card => {
          if (card.race === "P") {
            const idx = card.locateX(unit => {
              const uu = getUnit(unit)
              return !!uu?.tag?.includes("生物单位")
            })
            for (const i of idx.slice(0, g ? 2 : 1)) {
              const u = getUnit(card.unit[i]) as Unit
              await 转换(
                card,
                [i],
                u.tag?.includes("英雄单位") ? "英雄不朽者" : "不朽者"
              )
            }
          }
        })
      )
      .bind("card-selled", () => 折跃(c, Array(g ? 2 : 1).fill("不朽者"))),
  折跃攻势: (p, c, g) =>
    $()
      .for(c)
      .bind("wrap", () => 获得N(c, "追猎者", g ? 2 : 1)),
  净化者军团: (p, c, g) =>
    $()
      .for(c)
      .bind("round-end", 集结(c, 5, 0))
      .bind("regroup", async () => {
        const unit: string[] = []
        p.enumPresent(card => {
          if (card.race === "P") {
            const us = card
              .locateX(unit => {
                const uu = getUnit(unit) as Unit
                return `${unit}(精英)` in data && !uu.tag?.includes("重型单位")
              })
              .map(i => card.unit[i])
            shuffle(us)
            us.slice(0, 2).forEach(u => {
              unit.push(card.take_unit(u) + "(精英)")
            })
          }
        })
        await 折跃(c, unit)
      }),
  凯拉克斯: (p, c, g) =>
    $()
      .for(c)
      .bind("round-end", () =>
        折跃(c, Array(g ? 2 : 1).fill(shuffle(["不朽者", "巨像", "掠夺者"])[0]))
      ),
  虚空舰队: (p, c, g) =>
    $()
      .for(c)
      .bind("round-end", 集结(c, 5, 0))
      .bind("regroup", () => 折跃(c, Array(g ? 2 : 1).fill("虚空辉光舰"))),
  势不可挡: (p, c, g) =>
    $()
      .for(c)
      .bind("post-enter", () => 折跃(c, ["执政官(精英)"]))
      .bind("round-end", 集结(c, 5, 0))
      .bind("regroup", () => 折跃(c, Array(g ? 2 : 1).fill("执政官")))
      .bind("round-end", async () => {
        if (c.power() >= 15) {
          await 折跃(c, ["执政官(精英)"])
        }
      }),
  黄金舰队: (p, c, g) =>
    $()
      .for(c)
      .bind("round-end", 集结(c, 5, 0))
      .bind("round-end", 集结(c, 7, 1))
      .bind("regroup", async ({ id }) => {
        if (id === 0) {
          await 获得(c, Array(g ? 2 : 1).fill("侦察机"))
        } else if (id === 1) {
          await 获得(c, Array(g ? 2 : 1).fill("风暴战舰"))
        }
      })
      .bind("regroup-count", async ({ info }) => {
        info.count = 2
      }),
  莫汗达尔: (p, c, g) =>
    $()
      .for(c)
      .bind("wrap", async ({ unit }) => {
        if (!p.flag.莫汗达尔) {
          p.flag.莫汗达尔 = 1
          await 获得(c, unit.slice(unit.length - (g ? 2 : 1)))
        }
      })
      .for(p)
      .bindAfter("wrap", async () => {
        delete p.flag.莫汗达尔
      }),
  光复艾尔: (p, c, g, a) =>
    $()
      .for(p)
      .bind("post-enter", () => a(`泰坦棱镜已展开`))
      .bind("sell-card", async ({ selled: card }) => {
        if (card === c || c.info.已收起 || p.flag.光复艾尔) {
          return
        }
        if (card.race === "P") {
          const unit: string[] = []
          card.unit = card.unit.filter(u => {
            const uu = getUnit(u) as Unit
            if (uu.utyp !== "normal" && u !== "水晶塔") {
              return true
            } else if (g || !uu.tag?.includes("英雄单位")) {
              unit.push(u)
            }
          })
          c.info.已收起 = 1
          await a(`泰坦棱镜已收起`)
          p.flag.光复艾尔 = 1
          await 获得(c, unit)
        }
      })
      .bindAfter("sell-card", async () => {
        p.flag.光复艾尔 = 0
      }),
  菲尼克斯: (p, c, g) =>
    $()
      .for(c)
      .bind("post-enter", () =>
        相邻两侧(c, async card => {
          await 转换(card, card.locate("狂热者"), "旋风狂热者")
          await 转换(card, card.locate("狂热者(精英)"), "旋风狂热者(精英)")
        })
      )
      .bind("round-end", 集结(c, 5, 0))
      .bind("regroup", () => 获得N(c, "掠夺者", g ? 2 : 1)),
  酒馆后勤处: (p, c, g) =>
    $()
      .for(c)
      .bind("post-enter", async () => {
        await p.asyncEnumPresent(async card => {
          const info = {
            count: 1,
          }
          await card.bus.async_emit("regroup-count", { info })
          for (let i = 0; i < info.count; i++) {
            await 集结部队(card, i)
            await 集结部队(card, i)
          }
        })
      }),
  净化一切: (p, c, g) =>
    $()
      .for(c)
      .bind("round-end", 集结(c, 4, 0))
      .bind("regroup", () => 折跃(c, Array(g ? 2 : 1).fill("狂热者(精英)")))
      .bind("round-end", async () => {
        if (c.power() >= 7) {
          await 折跃(c, Array(g ? 2 : 1).fill("巨像(精英)"))
        }
      }),
  阿尔达瑞斯: (p, c, g) =>
    $()
      .for(c)
      .bind("round-end", async () => {
        if (p.flag.阿尔达瑞斯) {
          return
        }
        if (p.present.filter(card => card?.race === "P").length >= 5) {
          p.flag.阿尔达瑞斯 = 1
          await 获得(c, Array(g ? 2 : 1).fill("英雄不朽者"))
        }
      }),
  阿塔尼斯: (p, c, g) =>
    $()
      .for(c)
      .bind("round-end", async () => {
        await 获得N(c, "旋风狂热者(精英)", 2)
        if (g) {
          await 获得N(c, "阿塔尼斯", 2)
        }
      })
      .for(p)
      .bind("round-end", async () => {
        p.flag.阿塔尼斯 = 1
      }),
  净化之光: (p, c, g) =>
    $()
      .for(c)
      .bind("round-end", () => 获得N(c, "虚空辉光舰", g ? 2 : 1))
      .bind("round-end", 集结(c, 4, 0))
      .bind("regroup", () =>
        p.asyncEnumPresent(async card =>
          转换(card, card.locate("虚空辉光舰", g ? 2 : 1), "虚空辉光舰(精英)")
        )
      ),
  生物质发电: (p, c, g) =>
    $()
      .for(p)
      .bind("sell-card", async ({ selled }) => {
        if (selled.race === "Z" && selled.level >= 3) {
          await 获得N(c, "水晶塔", g ? 2 : 1)
        }
      }),
  黑暗教长: (p, c, g) =>
    $()
      .for(c)
      .bind("post-enter", async () => {
        c.upgrade.push("暗影战士")
      })
      .bind("round-end", 集结(c, 5, 0))
      .bind("regroup", () => 获得N(c, "黑暗圣堂武士(精英)", g ? 2 : 1)),
  六脉神剑: (p, c, g) =>
    $()
      .for(p)
      .bind("card-enter", async () => {
        if (c.locate("先知").length < c.power()) {
          await 折跃(c, Array(g ? 2 : 1).fill("先知"))
        }
      }),
  晋升仪式: (p, c, g) =>
    $()
      .for(c)
      .bind("round-end", 集结(c, 4, 0))
      .bind("regroup", async () => {
        await 转换(c, c.locate("不朽者", g ? 2 : 1), "英雄不朽者")
        await 转换(
          c,
          c.locateX(
            u => {
              const uu = getUnit(u) as Unit
              return !!uu.tag?.includes("生物单位")
            },
            g ? 2 : 1
          ),
          "高阶圣堂武士"
        )
      }),
  英雄叉: (p, c, g) =>
    $()
      .for(c)
      .bindBefore("wrap-in", async ({ unit }) => {
        for (let i = 0; i < unit.length; i++) {
          if (unit[i] === "狂热者(精英)") {
            unit[i] = "卡尔达利斯"
          }
        }
      }),
}

export default Data
