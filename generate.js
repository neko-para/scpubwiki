import { parse } from '@ltd/j-toml'
import fs from 'fs/promises'

async function readTOML (path) {
  const buf = await fs.readFile(path)
  return parse(buf, 1, "\n", false)
}

function splitDesc (str) {
  const d1 = [], d3 = []
  str.split(/(?={\d+,\d+})|(?<={\d+,\d+})/).forEach(node => {
    if (node[0] === '{') {
      const m = /{(\d+),(\d+)}/.exec(node)
      d1.push(m[1])
      d3.push(m[2])
    } else {
      d1.push(node)
      d3.push(node)
    }
  })
  return [ d1.join(''), d3.join('') ]
}

function unpackDesc (desc, funcs) {
  let pat = funcs[desc[0].substring(1)]
  for (let i = 1; i < desc.length; i++) {
    pat = pat.replace(new RegExp(`\\\$${i}`, 'g'), desc[i])
  }
  return splitDesc(pat)
}

function processCards (obj) {
  if (!obj.card) {
    return
  }
  obj.card.forEach(c => {
    const m = /^(\d)(.+)$/.exec(c.name)
    c.type = 'card'
    c.race = c.race || obj.race
    c.level = Number(m[1])
    c.name = m[2]

    const nunit = {}
    if (c.unit !== '') {
      c.unit.split(/\s*,\s*/).forEach(s => {
        const mm = /^(\d+)(\D+)$/.exec(s)
        nunit[mm[2]] = Number(mm[1])
      })
    }
    c.unit = nunit

    const ndesc = []
    c.desc.forEach(d => {
      if (typeof(d) === 'string') {
        ndesc.push(splitDesc(d))
      } else if (d instanceof Array) {
        if (d[0][0] === '@') {
          ndesc.push(unpackDesc(d, obj.function))
        } else {
          ndesc.push(d)
        }
      }
    })
    c.desc = ndesc
  })
}

function processTerms (obj) {
  if (!obj.term) {
    return
  }
  obj.term.forEach(t => {
    t.type = 'term'
    t.race = t.race || obj.race
  })
}

function processUnits (obj) {
  if (!obj.unit) {
    return
  }
  obj.unit.forEach(u => {
    u.type = 'unit'
    u.race = u.race || obj.race
  })
}

function processUpgrades (obj) {
  if (!obj.upgrade) {
    return
  }
  obj.upgrade.forEach(u => {
    u.type = 'upgrade'
  })
}

async function read (path) {
  const obj = await readTOML(path)
  processCards(obj)
  processTerms(obj)
  processUnits(obj)
  processUpgrades(obj)
  return {
    card: obj.card || [],
    term: obj.term || [],
    unit: obj.unit || [],
    attr: obj.attr || {
      $order: []
    },
    upgrade: obj.upgrade || [],
    upgradeCategory: obj.upgradeCategory || {
      $order: []
    },
    info: obj.info || {},
    tr: obj.tr || {}
  }
}

async function main () {
  const result = {
    card: [],
    term: [],
    unit: [],
    attr: {
      $order: []
    },
    upgrade: [],
    upgradeCategory: {
      $order: []
    },
    info: {},
    tr: {}
  }
  for (const d of await fs.readdir('./data')) {
    if (!d.endsWith('.toml')) {
      continue
    }
    const { card, term, unit, attr, upgrade, upgradeCategory, info, tr } = await read(`./data/${d}`)
    result.card.push(...card)
    result.term.push(...term)
    result.unit.push(...unit)
    result.attr.$order.push(...attr.$order)
    delete attr.$order
    result.attr = {
      ...result.attr,
      ...attr
    }
    result.upgrade.push(...upgrade)
    result.upgradeCategory.$order.push(...upgradeCategory.$order)
    delete upgradeCategory.$order
    result.upgradeCategory = {
      ...result.upgradeCategory,
      ...upgradeCategory
    }
    result.info = {
      ...result.info,
      ...info
    }
    result.tr = {
      ...result.tr,
      ...tr
    }
  }
  await fs.writeFile("./src/pubdata.js", `export default ${JSON.stringify(result, null, 2)}`)
}

main()
