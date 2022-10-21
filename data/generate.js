import { parse } from "@ltd/j-toml"
import fs from "fs/promises"

async function readTOML(path) {
  const buf = await fs.readFile(path)
  return parse(buf, 1, "\n", false)
}

function splitDesc(str) {
  const d1 = []
  const d3 = []
  str.split(/(?={.*?\|.*?})|(?<={.*?\|.*?})/).forEach(node => {
    const m = /{(.*?)\|(.*?)}/.exec(node)
    if (m) {
      if (m[1].length > 0) {
        d1.push(`<${m[1]}>`)
      }
      if (m[2].length > 0) {
        d3.push(`<${m[2]}>`)
      }
    } else {
      d1.push(node)
      d3.push(node)
    }
  })
  return [d1.join(""), d3.join("")]
}

function unpackDesc(desc, funcs) {
  let pat = funcs[desc[0].substring(1)]
  for (let i = 1; i < desc.length; i++) {
    pat = pat.replace(new RegExp(`\\\$${i}`, "g"), desc[i])
  }
  return splitDesc(pat)
}

function processCards(obj) {
  if (!obj.card) {
    return
  }
  obj.card.forEach(c => {
    const m = /^(\d)(.+)$/.exec(c.name)
    c.type = "card"
    c.pack = c.pack || obj.pack
    c.race = c.race || obj.race
    if (!("pool" in c)) {
      if ("pool" in obj) {
        c.pool = obj.pool
      } else {
        c.pool = true
      }
    }
    c.level = Number(m[1])
    c.name = m[2]

    const nunit = {}
    if (c.unit !== "") {
      c.unit.split(/\s*,\s*/).forEach(s => {
        const mm = /^(\d+)(\D+)$/.exec(s)
        nunit[mm[2]] = Number(mm[1])
      })
    }
    c.unit = nunit

    const ndesc = []
    c.desc.forEach(d => {
      if (typeof d === "string") {
        ndesc.push(splitDesc(d))
      } else if (d instanceof Array) {
        if (d[0][0] === "@") {
          ndesc.push(unpackDesc(d, obj.function))
        } else {
          console.log(d)
          ndesc.push(d)
        }
      }
    })
    c.desc = ndesc
  })
}

function processTerms(obj) {
  if (!obj.term) {
    return
  }
  obj.term.forEach(t => {
    t.type = "term"
    t.race = t.race || obj.race
  })
}

function processUnits(obj) {
  if (!obj.unit) {
    return
  }
  obj.unit.forEach(u => {
    u.type = "unit"
    u.race = u.race || obj.race
    u.utyp = u.utyp || "normal"
    if (u.shield && !u.sarmor) {
      u.sarmor = {
        name: "星灵等离子护盾",
        defense: 0,
      }
    }
    if ("tag" in u) {
      // currently not all unit finished
      u.tag = u.tag
        .split(",")
        .map(x => x.trim())
        .filter(x => x)
      u.weapon = u.weapon || []
      u.weapon.forEach(w => {
        if (typeof w.damage === "string") {
          w.damage = w.damage.replace(/(\d+), (\D+)(\d+)/, "$1, vs $2 $3")
        }
      })
    }
  })
}

function processUpgrades(obj) {
  if (!obj.upgrade) {
    return
  }
  obj.upgrade.forEach(u => {
    u.type = "upgrade"
  })
}

async function read(path) {
  const obj = await readTOML(path)
  obj.pack = obj.pack || "核心"
  processCards(obj)
  processTerms(obj)
  processUnits(obj)
  processUpgrades(obj)
  return {
    card: obj.card || [],
    term: obj.term || [],
    unit: obj.unit || [],
    attr: obj.attr || {},
    attr$order: obj.attr$order || [],
    upgrade: obj.upgrade || [],
    upgradeCategory: obj.upgradeCategory || {},
    upgradeCategory$order: obj.upgradeCategory$order || [],
    info: obj.info || {},
    tr: obj.tr || {},
  }
}

async function main() {
  const result = {
    card: [],
    term: [],
    unit: [],
    attr: {},
    attr$order: [],
    upgrade: [],
    upgradeCategory: {},
    upgradeCategory$order: [],
    info: {},
    tr: {},
  }
  for (const d of await fs.readdir("./data")) {
    if (!d.endsWith(".toml")) {
      continue
    }
    const {
      card,
      term,
      unit,
      attr,
      attr$order,
      upgrade,
      upgradeCategory,
      upgradeCategory$order,
      info,
      tr,
    } = await read(`./data/${d}`)
    result.card.push(...card)
    result.term.push(...term)
    result.unit.push(...unit)
    result.attr$order.push(...attr$order)
    result.attr = {
      ...result.attr,
      ...attr,
    }
    result.upgrade.push(...upgrade)
    result.upgradeCategory$order.push(...upgradeCategory$order)
    result.upgradeCategory = {
      ...result.upgradeCategory,
      ...upgradeCategory,
    }
    result.info = {
      ...result.info,
      ...info,
    }
    result.tr = {
      ...result.tr,
      ...tr,
    }
  }
  await fs.writeFile(
    "data/pubdata.ts",
    `import { Data } from "./pubdata.d"\nconst data: Data = ${JSON.stringify(
      result,
      null,
      2
    )}\nexport default data\n`
  )
}

main()
