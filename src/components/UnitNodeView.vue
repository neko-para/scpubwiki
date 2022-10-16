<script setup>
import ReferText from './ReferText.vue'
import { data } from '../data.js'

const props = defineProps({
  node: Object
})

</script>

<template>
  <v-card-title class="text-h5">
    {{ node.name }}
  </v-card-title>
  <v-divider></v-divider>
  <v-card-text>
    价值 {{ node.valu }}
  </v-card-text>
  <template v-if="node.name.endsWith('(精英)')">
    <v-divider></v-divider>
    <v-card-text>
      <refer-text :text="`作为${node.name.substring(0, node.name.length - 4)}的精英变种`"></refer-text>
    </v-card-text>
  </template>
  <template v-else-if="`${node.name}(精英)` in data">
    <v-divider></v-divider>
    <v-card-text>
      <refer-text :text="`存在精英变种${node.name}(精英)`"></refer-text>
    </v-card-text>
  </template>
  <template v-if="node.utyp === 'spbd'">
    <v-divider></v-divider>
    <v-card-text>
      <refer-text :text="'特殊建筑'"></refer-text>
    </v-card-text>
  </template>
  <template v-if="node.bref">
    <v-divider></v-divider>
    <v-card-text>
      <refer-text :text="node.bref"></refer-text>
    </v-card-text>
  </template>
  <template v-if="node.rmrk">
    <v-divider></v-divider>
    <v-card-text>
      <refer-text :text="node.rmrk"></refer-text>
    </v-card-text>
  </template>
</template>