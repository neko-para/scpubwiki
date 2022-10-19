<script setup>
import { ref } from 'vue'
import ReferText from '../components/ReferText.vue'
const props = defineProps({
  card: Object,
  entering: Boolean,
  combining: Boolean
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
        <template v-if="card">
        <v-spacer></v-spacer>
        <v-btn v-if="combining" :disabled="!card" @click="$emit('combine')" color="red darken-4">三连</v-btn>
        <v-btn v-else @click="$emit('enter')">进场</v-btn>
        <v-btn @click="$emit('sell')">出售</v-btn>
      </template>
    </v-card-actions>
  </v-card>
</template>
