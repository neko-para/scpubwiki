import { getUnit } from "../data.js"

function binder () {
  return {
    clf: [],
    bus : null,
    for (t) {
      this.bus = t.bus
      return this
    },
    bind (ev, func) {
      this.bus.on(ev, func)
      this.clf.push(() => {
        this.bus.off(ev, f)
      })
      return this
    },
    clear () {
      return () => {
        this.clf.forEach(f => f())
      }
    }
  }
}

function 任务 (card, count, result, check = () => true, renew = null) {
  let n = 0
  if (renew) {
    renew(() => {
      n = 0
    })
  }
  return (...arg) => {
    if (n < count && check(...arg) && ++n === count) {
      result()
      card.player.bus.emit('task-done', {
        card
      })
    }
  }
}

function 获得 (card, unit, number) {
  if (number === 0) {
    return
  }
  card.player.bus.emit('obtain-unit', {
    card,
    unit: Array(number).fill(unit)
  })
}

function 反应堆 (card, gold, unit) {
  return () => {
    if (card.infr_type() === 0) {
      获得(card, unit, gold ? 2 : 1)
    }
  }
}

function 科挂 (player, count, result) {
  return () => {
    player.enumPresent(c => {
      if (c.infr_type() > 0) {
        if (--count <= 0) {
          result()
          return true
        }
      }
    })
  }
}

function 左侧 (card, func) {
  if (card.pos > 0 && card.player.present[card.pos - 1]) {
    func(card.player.present[card.pos - 1])
    return true
  } else {
    return false
  }
}

function 右侧 (card, func) {
  if (card.pos < 6 && card.player.present[card.pos + 1]) {
    func(card.player.present[card.pos + 1])
    return true
  } else {
    return false
  }
}

function 相邻两侧 (card, func) {
  左侧(card, func)
  右侧(card, func)
}

export default {
  死神火车: (p, c, g) => binder()
    .for(p)
    .bind('card-enter', 任务(c, 2, () => {
      p.mineral += g ? 2 : 1
    })),
  好兄弟: (p, c, g) => binder()
    .for(c)
    .bind('fast-prod', () => {
      获得(c, '陆战队员', g ? 6 : 4)
    })
    .bind('round-end', 反应堆(c, g, '陆战队员')),
  挖宝奇兵: (p, c, g) => binder()
    .for(p)
    .bind('refresh', 任务(c, 5, () => {
      p.bus.emit('discover-card', {
        filter: c => {
          return c.level === g.level
        }
      })
    })),
  实验室安保: (p, c, g) => binder()
    .for(c)
    .bind('round-end', 反应堆(c, g, '陆战队员'))
    .bind('post-enter', () => {
      相邻两侧(c, card => {
        if (card.race === 'T') {
          p.bus.emit('switch-infr', {
            card
          })
        }
      })
    }),
  征兵令: (p, c, g) => binder()
    .for(c)
    .bind('post-enter', () => {
      相邻两侧(c, card => {
        const taked = []
        card.unit.forEach((unit, index) => {
          if (index % 3 === 0) {
            return
          }
          if (getUnit(unit).utyp === 'spbd') {
            return
          }
          taked.push(unit)
        })
        taked.forEach(unit => {
          card.take_unit(card.unit.indexOf(unit))
        })
        p.bus.emit('obtain-unit', {
          card: c,
          unit: taked
        })
      })
    }),
  恶火小队: (p, c, g) => binder()
    .for(c)
    .bind('round-end', 反应堆(c, g, '恶火'))
    .bind('round-end', 科挂(p, 2, () => 获得(c, '歌利亚', g ? 2 : 1)))
    .bind('fast-prod', () => 获得(c, '攻城坦克', 1)),
  空投地雷: (p, c, g) => binder()
    .for(p)
    .bind('card-enter', () => 获得(c, '寡妇雷', g ? 2 : 1))
    .for(c)
    .bind('fast-prod', () => 获得(c, '寡妇雷', g ? 3 : 2)),
  步兵连队: (p, c, g) => binder()
    .for(c)
    .bind('fast-prod', () => 获得(c, '劫掠者', g ? 5 : 3))
    .bind('round-end', 反应堆(c, g, '劫掠者')),
  飙车流: (p, c, g) => binder()
    .for(c)
    .bind('fast-prod', () => 获得(c, '秃鹫', g ? 5 : 3))
    .for(p)
    .bind('card-enter', 任务(c, 3, () => {
      左侧(c, card => {
        if (card.race === 'T') {
          p.bus.emit('upgrade-infr', {
            card
          })
        }
      })
    }, ({ card }) => {
      return card.race === 'T'
    })),
  科考小队: (p, c, g) => () => {
    let rn = null
    return binder()
    .for(c)
    .bind('post-enter', () => {
      相邻两侧(c, card => {
        if (card.race === 'T') {
          p.bus.emit('switch-infr', {
            card
          })
        }
      })
    })
    .for(p)
    .bind('refresh', 任务(c, 2, () => 获得(c, '歌利亚', g ? 2 : 1),
      () => true, renew => {
        rn = renew
      }))
    .for(c)
    .bind('round-end', rn)
  },
  陆军学院: (p, c, g) => binder()
    .for(c)
    .bind('fast-prod', () => 获得(c, '维京战机', g ? 5 : 3))
    .bind('round-end', 科挂(p, 3, () => 获得(c, '战狼', g ? 2 : 1))),
  空军学院: (p, c, g) => binder()
    .for(c)
    .bind('fast-prod', () => 获得(c, '维京战机', g ? 5 : 3))
    .for(p)
    .bind('task-done', () => 获得(c, '解放者', g ? 2 : 1)),
  交叉火力: (p, c, g) => binder()
    .for(c)
    .bind('fast-prod', () => 获得(c, '歌利亚', g ? 5 : 3))
    .bind('round-end', 科挂(p, 5, () => 获得(c, '攻城坦克', g ? 2 : 1))),
  斯台特曼: (p, c, g) => binder()
    .for(c)
    .bind('fast-prod', () => {
      相邻两侧(c, card => {
        ['歌利亚', '维京战机'].forEach(u => {
          const index = card.locate(u, g ? 2 : 1)
          if (index.length > 0) {
            p.bus.emit('transform-unit', {
              card,
              index,
              to: u + '(精英)'
            })
          }
        })
      })
    })
    .bind('post-enter', () => {
      左侧(c, card => {
        if (card.race === 'T') {
          p.bus.emit('upgrade-infr', {
            card
          })
        }
      })
    }),
  护航中队: (p, c, g) => binder()
    .for(c)
    .bind('fast-prod', () => 获得(c, '黄昏之翼', g ? 2 : 1))
    .for(p)
    .bind('card-enter', () => 获得(c, '怨灵战机', g ? 2 : 1)),
  泰凯斯: (p, c, g) => binder()
    .for(c)
    .bind('round-end', 反应堆(c, g, '陆战队员(精英)'))
    .bind('round-end', () => {
      p.enumPresent(card => {
        if (card.race === 'T') {
          ['陆战队员', '劫掠者'].forEach(u => {
            const index = card.locate(u, g ? 5 : 3)
            if (index.length > 0) {
              p.bus.emit('transform-unit', {
                card,
                index,
                to: u + '(精英)'
              })
            }
          })
        }
      })
    })
    .bind('round-end', () => 获得(c, '医疗运输机', g ? 2 : 1)),
  外籍军团: (p, c, g) => binder()
    .for(c)
    .bind('round-end', 反应堆(c, g, '牛头人陆战队员'))
    .bind('post-enter', () => {
      相邻两侧(c, card => {
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
          card.take_unit(card.unit.indexOf('陆战队员(精英)'))
        }
        while (nNorTran-- > 0) {
          card.take_unit(card.unit.indexOf('陆战队员'))
        }
        获得(card, '牛头人陆战队员', cnt)
      })
    }),
  钢铁洪流: (p, c, g) => binder()
    .for(c)
    .bind('fast-prod', () => 获得(c, '雷神', g ? 2 : 1))
    .bind('round-end', 科挂(p, 5, () => {
      p.enumPresent(card => {
        ['攻城坦克', '战狼'].forEach(u => {
          const index = card.locate(u, g ? 2 : 1)
          if (index.length > 0) {
            p.bus.emit('transform-unit', {
              card,
              index,
              to: u + '(精英)'
            })
          }
        })
      })
    })),
  游骑兵: (p, c, g) => binder()
    .for(g)
    .bind('switch-infr', ({ card }) => 获得(card, '雷诺(狙击手)', g ? 2 : 1))
    .bind('upgrade-infr', ({ card }) => 获得(card, '雷诺(狙击手)', g ? 2 : 1))
    .for(c)
    .bind('round-end', 反应堆(c, g, '雷诺(狙击手)')),
  沃菲尔德: (p, c, g) => binder()
    .for(p)
    .bind('card-sell', ({ selled }) => {
      p.flag.沃菲尔德 = p.flag.沃菲尔德 || 0
      if (selled.race === 'T') {
        if (p.flag.沃菲尔德 < (g ? 2 : 1)) {
          p.flag.沃菲尔德++
          p.bus.emit('obtain-unit', {
            card: c,
            unit: selled.unit.filter(u => getUnit(u).utyp !== 'spbd')
          })
        }
      }
    })
    .for(c)
    .bind('round-end', () => {
      p.enumPresent(card => {
        const index = card.locate('陆战队员(精英)', g ? 2 : 1)
        if (index.length > 0) {
          p.bus.emit('transform-unit', {
            card,
            index,
            to: '帝盾卫兵'
          })
        }
      })
    }),
  帝国舰队: (p, c, g) => {
    let rn = null
    return binder()
    .for(p)
    .bind('card-sell', 任务(c, 3, () => {
        获得(c, '战列巡航舰', g ? 2 : 1)
        rn()
      }, () => true, renew => { rn = renew }))
    .for(c)
    .bind('round-end', 科挂(p, 4, () => 获得(c, '黄昏之翼', g ? 4 : 2)))
  }
}