import { Card } from "../data/pubdata.d"
import { getCard, data } from "../data"

const poolCount = {
  1: 18,
  2: 15,
  3: 13,
  4: 11,
  5: 9,
  6: 6,
}

export class Pool {
  pool: Card[]

  constructor() {
    this.pool = []
    for (const k in data) {
      const c = getCard(k)
      if (c) {
        if (c.attr?.rare) {
          if (Math.random() <= 0.15) {
            this.pool.push(c)
          }
        } else {
          this.pool.push(...Array(poolCount[c.level]).fill(c))
        }
      }
    }
  }
}
