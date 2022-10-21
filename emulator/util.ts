import { AsyncEmitter } from "../async-emitter"
import { CardInstance } from "."
import { BusInfo } from "./types"

export function shuffle(array: any[]) {
  for (let i = array.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
  return array
}

export class Binder {
  clf: {
    (): void
  }[]
  bus: AsyncEmitter<BusInfo> | null

  constructor() {
    this.clf = []
    this.bus = null
  }

  for(t: { bus: AsyncEmitter<BusInfo> }) {
    this.bus = t.bus
    return this
  }

  bind<K extends keyof BusInfo & string>(
    ev: K,
    func: (param: BusInfo[K]) => Promise<void>
  ) {
    this.bus?.on(ev, func)
    this.clf.push(() => {
      this.bus?.off(ev, func)
    })
    return this
  }

  clear() {
    return () => {
      this.clf.forEach(f => f())
    }
  }
}

export function $() {
  return new Binder()
}

export async function 获得(card: CardInstance, unit: string[]) {
  if (unit.length === 0) {
    return
  }
  await card.player.bus.async_emit("obtain-unit", {
    card,
    unit,
  })
}

export function 获得N(card: CardInstance, unit: string, number: number) {
  return 获得(card, Array(number).fill(unit))
}

export async function 转换(card: CardInstance, index: number[], to: string) {
  if (index.length === 0) {
    return
  }
  await card.player.bus.async_emit("transform-unit", {
    card,
    index,
    to,
  })
}

export function 摧毁(card: CardInstance) {
  return card.player.bus.async_emit("destroy-card", {
    destroyed: card,
  })
}

export async function 左侧(
  card: CardInstance,
  func: (card: CardInstance) => Promise<void>
) {
  if (card.pos > 0) {
    const c = card.player.present[card.pos - 1]
    if (c) {
      await func(c)
      return true
    }
  }
  return false
}

export async function 右侧(
  card: CardInstance,
  func: (card: CardInstance) => Promise<void>
) {
  if (card.pos < 6) {
    const c = card.player.present[card.pos + 1]
    if (c) {
      await func(c)
      return true
    }
  }
  return false
}

export async function 相邻两侧(
  card: CardInstance,
  func: (card: CardInstance) => Promise<void>
) {
  await 左侧(card, func)
  await 右侧(card, func)
}
