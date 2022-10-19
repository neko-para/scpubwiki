<script setup>
import { ref } from 'vue'
import ReferText from '../components/ReferText.vue'
const props = defineProps({
  card: Object,
  entering: Boolean
})

const el = ref(2)

</script>

<template>
  <v-card @mouseover="el = 5" @mouseout="el = 2" :elevation="entering ? 10 : el">
    <v-card-title>
      <refer-text v-if="card" :text="card.name"></refer-text>
      <span v-else>空</span>
    </v-card-title>
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn :disabled="!card" @click="$emit('enter')">进场</v-btn>
      <v-btn :disabled="!card" @click="$emit('sell')">出售</v-btn>
    </v-card-actions>
  </v-card>
</template>
