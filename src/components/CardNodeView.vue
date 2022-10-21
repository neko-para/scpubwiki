<script setup>
import { ref } from 'vue'
import ReferText from './ReferText.vue'
import { getUnit, attr, attr$order, tr } from '../../data'

const props = defineProps({
  node: Object,
  bref: Boolean
})

const isGold = ref(false)

function attrOf (node) {
  const a = []
  if (!node.attr) {
    return a
  }
  attr$order.forEach(at => {
    if (at in node.attr) {
      a.push(at)
    }
  })
  return a
}

function brefTexts () {
  const t = []
  t.push(Object.keys(props.node.unit)
    .map(k => `${k} ${props.node.unit[k]}`).join(' '))
  attrOf(props.node).forEach(a => {
    t.push(attr[a])
  })
  props.node.desc.forEach(d => {
    t.push(d[isGold.value ? 1 : 0])
  })
  if (props.node.rmrk) {
    t.push(props.node.rmrk)
  }
  return t
}

function calcValue () {
  let sum = 0
  for (const k in props.node.unit) {
    if (!getUnit(k)) {
      console.log(k)
    }
    sum += getUnit(k).value * props.node.unit[k]
  }
  return sum
}

</script>

<template>
  <v-card-title>
    <span class="text-h5">
      {{ node.name }} {{ tr[node.race] }} {{ node.level }}
    </span>
  </v-card-title>
  <v-divider></v-divider>
  <template v-if="bref">
    <template v-for="(s, i) in brefTexts()" :key="`Bref-${i}`">
      <v-divider v-if="i > 0"></v-divider>
      <v-card-text>
        <refer-text :text="s"></refer-text>
      </v-card-text>
    </template>
  </template>
  <template v-else>
    <v-card-title>
      单位
    </v-card-title>
    <v-card-text>
      <v-chip>
        <refer-text :text="`总价值 ${calcValue()}`"></refer-text>
      </v-chip>
      <v-chip v-for="(n, k) in node.unit" :key="`Unit-${k}`">
        <refer-text :text="`${k} ${n}`"></refer-text>
      </v-chip>
    </v-card-text>
    <v-divider></v-divider>
    <v-card-title>
      卡面描述
      <v-switch class="float-right" v-model="isGold" :disabled="node.attr?.gold" color="primary" label="三连" hide-details dense></v-switch>
    </v-card-title>
    <v-card-text v-if="node.attr || node.desc.length > 0">
      <v-card elevation="5">
        <template v-for="(at, idx) in attrOf(node)" :key="`Attr-${idx}`">
          <v-divider v-if="idx > 0"></v-divider>
          <v-card-text>
            <refer-text :text="attr[at]"></refer-text>
          </v-card-text>
        </template>
        <v-divider v-if="Object.keys(node.attr || {}).length > 0 && node.desc.length > 0"></v-divider>
        <template v-for="(desc, idx) in node.desc" :key="`Desc-${idx}`">
          <v-divider v-if="idx > 0"></v-divider>
          <v-card-text>
            <refer-text :text="desc[isGold ? 1 : 0]"></refer-text>
          </v-card-text>
        </template>
      </v-card>
    </v-card-text>
    <template v-if="node.rmrk">
      <v-divider></v-divider>
      <v-card-title>
        备注
      </v-card-title>
      <v-card-text>
        <refer-text :text="node.rmrk"></refer-text>
      </v-card-text>
    </template>
  </template>
  <template v-if="node.pack !== '核心'">
    <v-divider></v-divider>
    <v-card-text>
      来自拓展包: {{ node.pack }}
    </v-card-text>
  </template>
</template>
