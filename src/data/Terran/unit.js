const str = `
收割者 100
恶火 100
陆战队员 50
响尾蛇 250
医疗兵 125
歌利亚 200
陆战队员(精英) 125
秃鹫 75
寡妇雷 100
劫掠者 125
医疗运输机 200
飓风 250
铁鸦 300
`

export default str.split('\n').filter(s => s)
                  .map(s => s.split(' '))
                  .map(([name, value]) => ({ name, value }))