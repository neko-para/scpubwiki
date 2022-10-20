export function shuffle (array) {
  for (let i = array.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array
}

export function $ () {
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
        this.bus.off(ev, func)
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

export function 获得 (card, unit) {
  if (unit.length === 0) {
    return
  }
  return card.player.bus.async_emit('obtain-unit', {
    card,
    unit
  })
}

export function 获得N (card, unit, number) {
  return 获得(card, Array(number).fill(unit))
}

export function 转换 (card, index, to) {
  if (index.length === 0) {
    return
  }
  return p.bus.async_emit('transform-unit', {
    card,
    index,
    to
  })
}

export async function 左侧 (card, func) {
  if (card.pos > 0 && card.player.present[card.pos - 1]) {
    await func(card.player.present[card.pos - 1])
    return true
  } else {
    return false
  }
}

export async function 右侧 (card, func) {
  if (card.pos < 6 && card.player.present[card.pos + 1]) {
    await func(card.player.present[card.pos + 1])
    return true
  } else {
    return false
  }
}

export async function 相邻两侧 (card, func) {
  await 左侧(card, func)
  await 右侧(card, func)
}
