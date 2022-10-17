import AhoCorasick from 'ahocorasick'
import raw from './pubdata.js'
const { card, term, unit, upgrade, attr: a, tr: t, info: _i, upgradeCategory: uc } = raw

export const attr = a
export const tr = t
export const info = _i
export const upgradeCategory = uc
export const data = {}

function putIndex (entry) {
  if (entry.name in data) {
    const old = data[entry.name]
    if (old.type === 'disa') {
      old[entry.type] = entry
    } else {
      data[entry.name] = {
        type: 'disa',
      }
      data[entry.name][old.type] = old
      data[entry.name][entry.type] = entry
    }
  } else {
    data[entry.name] = entry
  }
}

[card, term, unit, upgrade].forEach(es => {
  es.forEach(putIndex)
})

const searcher = new AhoCorasick(Object.keys(data))

function splitTextPiece (text) {
  let result = searcher.search(text)
    .map(res => {
      let r = ''
      res[1].forEach(s => {
        if (s.length > r.length) {
          r = s
        }
      })
      return {
        start: res[0] - r.length + 1,
        end: res[0],
        word: r
      }
    })
  result.sort((a, b) => b.end - a.end)
  for (let i = 0; i < result.length; i++) {
    if (result[i].drop) {
      continue
    }
    const outer = result[i]
    for (let j = i + 1; j < result.length; j++) {
      if (!(result[j].drop) && outer.start <= result[j].start && result[j].end <= outer.end) {
        result[j].drop = true
      }
    }
  }
  result = result.filter(r => !r.drop)
  result.sort((a, b) => a.end - b.end)

  let ps = 0
  const secs = []
  result.forEach(res => {
    if (ps < res.start) {
      secs.push({
        t: 'str',
        s: text.substring(ps, res.start)
      })
    }
    secs.push({
      t: 'ref',
      s: res.word
    })
    ps = res.end + 1
  })
  if (ps < text.length) {
    secs.push({
      t: 'str',
      s: text.substring(ps)
    })
  }
  return secs
}

export function splitText (text) {
  const result = []
  text.split(/(?=<.+?>)|(?<=<.+?>)/).forEach(s => {
    const m = /<(.+?)>/.exec(s)
    if (m) {
      result.push(...splitTextPiece(m[1]).map(n => {
        n.m = true
        return n
      }))
    } else {
      result.push(...splitTextPiece(s))
    }
  })
  return result
}

export function getUnit (key) {
  const d = data[key]
  if (!d) {
    console.log(key)
    return null
  }
  if (d.type === 'disa') {
    return d['unit'] || null
  } else if (d.type === 'unit') {
    return d
  } else {
    return null
  }
}
