import { Emitter } from "../async-emitter"
import { Card, PossibleKey, SplitResultRefer } from "../data"

const bus = new Emitter<{
  request: {
    node: SplitResultRefer
  }
  "request-close": {
    name: PossibleKey
  }
  "add-to-hand": {
    card: Card
  }
}>()

export default bus
