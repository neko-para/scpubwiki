import { Card } from '../data/types'
import { Cards, getCard } from '../data'

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
    Cards.forEach(c => {
      if (c.attr?.rare) {
        if (Math.random() <= 0.15) {
          this.pool.push(c)
        }
      } else {
        this.pool.push(
          ...Array(poolCount[c.level as 1 | 2 | 3 | 4 | 5 | 6]).fill(c)
        )
      }
    })
  }
}
