import { Player, CardInstance } from "."
import { Card } from "../data/types"
import { Binder } from "./util"

export type Description = {
  [key: string]: (
    player: Player,
    card: CardInstance,
    gold: boolean,
    announce: (msg: string) => Promise<void>
  ) => Binder
}

export type BusInfo = {
  "obtain-unit": {
    card: CardInstance
    unit: string[]
  }
  "transform-unit": {
    card: CardInstance
    index: number[]
    to: string
  }
  "fast-prod": {
    card: CardInstance
  }
  "switch-infr": {
    card: CardInstance
  }
  "upgrade-infr": {
    card: CardInstance
  }
  "task-done": {
    card: CardInstance
  }
  "wrap-in": {
    card: CardInstance
    unit: string[]
  }
  regroup: {
    card: CardInstance
    id: number
  }
  inject: {
    card: CardInstance
    unit: string[]
  }
  incubate: {
    card: CardInstance
    unit: string[]
  }
  "incubate-into": {
    card: CardInstance
    unit: string[]
  }
  "card-enter": {
    card: CardInstance
  }
  "post-enter": {
    card: CardInstance
  }
  "card-selled": {
    card: CardInstance
  }
  "card-combined": {
    card: CardInstance
  }

  "upgrade-pub": {}
  refresh: {}
  "round-start": {}
  "round-end": {}
  "sell-card": {
    selled: CardInstance
  }
  "destroy-card": {
    destroyed: CardInstance
  }
  "discover-card": {
    filter: (card: Card) => boolean
  }
  wrap: {
    unit: string[]
    info: {
      to: CardInstance | null
    }
  }
  "regroup-count": {
    info: {
      count: number
    }
  }
}
