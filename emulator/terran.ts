import { CardInstance } from '.'
import {
  getUnit,
  UnitKey,
  isHero,
  isNormal,
  isBiological,
  elited,
} from '../data'
import { Description } from './types'
import { shuffle, $, 获得, 获得N, 转换, 左侧, 相邻两侧, Binder } from './util'

function 任务(
  announce: (msg: string) => Promise<void>,
  card: CardInstance,
  count: number,
  result: () => Promise<void>,
  check?: (...args: any) => boolean,
  renew?: (f: () => Promise<void>) => void
) {
  let n = 0
  if (renew) {
    renew(async () => {
      card.player.step(`卡牌 ${card.pos} ${card.name} 即将重置任务`)
      n = 0
      await announce(`任务: 0 / ${count}`)
    })
  }
  return async (...arg: any) => {
    if (n < count && (!check || check(...arg))) {
      n++
      await announce(`任务: ${n} / ${count}`)
      if (n === count) {
        await result()
        await card.player.step(`即将广播任务完成信息`)
        await card.player.bus.async_emit('task-done', {
          card,
        })
      }
    }
  }
}

function 改挂件(card: CardInstance) {
  return (binder: Binder) => {
    binder.for(card).bind('post-enter', () =>
      相邻两侧(card, async card => {
        if (card.race === 'T') {
          await card.player.bus.async_emit('switch-infr', {
            card,
          })
        }
      })
    )
  }
}

function 快产(card: CardInstance, result: () => Promise<void>) {
  return (binder: Binder) => {
    binder.for(card).bind('fast-prod', result)
  }
}

function 反应堆(card: CardInstance, unit: UnitKey) {
  return (binder: Binder) => {
    binder.for(card).bind('round-end', async () => {
      if (card.infr_type() === 0) {
        await 获得N(card, unit, card.gold ? 2 : 1)
      }
    })
  }
}

export function 科挂(
  card: CardInstance,
  count: number,
  result: () => Promise<void>
) {
  return (binder: Binder) => {
    binder.for(card).bind('round-end', async () =>
      card.player.asyncEnumPresent(async c => {
        count -= c.countIn(['科技实验室', '高级科技实验室'])
        if (--count <= 0) {
          await card.player.step(
            `卡牌 ${card.pos} ${card.name} 即将触发科挂效果`
          )
          await result()
          return true
        }
      })
    )
  }
}

const Data: Description = {
  死神火车: (p, c, g, a) =>
    $()
      .for(p)
      .bind(
        'card-enter',
        任务(a, c, 2, async () => {
          p.mineral += g ? 2 : 1
        })
      ),
  好兄弟: (p, c, g) =>
    $().apply(
      快产(c, () => 获得N(c, '陆战队员', g ? 6 : 4)),
      反应堆(c, '陆战队员')
    ),
  挖宝奇兵: (p, c, g, a) =>
    $()
      .for(c)
      .bind('post-enter', () => a(`任务: 0 / 5`))
      .for(p)
      .bind(
        'refresh',
        任务(a, c, 5, async () => {
          await p.bus.async_emit('discover-card', {
            filter: c => {
              return c.level === p.level
            },
          })
        })
      ),
  实验室安保: (p, c, g) => $().apply(反应堆(c, '陆战队员'), 改挂件(c)),
  征兵令: (p, c, g) =>
    $()
      .for(c)
      .bind('post-enter', () =>
        相邻两侧(c, async card => {
          const taked: UnitKey[] = []
          card.unit.forEach((unit, index) => {
            if (index % 3 === 0) {
              return
            }
            if (!isNormal(unit)) {
              return
            }
            taked.push(unit)
          })
          taked.forEach(unit => {
            card.take_unit(unit)
          })
          await 获得(c, taked)
        })
      ),
  恶火小队: (p, c, g) =>
    $()
      .for(c)
      .apply(
        反应堆(c, '恶火'),
        科挂(c, 2, () => 获得N(c, '歌利亚', g ? 2 : 1)),
        快产(c, () => 获得N(c, '攻城坦克', 1))
      ),
  空投地雷: (p, c, g) =>
    $()
      .for(p)
      .bind('card-enter', () => 获得N(c, '寡妇雷', g ? 2 : 1))
      .apply(快产(c, () => 获得N(c, '寡妇雷', g ? 3 : 2))),
  步兵连队: (p, c, g) =>
    $()
      .for(c)
      .apply(
        快产(c, () => 获得N(c, '劫掠者', g ? 5 : 3)),
        反应堆(c, '劫掠者')
      ),
  飙车流: (p, c, g, a) =>
    $()
      .for(c)
      .bind('post-enter', () => a(`任务: 0 / 3`))
      .apply(快产(c, () => 获得N(c, '秃鹫', g ? 5 : 3)))
      .for(p)
      .bind(
        'card-enter',
        任务(
          a,
          c,
          3,
          async () => {
            await 左侧(c, async card => {
              if (card.race === 'T') {
                await p.bus.async_emit('upgrade-infr', {
                  card,
                })
              }
            })
          },
          ({ card }) => {
            return card.race === 'T'
          }
        )
      ),
  科考小队: (p, c, g, a) => {
    let rn = async () => {}
    return $()
      .for(c)
      .bind('post-enter', () => a(`任务: 0 / 2`))
      .bind('post-enter', () =>
        相邻两侧(c, async card => {
          if (card.race === 'T') {
            await p.bus.async_emit('switch-infr', {
              card,
            })
          }
        })
      )
      .for(p)
      .bind(
        'refresh',
        任务(
          a,
          c,
          2,
          () => 获得N(c, '歌利亚', g ? 2 : 1),
          () => true,
          renew => {
            rn = renew
          }
        )
      )
      .for(c)
      .bind('round-end', rn)
  },
  陆军学院: (p, c, g) =>
    $()
      .for(c)
      .apply(
        快产(c, () => 获得N(c, '维京战机', g ? 5 : 3)),
        科挂(c, 3, () => 获得N(c, '战狼', g ? 2 : 1))
      ),
  空军学院: (p, c, g) =>
    $()
      .for(c)
      .apply(快产(c, () => 获得N(c, '维京战机', g ? 5 : 3)))
      .for(p)
      .bind('task-done', () => 获得N(c, '解放者', g ? 2 : 1)),
  交叉火力: (p, c, g) =>
    $()
      .for(c)
      .apply(
        快产(c, () => 获得N(c, '歌利亚', g ? 5 : 3)),
        科挂(c, 4, () => 获得N(c, '攻城坦克', g ? 2 : 1))
      ),
  枪兵坦克: (p, c, g) =>
    $()
      .for(c)
      .bind('round-end', () =>
        p.asyncEnumPresent(async card => {
          if (card.infr_type() === 0) {
            await 获得N(card, '陆战队员', g ? 4 : 2)
          }
        })
      ),
  斯台特曼: (p, c, g) =>
    $()
      .for(c)
      .apply(
        快产(c, () =>
          相邻两侧(c, async card => {
            const us: UnitKey[] = ['歌利亚', '维京战机']
            for (const u of us) {
              await 转换(card, card.locate(u, g ? 2 : 1), elited(u))
            }
          })
        )
      )
      .bind('post-enter', async () => {
        await 左侧(c, async card => {
          if (card.race === 'T') {
            await p.bus.async_emit('upgrade-infr', {
              card,
            })
          }
        })
      }),
  护航中队: (p, c, g) =>
    $()
      .for(c)
      .apply(快产(c, () => 获得N(c, '黄昏之翼', g ? 2 : 1)))
      .for(p)
      .bind('card-enter', () => 获得N(c, '怨灵战机', g ? 2 : 1)),
  泰凯斯: (p, c, g) =>
    $()
      .for(c)
      .apply(反应堆(c, '陆战队员(精英)'))
      .bind('round-end', () =>
        p.asyncEnumPresent(async card => {
          if (card.race === 'T') {
            const us: UnitKey[] = ['陆战队员', '劫掠者']
            for (const u of us) {
              await 转换(card, card.locate(u, g ? 5 : 3), elited(u))
            }
          }
        })
      )
      .bind('round-end', () => 获得N(c, '医疗运输机', g ? 2 : 1)),
  外籍军团: (p, c, g) =>
    $()
      .for(c)
      .apply(反应堆(c, '牛头人陆战队员'))
      .bind('post-enter', () =>
        相邻两侧(c, async card => {
          let nPro = 0,
            nNor = 0
          card.unit.forEach(u => {
            if (u === '陆战队员') {
              nNor++
            } else if (u === '陆战队员(精英)') {
              nPro++
            }
          })
          const nProRest = nPro % 3
          let nProTran = nPro - nProRest,
            nNorTran = 0
          let cnt = nProTran / 3
          if (6 - nProRest * 2 <= nNor) {
            nNorTran += 6 - nProRest * 2
            nNor -= 6 - nProRest * 2
            nProTran += nProRest
            cnt++
          }
          const nNorRest = nNor % 6
          cnt += (nNor - nNorRest) / 6
          nNorTran += nNor - nNorRest
          card.take_units('陆战队员(精英)', nProTran)
          card.take_units('陆战队员', nNorTran)
          await 获得N(card, '牛头人陆战队员', cnt)
        })
      ),
  钢铁洪流: (p, c, g) =>
    $()
      .for(c)
      .apply(
        快产(c, () => 获得N(c, '雷神', g ? 2 : 1)),
        科挂(c, 5, () =>
          p.asyncEnumPresent(async card => {
            const us: UnitKey[] = ['攻城坦克', '战狼']
            for (const u of us) {
              await 转换(card, card.locate(u, g ? 2 : 1), elited(u))
            }
          })
        )
      ),
  游骑兵: (p, c, g) =>
    $()
      .for(p)
      .bind(
        'switch-infr',
        async ({ card }) => await 获得N(card, '雷诺(狙击手)', g ? 2 : 1)
      )
      .bind(
        'upgrade-infr',
        async ({ card }) => await 获得N(card, '雷诺(狙击手)', g ? 2 : 1)
      )
      .apply(反应堆(c, '雷诺(狙击手)')),
  沃菲尔德: (p, c, g) =>
    $()
      .for(p)
      .bind('sell-card', async ({ selled: card }) => {
        if (card === c) {
          return
        }
        p.flag.沃菲尔德 = p.flag.沃菲尔德 || 0
        if (card.race === 'T') {
          if (p.flag.沃菲尔德 < (g ? 2 : 1)) {
            p.flag.沃菲尔德++
            const unit: UnitKey[] = []
            card.unit = card.unit.filter(u => {
              if (!isNormal(u)) {
                return true
              } else {
                unit.push(u)
              }
            })
            await 获得(c, unit)
          }
        }
      })
      .for(c)
      .bind('round-end', () =>
        p.asyncEnumPresent(async card =>
          转换(card, card.locate('陆战队员(精英)', g ? 2 : 1), '帝盾卫兵')
        )
      ),
  帝国舰队: (p, c, g, a) => {
    let rn = async () => {}
    return $()
      .for(c)
      .bind('post-enter', () => a(`任务: 0 / 3`))
      .for(p)
      .bind(
        'sell-card',
        任务(
          a,
          c,
          3,
          async () => {
            await 获得N(c, '战列巡航舰', g ? 2 : 1)
            await rn()
          },
          () => true,
          renew => {
            rn = renew
          }
        )
      )
      .apply(科挂(c, 4, () => 获得N(c, '黄昏之翼', g ? 4 : 2)))
  },
  黄昏之翼: (p, c, g) =>
    $()
      .for(c)
      .apply(
        快产(c, () => 获得N(c, '黄昏之翼', g ? 2 : 1)),
        反应堆(c, '女妖')
      ),
  艾尔游骑兵: (p, c, g) =>
    $()
      .apply(
        快产(c, () => 左侧(c, async card => 获得N(card, '水晶塔', g ? 2 : 1)))
      )
      .for(c)
      .bind('round-end', async () => {
        let n = 0
        await 相邻两侧(c, async card => {
          const idx = card.unit.indexOf('水晶塔')
          if (idx !== -1) {
            card.take_at(idx)
            n += g ? 8 : 4
          }
        })
        await 获得N(c, '陆战队员', n)
      }),
  帝国敢死队: (p, c, g) =>
    $()
      .apply(
        快产(c, () => 获得N(c, '诺娃', 2)),
        反应堆(c, '诺娃')
      )
      .for(p)
      .bind('task-done', () => 获得N(c, '诺娃', g ? 2 : 1)),
  以火治火: (p, c, g) =>
    $()
      .for(c)
      .bind('round-end', () =>
        p.asyncEnumPresent(async card => {
          if (card.infr_type() === 0) {
            await 获得N(card, '火蝠', g ? 2 : 1)
          }
        })
      )
      .apply(
        快产(c, () =>
          p.asyncEnumPresent(async card => {
            if (card.race === 'T') {
              await 转换(card, card.locate('火蝠', g ? 3 : 2), '火蝠(精英)')
            }
          })
        )
      ),
  复制中心: (p, c, g) =>
    $()
      .for(c)
      .apply(
        快产(c, async () => {
          for (const card of p.hand) {
            if (!card) {
              continue
            }
            const us = card.unit
            const r: UnitKey[] = []
            for (const k in us) {
              const unit = k as UnitKey
              if (!isNormal(unit) || isHero(unit) || !isBiological(unit)) {
                continue
              }
              r.push(...Array(us[unit]).fill(unit))
            }
            const n = g ? 2 : 1
            await 获得(c, shuffle(r).slice(0, n))
          }
        })
      ),
  黑色行动: (p, c, g) =>
    $()
      .apply(
        快产(c, () => 获得N(c, '恶蝠游骑兵', g ? 2 : 1)),
        反应堆(c, '修理无人机')
      )
      .for(c)
      .bind('round-end', async () => {
        const index = c.locate('陆战队员')
        if (index.length > 0) {
          await 转换(c, index, '陆战队员(精英)')
        }
      }),
}

export default Data
