import { getUnit, getCard } from '../data'
import { shuffle, $, 获得, 获得N, 转换, 左侧, 相邻两侧 } from './util.js'

function 任务 (announce, card, count, result, check = () => true, renew = null) {
  let n = 0
  if (renew) {
    renew(async () => {
      card.player.step(`卡牌 ${card.pos} ${card.name} 即将重置任务`)
      n = 0
      await announce(`任务: 0 / ${count}`)
    })
  }
  return async (...arg) => {
    if (n < count && check(...arg)) {
      n++
      await announce(`任务: ${n} / ${count}`)
      if (n === count) {
        await result()
        await card.player.step(`即将广播任务完成信息`)
        await card.player.bus.async_emit('task-done', {
          card
        })
      }
    }
  }
}

function 反应堆 (card, gold, unit) {
  return async () => {
    console.log(card.infr_type())
    if (card.infr_type() === 0) {
      await 获得N(card, unit, gold ? 2 : 1)
    }
  }
}

export function 科挂 (card, count, result) {
  return async () => card.player.asyncEnumPresent(async c => {
    count -= c.locateX(u => ['科技实验室', '高级科技实验室'].includes(u)).length
    if (--count <= 0) {
      await card.player.step(`卡牌 ${card.pos} ${card.name} 即将触发科挂效果`)
      await result()
      return true
    }
  })
}

export default {
  死神火车: (p, c, g, a) => $()
    .for(p)
    .bind('card-enter', 任务(a, c, 2, () => {
      p.mineral += g ? 2 : 1
    })),
  好兄弟: (p, c, g) => $()
    .for(c)
    .bind('fast-prod', () => 获得N(c, '陆战队员', g ? 6 : 4))
    .bind('round-end', 反应堆(c, g, '陆战队员')),
  挖宝奇兵: (p, c, g, a) => $()
    .for(p)
    .bind('post-enter', () => a(`任务: 0 / 5`))
    .bind('refresh', 任务(a, c, 5, async () => {
      await p.bus.async_emit('discover-card', {
        filter: c => {
          return c.level === p.level
        }
      })
    })),
  实验室安保: (p, c, g) => $()
    .for(c)
    .bind('round-end', 反应堆(c, g, '陆战队员'))
    .bind('post-enter', async () => {
      await 相邻两侧(c, async card => {
        if (card.race === 'T') {
          await p.bus.async_emit('switch-infr', {
            card
          })
        }
      })
    }),
  征兵令: (p, c, g) => $()
    .for(c)
    .bind('post-enter', async () => {
      await 相邻两侧(c, async card => {
        const taked = []
        card.unit.forEach((unit, index) => {
          if (index % 3 === 0) {
            return
          }
          if (getUnit(unit).utyp !== 'normal') {
            return
          }
          taked.push(unit)
        })
        taked.forEach(unit => {
          card.take_unit(unit)
        })
        await 获得(c, taked)
      })
    }),
  恶火小队: (p, c, g) => $()
    .for(c)
    .bind('round-end', 反应堆(c, g, '恶火'))
    .bind('round-end', 科挂(c, 2, () => 获得N(c, '歌利亚', g ? 2 : 1)))
    .bind('fast-prod', () => 获得N(c, '攻城坦克', 1)),
  空投地雷: (p, c, g) => $()
    .for(p)
    .bind('card-enter', () => 获得N(c, '寡妇雷', g ? 2 : 1))
    .for(c)
    .bind('fast-prod', () => 获得N(c, '寡妇雷', g ? 3 : 2)),
  步兵连队: (p, c, g) => $()
    .for(c)
    .bind('fast-prod', () => 获得N(c, '劫掠者', g ? 5 : 3))
    .bind('round-end', 反应堆(c, g, '劫掠者')),
  飙车流: (p, c, g, a) => $()
    .for(c)
    .bind('post-enter', () => a(`任务: 0 / 3`))
    .bind('fast-prod', () => 获得N(c, '秃鹫', g ? 5 : 3))
    .for(p)
    .bind('card-enter', 任务(a, c, 3, () => 左侧(c, async card => {
      if (card.race === 'T') {
        await p.bus.async_emit('upgrade-infr', {
          card
        })
      }
    }), ({ card }) => {
      return card.race === 'T'
    })),
  科考小队: (p, c, g, a) => {
    let rn = null
    return $()
    .for(c)
    .bind('post-enter', () => a(`任务: 0 / 2`))
    .bind('post-enter', () => 相邻两侧(c, async card => {
      if (card.race === 'T') {
        await p.bus.async_emit('switch-infr', {
          card
        })
      }
    }))
    .for(p)
    .bind('refresh', 任务(a, c, 2, () => 获得N(c, '歌利亚', g ? 2 : 1),
      () => true, renew => {
        rn = renew
      }))
    .for(c)
    .bind('round-end', rn)
  },
  陆军学院: (p, c, g) => $()
    .for(c)
    .bind('fast-prod', () => 获得N(c, '维京战机', g ? 5 : 3))
    .bind('round-end', 科挂(c, 3, () => 获得N(c, '战狼', g ? 2 : 1))),
  空军学院: (p, c, g) => $()
    .for(c)
    .bind('fast-prod', () => 获得N(c, '维京战机', g ? 5 : 3))
    .for(p)
    .bind('task-done', () => 获得N(c, '解放者', g ? 2 : 1)),
  交叉火力: (p, c, g) => $()
    .for(c)
    .bind('fast-prod', () => 获得N(c, '歌利亚', g ? 5 : 3))
    .bind('round-end', 科挂(c, 5, () => 获得N(c, '攻城坦克', g ? 2 : 1))),
  枪兵坦克: (p, c, g) => $()
    .for(c)
    .bind('round-end', () => p.asyncEnumPresent(async card => {
      if (card.infr_type() === 0) {
        await 获得N(card, '陆战队员', g ? 4 : 2)
      }
    })),
  斯台特曼: (p, c, g) => $()
    .for(c)
    .bind('fast-prod', () => 相邻两侧(c, async card => {
      for (const u of ['歌利亚', '维京战机']) {
        await 转换(card, card.locate(u, g ? 2 : 1), u + '(精英)')
      }
    }))
    .bind('post-enter', () => 左侧(c, async card => {
      if (card.race === 'T') {
        await p.bus.async_emit('upgrade-infr', {
          card
        })
      }
    })),
  护航中队: (p, c, g) => $()
    .for(c)
    .bind('fast-prod', () => 获得N(c, '黄昏之翼', g ? 2 : 1))
    .for(p)
    .bind('card-enter', () => 获得N(c, '怨灵战机', g ? 2 : 1)),
  泰凯斯: (p, c, g) => $()
    .for(c)
    .bind('round-end', 反应堆(c, g, '陆战队员(精英)'))
    .bind('round-end', () => p.asyncEnumPresent(async card => {
      if (card.race === 'T') {
        for (const u of ['陆战队员', '劫掠者']) {
          await 转换(card, card.locate(u, g ? 5 : 3), u + '(精英)')
        }
      }
    }))
    .bind('round-end', () => 获得N(c, '医疗运输机', g ? 2 : 1)),
  外籍军团: (p, c, g) => $()
    .for(c)
    .bind('round-end', 反应堆(c, g, '牛头人陆战队员'))
    .bind('post-enter', () => 相邻两侧(c, async card => {
      let nPro = 0, nNor = 0
      card.unit.forEach(u => {
        if (u === '陆战队员') {
          nNor++
        } else if (u === '陆战队员(精英)') {
          nPro++
        }
      })
      const nProRest = nPro % 3
      let nProTran = nPro - nProRest, nNorTran = 0
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
      while (nProTran-- > 0) {
        card.take_unit('陆战队员(精英)')
      }
      while (nNorTran-- > 0) {
        card.take_unit('陆战队员')
      }
      await 获得N(card, '牛头人陆战队员', cnt)
    })),
  钢铁洪流: (p, c, g) => $()
    .for(c)
    .bind('fast-prod', () => 获得N(c, '雷神', g ? 2 : 1))
    .bind('round-end', 科挂(c, 5, () => p.asyncEnumPresent(async card => {
      for (const u of ['攻城坦克', '战狼']) {
        await 转换(card, card.locate(u, g ? 2 : 1), u + '(精英)')
      }
    }))),
  游骑兵: (p, c, g) => $()
    .for(g)
    .bind('switch-infr', async ({ card }) => await 获得N(card, '雷诺(狙击手)', g ? 2 : 1))
    .bind('upgrade-infr', async ({ card }) => await 获得N(card, '雷诺(狙击手)', g ? 2 : 1))
    .for(c)
    .bind('round-end', 反应堆(c, g, '雷诺(狙击手)')),
  沃菲尔德: (p, c, g) => $()
    .for(p)
    .bind('card-sell', async ({ selled: card }) => {
      if (card === c) {
        return
      }
      p.flag.沃菲尔德 = p.flag.沃菲尔德 || 0
      if (card.race === 'T') {
        if (p.flag.沃菲尔德 < (g ? 2 : 1)) {
          p.flag.沃菲尔德++
          const unit = []
          card.unit = card.unit.filter(u => {
            if (getUnit(u).utyp !== 'normal') {
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
    .bind('round-end', () => p.asyncEnumPresent(async card => 转换(card, card.locate('陆战队员(精英)', g ? 2 : 1), '帝盾卫兵'))),
  帝国舰队: (p, c, g, a) => {
    let rn = null
    return $()
    .for(c)
    .bind('post-enter', () => a(`任务: 0 / 3`))
    .for(p)
    .bind('card-sell', 任务(a, c, 3, async () => {
        await 获得N(c, '战列巡航舰', g ? 2 : 1)
        await rn()
      }, () => true, renew => { rn = renew }))
    .for(c)
    .bind('round-end', 科挂(c, 4, () => 获得N(c, '黄昏之翼', g ? 4 : 2)))
  },
  黄昏之翼: (p, c, g) => $()
    .for(c)
    .bind('fast-prod', () => 获得N(c, '黄昏之翼', g ? 2 : 1))
    .bind('round-end', 反应堆(c, g, '女妖')),
  艾尔游骑兵: (p, c, g) => $()
    .for(c)
    .bind('fast-prod', () => 左侧(c, async card => 获得N(card, '水晶塔', g ? 2 : 1)))
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
  帝国敢死队: (p, c, g) => $()
    .for(c)
    .bind('fast-prod', () => 获得N(c, '诺娃', 2))
    .bind('round-end', 反应堆(c, g, '诺娃'))
    .for(p)
    .bind('task-done', () => 获得N(c, '诺娃', g ? 2 : 1)),
  以火治火: (p, c, g) => $()
    .for(c)
    .bind('round-end', () => p.asyncEnumPresent(async card => {
      if (card.infr_type() === 0) {
        await 获得N(card, '火蝠', g ? 2 : 1)
      }
    }))
    .bind('fast-prod', () => p.asyncEnumPresent(async card => {
      if (card.race === 'T') {
        await 转换(card, card.locate('火蝠', g ? 3 : 2), '火蝠(精英)')
      }
    })),
  复制中心: (p, c, g) => $()
    .for(c)
    .bind('fast-prod', async () => {
      for (const card of p.hand.filter(x => x)) {
        const us = getCard(card).unit
        const r = []
        for (const k in us) {
          const u = getUnit(k)
          if (u.utyp !== 'normal') {
            continue
          }
          if (u.tag.includes('英雄单位') || !u.tag.includes('生物单位')) {
            continue
          }
          r.push(...Array(us[k]).fill(k))
        }
        const n = g ? 2 : 1
        await 获得(c, shuffle(r).slice(0, n))
      }
    }),
  黑色行动: (p, c, g) => $()
    .for(c)
    .bind('fast-prod', () => 获得N(c, '恶蝠游骑兵', g ? 2 : 1))
    .bind('round-end', 反应堆(c, g, '修理无人机'))
    .bind('round-end', async () => {
      const index = c.locate('陆战队员')
      if (index.length > 0) {
        await 转换(c, index, '陆战队员(精英)')
      }
    })
}