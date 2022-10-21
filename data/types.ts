export type Race = "T" | "P" | "Z" | "N" | "G"
export type Pack =
  | "核心"
  | "天空之怒"
  | "并肩作战"
  | "拉克希尔"
  | "短兵相接"
  | "快速启动"
  | "独辟蹊径"
  | "军备竞赛"
type UnitType = "normal" | "spbd" | "spun"
type UpgradeCategory = "S" | "3" | "T" | "P" | "Z" | "C" | "V" | "O"

export interface Card {
  name: string
  type: "card"
  race: Race
  level: number
  pack: Pack
  pool: boolean
  unit: Record<string, number>
  desc: [string, string][]
  banner?: string
  attr?: {
    rare?: boolean
    gold?: boolean
    insert?: boolean
    origin?: boolean
    dark?: boolean
    void?: boolean
  }
  rmrk?: string
}

export interface Term {
  name: string
  type: "term"
  race: Race
  bref: string
  extr?: string
}

interface Weapon {
  name: string
  damage: number | string
  multiple?: number
  range: number | "melee" | "未知"
  speed: number | "未知"
  target: "G" | "A" | "GA"
}

interface Armor {
  name: string
  defense: number
  speed?: number | string
}

interface SArmor {
  name: string
  defense: number
}

export interface Unit {
  name: string
  type: "unit"
  race: Race
  utyp: UnitType
  value: number

  tag?: string[]
  health?: number
  shield?: number
  power?: number
  weapon?: Weapon[]
  armor?: Armor
  sarmor?: SArmor

  bref?: string
  rmrk?: string
}

export interface Upgrade {
  name: string
  type: "upgrade"
  novr?: true
  cate: UpgradeCategory
  desc: string
  rmrk?: string
}

export interface Data {
  card: Card[]
  term: Term[]
  unit: Unit[]
  attr: {
    [key: string]: string
  }
  attr$order: string[]
  upgrade: Upgrade[]
  upgradeCategory: {
    [key: string]: string
  }
  upgradeCategory$order: string[]
  info: Record<string, string[]>
  tr: Record<string, string>
}
