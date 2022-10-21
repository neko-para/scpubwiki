import { Player, CardInstance } from "."
import { Binder } from "./util"

export type Description = {
  [key: string]: (
    player: Player,
    card: CardInstance,
    gold: boolean,
    announce: (msg: string) => Promise<void>
  ) => Binder
}
