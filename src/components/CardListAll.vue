<script setup>
import { ref } from 'vue'
import bus from '../bus.js'
import CardList from './CardList.vue'
import SearchInput from './SearchInput.vue'
import data from '../data/data.js'

const cardData = ref(data)
const race = ref({
  T: '人族',
  P: '神族',
  Z: '虫族',
  M: '中立'
})
const groupby = ref('none')
let selector = ref(() => true)

function dataAll () {
  const arr = []
  for (const k in race.value) {
    arr.push(...cardData.value.data[k])
  }
  return arr.filter(selector.value)
}

function dataStar () {
  const all = dataAll()
  const res = {}
  const ks = Array.from((new Set(all.map(d => d.level))).keys()).sort()
  for (const i of ks) {
    res[String(i)] = []
  }
  all.forEach(d => {
    res[String(d.level)].push(d)
  })
  return res
}

bus.on('cardFilter', (s) => {
  selector.value = s.filter
  groupby.value = s.groupby
})
</script>

<template>
  <v-container>
    <v-row>
      <v-col>
        <search-input></search-input>
      </v-col>
    </v-row>
    <v-row>
      <v-col>
        <template v-if="groupby === 'race'">
          <v-expansion-panels multiple>
            <v-expansion-panel v-for="(d, r) in cardData.data" :key="r">
              <template v-if="d.filter(selector).length > 0">
                <v-expansion-panel-title>
                  {{ race[r] }}
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <card-list :data="d.filter(selector)" />
                </v-expansion-panel-text>
              </template>
            </v-expansion-panel>
          </v-expansion-panels>
        </template>
        <template v-else-if="groupby === 'star'">
          <v-expansion-panels multiple>
            <v-expansion-panel v-for="(d, s) in dataStar()" :key="s">
              <v-expansion-panel-title>
                {{ s }}
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <card-list :data="d" />
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </template>
        <template v-else-if="groupby === 'none'">
          <card-list :data="dataAll()" />
        </template>
      </v-col>
    </v-row>
  </v-container>
</template>