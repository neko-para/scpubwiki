<script setup>
import { ref } from 'vue'
import ReferText from './ReferText.vue'
import CardNodeView from './CardNodeView.vue'
import UnitNodeView from './UnitNodeView.vue'
import bus from '../bus.js'

const props = defineProps({
  node: Object,
  brief: {
    type: Boolean,
    default: false
  },
  closable: {
    type: Boolean,
    default: false
  }
})

const bref = ref(true)
bref.value = props.brief

const elv = ref(5)

function reqClose() {
  bus.emit('requestClose', props.node.name)
}

function sendToHand(card) {
  bus.emit('add-to-hand', {
    card
  })
}

</script>

<template>
  <v-card :elevation="elv" @mouseover="elv = 20" @mouseout="elv = 5">
    <v-card-actions v-if="props.node.type === 'card' || props.closable">
      <v-spacer></v-spacer>
      <v-btn v-if="node.type === 'card' && node.pool && ['T', 'P'].includes(node.race)" @click="sendToHand(node)">获取</v-btn>
      <v-btn v-if="node.type === 'card'" @click="bref = !bref">
        {{ bref ? '展开' : '收起' }}
      </v-btn>
      <v-btn v-if="props.closable" @click="reqClose()">关闭</v-btn>
    </v-card-actions>
    <template v-if="node.type === 'card'">
      <card-node-view :node="node" :bref="bref"></card-node-view>
    </template>
    <template v-else-if="node.type === 'term'">
      <v-card-title class="text-h5">
        {{ node.name }}
      </v-card-title>
      <v-divider></v-divider>
      <v-card-text>
        <refer-text :text="node.bref"></refer-text>
      </v-card-text>
      <template v-if="node.extr">
        <v-divider></v-divider>
        <v-card-text>
          <refer-text :text="node.extr"></refer-text>
        </v-card-text>
      </template>
    </template>
    <template v-else-if="node.type === 'unit'">
      <unit-node-view :node="node"></unit-node-view>
    </template>
    <template v-else-if="node.type === 'upgrade'">
      <v-card-title class="text-h5">
        {{ node.name }}
      </v-card-title>
      <v-divider></v-divider>
      <template v-if="node.novr">
        <v-card-text>
          <refer-text :text="'无法叠加'"></refer-text>
        </v-card-text>
        <v-divider></v-divider>
      </template>
      <v-card-text>
        <refer-text :text="node.desc"></refer-text>
      </v-card-text>
      <template v-if="node.rmrk">
        <v-divider></v-divider>
        <v-card-text>
          <refer-text :text="node.rmrk"></refer-text>
        </v-card-text>
      </template>
    </template>
  </v-card>
</template>

<style scoped>
</style>
