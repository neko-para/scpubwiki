<script setup lang="ts">
import { ref, computed, Ref } from 'vue'
import NodeList from './NodeList.vue'
import { attr$order, info, upgradeCategory$order, tr, Cards, CardKey, Terms, Units, Upgrades, Card, Upgrade, Unit, Term } from '../../data'

const categorySelector: Ref<'card'|'term'|'unit'|'upgrade'> = ref('card')
const packSelector = ref('核心')
const raceSelector = ref('none')
const starTick: Record<number, string> = {}
for (let i = 0; i <= 7; i++) {
  starTick[i] = String(i)
}
const cateSelector = ref('none')
const starRange = ref([1, 6])
const attrSelector = ref('none')

function testSelector (value: string, selector: string) {
  return selector !== 'none' && selector !== value
}

const searchResult = computed(() => {
  switch (categorySelector.value) {
    case 'card': {
      const res: Card[] = []
      for (const card of Cards.values()) {
        if (testSelector(card.pack, packSelector.value) || testSelector(card.race, raceSelector.value)) {
          continue
        }
        if (['none', '核心'].includes(packSelector.value)) {
          if (starRange.value[0] > card.level || starRange.value[1] < card.level) {
            continue
          }
          if (attrSelector.value !== 'none' && !(card.attr && attrSelector.value in card.attr)) {
            continue
          }
        }
        res.push(card)
      }
      res.sort((a, b) => {
        return a.level === b.level ? a.name.localeCompare(b.name) : a.level - b.level
      })
      return res
    }
    case 'term': {
      const res: Term[] = []
      for (const term of Terms.values()) {
        if (testSelector(term.race, raceSelector.value)) {
          continue
        }
        res.push(term)
      }
      return res
    }
    case 'unit': {
      const res: Unit[] = []
      for (const unit of Units.values()) {
        if (testSelector(unit.race, raceSelector.value)) {
          continue
        }
        res.push(unit)
      }
      return res
    }
    case 'upgrade': {
      const res: Upgrade[] = []
      for (const upgrade of Upgrades.values()) {
        if (testSelector(upgrade.cate, cateSelector.value)) {
          continue
        }
        res.push(upgrade)
      }
      return res
    }
  }
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
