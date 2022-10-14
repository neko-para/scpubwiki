<script setup>
import { ref, computed } from 'vue'
import bus from '../bus.js'
import { data, splitText } from '../data.js'

const props = defineProps({
  text: String
})

const nodes = computed(() => {
  const res = []
  props.text.split('\n').forEach(t => {
    res.push(...splitText(t))
    res.push({
      t: 'br'
    })
  })
  return res
})

// console.log(nodes.value)

const rdata = ref(data)

function request (node) {
  bus.emit('request', node)
}

</script>

<template>
  <span>
    <span v-for="(node, idx) in nodes" :key="idx">
      <br v-if="node.t === 'br'">
      <span v-else-if="node.t === 'str'">{{ node.s }}</span>
      <template v-else>
        <v-tooltip location="bottom" v-if="rdata[node.s]?.bref">
          <template v-slot:activator="{ props: p }">
            <span v-bind="p" @click="request(node)" class="ref">
              {{ node.s }}
            </span>
          </template>
          <span>{{ rdata[node.s].bref }}</span>
        </v-tooltip>
        <span v-else @click="request(node)" class="ref">
          {{ node.s }}
        </span>
      </template>
    </span>
  </span>
</template>

<style scoped>
.ref {
  cursor: pointer;
  font-weight: bold;
}

.ref:hover {
  background-color: lightgray;
}

span {
  cursor: default;
}
</style>
