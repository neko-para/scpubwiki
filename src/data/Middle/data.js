function 供养(count, unit) {
  return () => `<供养>(${count})：${unit}`
}

function 原始(unit, count) {
  return g => `每回合结束时，获得${g ? 2 : 1}${unit}和${g ? 4 : 2}精华`
}

function 黑暗(unit, count) {
  return g => `获得<黑暗值>时，获得${count(g)}${unit}`
}

function 复活(count) {
  return () => `${count}<黑暗值>时单位<复活>1次`
}

export default [
  {
    name: '原始蟑螂',
    race: 'M',
    level: 1,
    attr: {
      origin: true
    },
    unit: {
      原始蟑螂: 4,
      精华: 3
    },
    desc: [
      供养(1, '原始蟑螂')
    ]
  },
  {
    name: '不死队',
    race: 'M',
    level: 1,
    attr: {
      dark: true
    },
    unit: {
      不死队: 4
    },
    desc: [
      黑暗('不死队', g => g ? 2 : 1),
      复活(8)
    ]
  },
  {
    name: '紧急部署',
    race: 'M',
    level: 2,
    unit: {
      自动机炮: 4,
      修理无人机: 1
    },
    desc: []
  },
  {
    name: '原始刺蛇',
    race: 'M',
    level: 2,
    attr: {
      origin: true
    },
    unit: {
      原始刺蛇: 7
    },
    desc: [
      供养(1, '原始刺蛇'),
      原始('原始刺蛇')
    ]
  },
  {
    name: '原始异龙',
    race: 'M',
    level: 3,
    attr: {
      origin: true
    },
    unit: {
      原始异龙: 4
    },
    desc: [
      g => `任意卡牌<进场>时，相邻右侧卡牌获得${g ? 2 : 1}精华`,
      () => '每回合结束时，若晶体矿数量≥1，则摧毁所有卡牌中的精华，每摧毁2精华，获得1原始异龙'
    ]
  },
  {
    name: '虚空大军',
    race: 'M',
    level: 3,
    attr: {
      void: true
    },
    unit: {
      歌利亚: 1,
      刺蛇: 1,
      龙骑士: 1
    },
    desc: [
      g => `每回合结束时，如果你拥有人族卡牌，则获得${g ? 2 : 1}歌利亚；如果你拥有虫族卡牌，则获得${g ? 2 : 1}刺蛇；如果你拥有神族卡牌，则获得${g ? 2 : 1}龙骑士`
    ]
  },
  {
    name: '鲜血猎手',
    race: 'M',
    level: 3,
    attr: {
      dark: true
    },
    unit: {
      鲜血猎手: 6,
      浩劫: 1
    },
    desc: [
      黑暗('鲜血猎手', g => g ? 2 : 1),
      复活(5)
    ]
  },
  {
    name: '暴掠龙',
    race: 'M',
    level: 3,
    attr: {
      origin: true
    },
    unit: {
      暴掠龙: 2
    },
    desc: [
      供养(1, '暴掠龙'),
      原始('暴掠龙')
    ]
  },
  {
    name: '适者生存',
    race: 'M',
    level: 4,
    unit: {
      亚格卓拉: 1
    },
    desc: [
      g => `每回合结束时，将场上随机${g ? 8 : 5}个生物单位<精英化>`
    ],
    remark: '游戏内原文为 变为精英单位，此处修正为通用用语'
  },
  {
    name: '毁灭者',
    race: 'M',
    level: 4,
    attr: {
      dark: true
    },
    unit: {
      毁灭者: 3
    },
    desc: [
      g => `<出售>时，相邻左侧卡牌获得等于<黑暗值>-1数量的毁灭者(不超过${g ? 30 : 10})`
    ]
  },
  {
    name: '原始点火虫',
    race: 'M',
    level: 4,
    attr: {
      origin: true
    },
    unit: {
      原始点火虫: 4,
      精华: 2
    },
    desc: [
      () => '每回合结束时，补充原始点火虫至精华数量的两倍，最多补充到20'
    ]
  },
  {
    name: '原始雷兽',
    race: 'M',
    level: 4,
    attr: {
      origin: true
    },
    unit: {
      原始雷兽: 3
    },
    desc: [
      供养(4, '原始雷兽'),
      g => `每回合结束时，获得${g ? 2 : 1}原始雷兽并除自身外，每有1张中立卡牌获得1精华`
    ]
  },
  {
    name: '马拉什',
    race: 'M',
    level: 5,
    unit: {
      马拉什: 1
    },
    desc: [
      () => '每回合结束时，相邻两侧卡牌获得<虚空投影>增益'
    ],
    remark: '染黑'
  },
  {
    name: '黑暗预兆',
    race: 'M',
    level: 5,
    attr: {
      void: true
    },
    unit: {
      混合体毁灭者: 3
    },
    desc: [
      g => `每回合结束时，若场上有4个种族的卡牌，则获得${g ? 4 : 2}混合体毁灭者`
    ]
  },
  {
    name: '阿拉纳克',
    race: 'M',
    level: 5,
    unit: {
      阿拉纳克: 1
    },
    desc: [
      () => '<进场>时，<夺取>除去自身随机两张卡牌，保留升级'
    ],
    remark: '不保留<虚空投影>增益\n会依次随机选取两张卡牌(不一定是从左到右)<夺取>，超过补给的单位被摧毁，超过升级数量限制的升级被舍弃'
  },
  {
    name: '天罚行者',
    race: 'M',
    level: 5,
    attr: {
      dark: true
    },
    unit: {
      天罚行者: 2
    },
    desc: [
      () => `<进场>时，夺取4星及以下所有卡牌的<黑暗值>，每夺取5点获得1天罚行者`,
      g => `每回合结束时，每有10<黑暗值>，获得${g ? 2 : 1}天罚行者，最多获得${g ? 4 : 2}`
    ]
  },
  {
    name: '德哈卡',
    race: 'M',
    level: 5,
    attr: {
      origin: true
    },
    unit: {
      德哈卡: 1,
      德哈卡分身: 3
    },
    desc: [
      g => `任意卡牌<出售>时，若其中精华≥3，获得${g ? 4 : 2}德哈卡分身`,
      () => `<唯一>：每回合结束时，若晶体矿数量≥1，下回合<发现>一张星级低于5星的<原始虫群>卡牌`
    ]
  },
  {
    name: '我叫小明',
    race: 'M',
    level: 6,
    attr: {
      insert: true
    },
    unit: {
      尤尔兰: 1
    },
    banner: '第三届寿仙杯冠军：我叫小明\n作为极低概率出现的卡牌',
    desc: [
      () => '<进场>时，复制左侧相邻1-6星卡牌到暂存区',
      () => '<出售>时，左侧相邻卡牌获得<星空加速>升级'
    ]
  },
  {
    name: '豆浆油条KT1',
    race: 'M',
    level: 6,
    attr: {
      insert: true
    },
    unit: {
      武装机器人: 1
    },
    banner: '第二届寿仙杯冠军：豆浆油条\n作为极低概率出现的卡牌',
    desc: [
      () => '<进场>时，此卡牌和相邻卡牌获得随机升级'
    ]
  },
  {
    name: '豆浆油条',
    race: 'M',
    level: 6,
    unit: {
      赛兰迪丝: 1
    },
    banner: '第一届寿仙杯冠军：豆浆油条\n作为极低概率出现的卡牌',
    desc: [
      () => '每回合结束时，右侧所有卡牌获得<虚空投影>增益'
    ]
  },
  {
    name: '战斗号角',
    race: 'M',
    level: 6,
    unit: {
      '虚空辉光舰(精英)': 4
    },
    banner: '酒馆官方社区平台：号角\n作为极低概率出现的卡牌',
    desc: [
      () => '任意六星以下卡牌<出售>时，获得其中价值最高的单位'
    ]
  },
  {
    name: '凯瑞甘',
    race: 'M',
    level: 6,
    attr: {
      gold: true,
      insert: true
    },
    unit: {
      '莎拉·凯瑞甘': 1
    },
    desc: [
      () => '<进场>时，吞噬左侧卡牌所有单位，获得这些单位150%的生命和护盾值',
      () => '<进场>时，若两张凯瑞甘相邻，合并为<刀锋女王>'
    ],
    remark: '本体的生命值只有1点\n被吞噬的卡牌视为被摧毁\n合并的女王位于先<进场>的凯瑞甘处\n虽然吞噬效果写在合并效果之前，但是<进场>时若能合并则不会吞噬左侧卡牌'
  },
  {
    name: '虚空构造体',
    race: 'M',
    level: 6,
    attr: {
      insert: true,
      void: true
    },
    unit: {
      虚空构造体: 1
    },
    desc: [
      g => `<唯一>：在场时，<虚空投影>获得额外${g ? 40 : 20}%加成`
    ]
  }
]