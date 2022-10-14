<script setup>
import { ref, computed } from 'vue'
import NodeView from './NodeView.vue'
import NodeList from './NodeList.vue'
import { data } from '../data.js'
import raw from '../pubdata.js'
const { attr, info, tr } = raw

const categorySelector = ref('card')
const races = info.race.split('')
const raceSelector = ref('none')
const starTick = {}
for (let i = 0; i <= 7; i++) {
  starTick[i] = String(i)
}
const starRange = ref([0, 7])
const attrSelector = ref('none')

const searchResult = computed(() => {
  const res = []
  for (const k in data) {
    let d = data[k]
    if (d.type === 'disa' && categorySelector.value in d) {
      d = d[categorySelector.value]
    }
    if (d.type !== categorySelector.value) {
      continue
    }
    if (raceSelector.value !== d.race && raceSelector.value !== 'none') {
      continue
    }
    if (d.type === 'card') {
      if (starRange.value[0] > d.level || starRange.value[1] < d.level) {
        continue
      }
      if (attrSelector.value !== 'none' && !(d.attr && attrSelector.value in d.attr)) {
        continue
      }
    }
    res.push(d)
  }
  return res
})

</script>

<template>
  <NodeList :nodes="searchResult">
    <v-card>
      <v-card-text>
        <v-radio-group v-model="categorySelector" inline hide-details>
          <v-radio value="card" label="卡牌"></v-radio>
          <v-radio value="unit" label="单位"></v-radio>
          <v-radio value="term" label="术语"></v-radio>
        </v-radio-group>
        <v-divider></v-divider>
        <v-radio-group v-model="raceSelector" inline hide-details>
          <v-radio value="none" label="全部"></v-radio>
          <v-radio v-for="(k, i) in races" :key="`Race-${i}`" :value="k" :label="tr[k]"></v-radio>
        </v-radio-group>
        <template v-if="categorySelector === 'card'">
          <v-divider></v-divider>
          <v-range-slider min="0" max="7" step="1" :ticks="starTick" show-ticks="always" v-model="starRange"></v-range-slider>
          <v-divider></v-divider>
        <v-radio-group v-model="attrSelector" inline hide-details>
          <v-radio value="none" label="全部"></v-radio>
          <v-radio v-for="(k, i) in attr.$order" :key="`Attr-${i}`" :value="k" :label="tr[k]"></v-radio>
        </v-radio-group>
        </template>
      </v-card-text>
    </v-card>
  </NodeList>
</template>
