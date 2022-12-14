<script setup lang="ts">
import { ref, computed } from 'vue'
import { UnitKey } from '../../data';
import { CardInstance, infrs } from '../../emulator'
import ReferText from '../components/ReferText.vue'
const props = defineProps<{
  card: CardInstance | null,
  indexing: boolean
}>()

const el = ref(2)

const units = computed(() => {
  const u: {
    [key in UnitKey]?: number
  } = {}
  props.card?.unit.forEach(uu => {
    u[uu] = 1 + (u[uu] || 0)
  })
  return u
})

function unitInfo () {
  const ks = Object.keys(units.value)
  if (ks.length > 6) {
    return ks.slice(0, 5).map(k => `${k} ${units.value[k as UnitKey]}`).join('\n') + '...'
  } else {
    return ks.map(k => `${k} ${units.value[k as UnitKey]}`).join('\n')
  }
}

function fullUnitInfo () {
  return Object.keys(units.value).map(k => `${k} ${units.value[k as UnitKey]}`).join('\n')
}

function color () {
  if (!props.card) {
    return 'white'
  }
  if (props.card.gold) {
    return 'yellow'
  }
  if (props.card.darkgold) {
    return 'amber darken-1'
  }
  return 'white'
}

</script>

<template>
  <v-card @mouseover="el = 5" @mouseout="el = 2" :color="color()" :elevation="el">
    <template v-if="card">
      <v-card-title>
        <refer-text :text="card.name"></refer-text>
      </v-card-title>
      <v-card-text>
        <span style="cursor: pointer">
          {{ card.unit.length }} / 200
          <v-overlay activator="parent" location-strategy="connected" scroll-strategy="block">
            <v-card>
              <v-card-text>
                <refer-text :text="fullUnitInfo()"></refer-text>
              </v-card-text>
            </v-card>
          </v-overlay>
        </span>
        <br>
        <refer-text :text="unitInfo()"></refer-text>
      </v-card-text>
      <v-card-text v-if="card.announce">
        <refer-text :text="card.announce"></refer-text>
      </v-card-text>
      <v-card-text v-if="card.infr_type() !== -1">
        <refer-text :text="infrs[card.infr_type()]"></refer-text>
      </v-card-text>
      <v-card-text v-if="card.power() > 0">
        <refer-text :text="`???????????? ${card.power()}`"></refer-text>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn v-if="indexing" @click="$emit('choose')">??????</v-btn>
        <v-btn :disabled="indexing" @click="$emit('sell')">??????</v-btn>
      </v-card-actions>
    </template>
    <template v-else>
      <v-card-title>
        <span>???</span>
      </v-card-title>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn v-if="indexing" @click="$emit('choose')">??????</v-btn>
      </v-card-actions>
    </template>
  </v-card>
</template>
