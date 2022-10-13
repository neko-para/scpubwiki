<script setup>
import { ref } from 'vue';
import TextNode from './TextNode.vue'
import bus from '../bus.js'
import term from '../term.js'

const data = ref(term.data)
const race = ref({
  G: '通用',
  T: '人族',
  P: '神族',
  Z: '虫族',
  M: '中立'
})
const raceKeys = Object.keys(race.value)
const raceActive = ref([])
const subKeys = {
  G: Object.keys(data.value.G),
  T: Object.keys(data.value.T),
  P: Object.keys(data.value.P),
  Z: Object.keys(data.value.Z),
  M: Object.keys(data.value.M)
}
const subActive = ref({
  G: [],
  T: [],
  P: [],
  Z: [],
  M: []
})
bus.on('requireTerm', (k) => {
  for (let ri = 0; ri < raceKeys.length; ri++) {
    const r = raceKeys[ri]
    let idx = subKeys[r].indexOf(k)
    if (idx !== -1) {
      if (subActive.value[r].indexOf(idx) === -1) {
        subActive.value[r].push(idx)
      }
      if (raceActive.value.indexOf(ri) === -1) {
        raceActive.value.push(ri)
      }
      return
    }
  }
})
</script>

<template>
  <v-expansion-panels v-model="raceActive" multiple>
    <v-expansion-panel v-for="(d, r) in data" :key="r">
      <v-expansion-panel-title>{{ race[r] }}术语</v-expansion-panel-title>
      <v-expansion-panel-text>
        <v-expansion-panels v-model="subActive[r]" multiple>
          <v-expansion-panel v-for="(k, i) in subKeys[r]" :key="i">
            <v-expansion-panel-title>{{ k }}</v-expansion-panel-title>
            <v-expansion-panel-text>
              <text-node :text="d[k]?.s"></text-node>
            </v-expansion-panel-text>
            <template v-if="d[k]?.c">
              <v-divider></v-divider>
              <v-expansion-panel-text>
                <text-node :text="d[k]?.c"></text-node>
              </v-expansion-panel-text>
            </template>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-expansion-panel-text>
    </v-expansion-panel>
  </v-expansion-panels>
</template>
