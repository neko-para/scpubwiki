<script setup>
import { ref, computed } from 'vue'
import NodeList from './NodeList.vue'
import { data, attr$order, info, upgradeCategory$order, tr } from '../../data'

const categorySelector = ref('card')
const packSelector = ref('none')
const raceSelector = ref('none')
const starTick = {}
for (let i = 0; i <= 7; i++) {
  starTick[i] = String(i)
}
const cateSelector = ref('none')
const starRange = ref([0, 7])
const attrSelector = ref('none')

function testSelector (value, selector) {
  return selector !== 'none' && selector !== value
}

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
    if (d.type === 'card' && testSelector(d.pack, packSelector.value)) {
      continue
    }
    if (d.type === 'upgrade') {
      if (testSelector(d.cate, cateSelector.value)) {
        continue
      }
    } else {
      if (testSelector(d.race, raceSelector.value)) {
        continue
      }
    }
    if (d.type === 'card' && ['none', '核心'].includes(packSelector.value)) {
      if (starRange.value[0] > d.level || starRange.value[1] < d.level) {
        continue
      }
      if (attrSelector.value !== 'none' && !(d.attr && attrSelector.value in d.attr)) {
        continue
      }
    }
    res.push(d)
  }
  if (categorySelector.value === 'card') {
    res.sort((a, b) => {
      if (a.level !== b.level) {
        return a.level - b.level
      } else {
        return a.name.localeCompare(b.name)
      }
    })
  }
  return res
})

</script>

<template>
  <NodeList :nodes="searchResult">
    <v-card>
      <v-card-text>
        <v-radio-group color="primary" v-model="categorySelector" inline hide-details>
          <v-radio value="card" label="卡牌"></v-radio>
          <v-radio value="unit" label="单位"></v-radio>
          <v-radio value="term" label="术语"></v-radio>
          <v-radio value="upgrade" label="升级"></v-radio>
        </v-radio-group>
        <template v-if="categorySelector !== 'upgrade'">
          <v-divider></v-divider>
          <v-radio-group color="secondary" v-model="raceSelector" inline hide-details>
            <v-radio value="none" label="全部"></v-radio>
            <v-radio v-for="(k, i) in info.race" :key="`Race-${i}`" :value="k" :label="tr[k]"></v-radio>
          </v-radio-group>
        </template>
        <template v-else>
          <v-divider></v-divider>
          <v-radio-group color="secondary" v-model="cateSelector" inline hide-details class="radios">
            <v-radio value="none" label="全部"></v-radio>
            <v-radio v-for="(k, i) in upgradeCategory$order" :key="`Cate-${i}`" :value="k" :label="tr[k]"></v-radio>
          </v-radio-group>
        </template>
        <template v-if="categorySelector === 'card'">
          <v-divider></v-divider>
          <v-radio-group color="secondary" v-model="packSelector" inline hide-details class="radios">
            <v-radio value="none" label="全部"></v-radio>
            <v-radio v-for="(k, i) in info.pack" :key="`Pack-${i}`" :value="k" :label="k"></v-radio>
          </v-radio-group>
          <v-divider></v-divider>
          <v-range-slider :disabled="!['none', '核心'].includes(packSelector)" color="secondary" min="0" max="7" step="1" :ticks="starTick" show-ticks="always" v-model="starRange"></v-range-slider>
          <v-divider></v-divider>
          <v-radio-group :disabled="!['none', '核心'].includes(packSelector)" color="secondary" v-model="attrSelector" inline hide-details>
            <v-radio value="none" label="全部"></v-radio>
            <v-radio v-for="(k, i) in attr$order" :key="`Attr-${i}`" :value="k" :label="tr[k]"></v-radio>
          </v-radio-group>
        </template>
      </v-card-text>
    </v-card>
  </NodeList>
</template>

<style>
.radios .v-selection-control-group  {
  flex-flow: wrap;
}
</style>
