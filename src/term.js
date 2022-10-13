import General from './data/General/term.js'
import Terran from './data/Terran/term.js'
import Protoss from './data/Protoss/term.js'
import Zerg from './data/Zerg/term.js'
import Middle from './data/Middle/term.js'

const res = {
  data: {
    G: General,
    T: Terran,
    P: Protoss,
    Z: Zerg,
    M: Middle
  }
}

res.whichRace = key => {
  for (const k in res.data) {
    if (key in res.data[k]) {
      return k
    }
  }
  return ''
}

export default res
