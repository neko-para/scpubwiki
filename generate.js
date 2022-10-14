import { parse } from '@ltd/j-toml'
import fs from 'fs/promises'

async function readTOML (path) {
  const buf = await fs.readFile(path)
  return parse(buf, 1, "\n", false)
}

function splitDesc (str) {
  const d1 = [], d3 = []
  str.split(/(?={\d,\d})|(?<={\d,\d})/).forEach(node => {
    if (node[0] === '{') {
      d1.push(node[1])
      d3.push(node[3])
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
  obj.card.forEach(c => {
    const m = /^([A-Z])(\d)(.+)$/.exec(c.name)
    c.race = m[1]
    c.level = Number(m[2])
    c.name = m[3]

    const nunit = {}
    c.unit.split(/\s*,\s*/).forEach(s => {
      const mm = /^(\d+)(\D+)$/.exec(s)
      nunit[mm[2]] = Number(mm[1])
    })
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
  obj.card.forEach(t => {
    const m = /^([A-Z])(.+)$/.exec(t.name)
    t.race = m[1]
    t.name = m[3]
  })
}
async function read (path) {
  const obj = await readTOML(path)
  processCards(obj)
  processTerms(obj)
  return obj.card
}

async function main () {
  for (const d of await fs.readdir('./data')) {
    if (!d.endsWith('.toml')) {
      continue
    }
    console.log(await read(`./data/${d}`))
  }
}

main()
