<script setup lang="ts">
import { ref } from 'vue'
import { Card } from '../../data/pubdata.d'
import ReferText from '../components/ReferText.vue'
const props = defineProps<{
  card: Card | null,
  entering: boolean,
  combining: boolean
}>()

const el = ref(2)

</script>

<template>
  <v-card @mouseover="el = 5" @mouseout="el = 2" :elevation="entering ? 10 : el">
    <template v-if="card">
      <v-card-title>
        <refer-text v-if="card" :text="card.name"></refer-text>
      </v-card-title>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn v-if="combining" :disabled="!card" @click="$emit('combine')" color="red darken-4">三连</v-btn>
        <v-btn v-else @click="$emit('enter')">进场</v-btn>
        <v-btn @click="$emit('sell')">出售</v-btn>
      </v-card-actions>
    </template>
    <template v-else>
      <v-card-title>
        <span>空</span>
      </v-card-title>
      <v-card-actions>
        <v-spacer></v-spacer>
      </v-card-actions>
    </template>
  </v-card>
</template>
