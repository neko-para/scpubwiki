<script setup lang="ts">
import { ref, onBeforeUpdate, computed } from 'vue'
import { PubNode } from './types'
import NodeView from './NodeView.vue'

const perPage = 10
const props = defineProps<{
  nodes: PubNode[]
}>()

const nPage = computed(() => {
  return Math.ceil(props.nodes.length / perPage)
})
const page = ref(1)
const pageBegin = computed(() => {
  return (page.value - 1) * perPage
})
const pageCount = computed(() => {
  return Math.min(page.value * perPage, props.nodes.length) - pageBegin.value
})

onBeforeUpdate(() => {
  page.value = 1
})

</script>

<template>
  <v-container>
    <v-row>
      <v-col>
        <slot></slot>
      </v-col>
    </v-row>
    <v-row>
      <v-col>
        <v-pagination v-model="page" :length="nPage"></v-pagination>
      </v-col>
    </v-row>
    <v-row v-for="i in pageCount" :key="`${pageBegin + i}`">
      <v-col>
        <node-view :node="nodes[pageBegin + i - 1]" v-bind="$attrs"></node-view>
      </v-col>
    </v-row>
    <v-row>
      <v-col>
        <v-pagination v-model="page" :length="nPage"></v-pagination>
      </v-col>
    </v-row>
  </v-container>
</template>
