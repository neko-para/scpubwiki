<script setup>
import { ref, computed } from 'vue'
import { infrs } from '../../emulator'
import ReferText from '../components/ReferText.vue'
const props = defineProps({
  card: Object,
  indexing: Boolean
})

const el = ref(2)

const units = computed(() => {
  const u = {}
  props.card?.unit.forEach(uu => {
    u[uu] = u[uu] || 0
    u[uu] += 1
  })
  return u
})

function unitInfo () {
  const ks = Object.keys(units.value)
  if (ks.length > 6) {
    return ks.slice(0, 5).map(k => `${k} ${units.value[k]}`).join('\n') + '...'
  } else {
    return ks.map(k => `${k} ${units.value[k]}`).join('\n')
  }
}

function fullUnitInfo () {
  return Object.keys(units.value).map(k => `${k} ${units.value[k]}`).join('\n')
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
        <refer-text :text="`能量强度 ${card.power()}`"></refer-text>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn v-if="indexing" @click="$emit('choose')">这里</v-btn>
        <v-btn :disabled="indexing" @click="$emit('sell')">出售</v-btn>
      </v-card-actions>
    </template>
    <template v-else>
      <v-card-title>
        <span>空</span>
      </v-card-title>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn v-if="indexing" @click="$emit('choose')">这里</v-btn>
      </v-card-actions>
    </template>
  </v-card>
</template>
