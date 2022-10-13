import General from './General/term.js'
import Terran from './Terran/term.js'
import Protoss from './Protoss/term.js'
import Zerg from './Zerg/term.js'
import Middle from './Middle/term.js'

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
