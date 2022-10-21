import { Player, CardInstance } from "."
import { Card, CardKey, UnitKey } from "../data"
import { Binder } from "./util"

export type DescriptionGen = (
  player: Player,
  card: CardInstance,
  gold: boolean,
  announce: (msg: string) => Promise<void>
) => Binder

export type Description = {
  [key in CardKey]?: DescriptionGen
}

export type BusInfo = {
  "obtain-unit": {
    card: CardInstance
    unit: UnitKey[]
  }
  "transform-unit": {
    card: CardInstance
    index: number[]
    to: UnitKey
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
    unit: UnitKey[]
  }
  regroup: {
    card: CardInstance
    id: number
  }
  inject: {
    card: CardInstance
    unit: UnitKey[]
  }
  incubate: {
    card: CardInstance
    unit: UnitKey[]
  }
  "incubate-into": {
    card: CardInstance
    unit: UnitKey[]
  }
  "gain-darkness": {
    card: CardInstance
    darkness: number
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
    unit: UnitKey[]
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
