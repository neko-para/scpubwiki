<script setup>
import { ref, computed } from 'vue'
import bus from '../bus.js'
import ReferText from '../components/ReferText.vue'
const props = defineProps({
  card: Object,
  indexing: Boolean
})

const el = ref(2)

const bref = ref(false)

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
  if (ks.length > 5) {
    return ks.slice(0, 5).map(k => `${k} ${units.value[k]}`).join('\n')
  } else {
    return ks.map(k => `${k} ${units.value[k]}`).join('\n')
  }
}

</script>

<template>
  <v-card @mouseover="el = 5" @mouseout="el = 2" :elevation="el">
    <v-card-title>
      <refer-text v-if="card" :text="card.name"></refer-text>
      <span v-else>空</span>
    </v-card-title>
    <v-card-text v-if="card">
      <refer-text :text="unitInfo()"></refer-text>
    </v-card-text>
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn v-if="indexing" @click="$emit('choose')">这里</v-btn>
      <v-btn :disabled="!card || indexing" @click="$emit('sell')">出售</v-btn>
    </v-card-actions>
  </v-card>
</template>
