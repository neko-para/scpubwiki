<script setup>
import { ref } from 'vue';
import CardShow from './CardShow.vue'
const props = defineProps({
  data: Array
})
const race = ref({
  T: '人族',
  P: '神族',
  Z: '虫族',
  M: '中立'
})
</script>

<template>
  <v-expansion-panels multiple>
    <v-expansion-panel v-for="(d, i) in props.data" :key="i">
      <v-expansion-panel-title>{{ d.name }} {{ race[d.race] }} {{ d.level }}</v-expansion-panel-title>
      <card-show :data="d"></card-show>
    </v-expansion-panel>
  </v-expansion-panels>
</template>
