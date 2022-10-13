<script setup>
import { ref } from 'vue'
import TextNode from './TextNode.vue'
import data from '../term.js'
import bus from '../bus.js'
const props = defineProps({
  text: String
})
const refRace = data.whichRace(props.text)
const refData = ref(data.data[refRace] || {})

function requireTerm (key) {
  bus.emit('requireTerm', key)
}

function requireCard (key) {
  bus.emit('requireCard', key)
}

</script>

<template>
  <template v-if="props.text[0] === ':'">
    <span @click="requireCard(props.text.substring(1))">{{ props.text.substring(1) }}</span>
  </template>
  <template v-else>
    <v-tooltip location="bottom">
      <template v-slot:activator="{ props: p }">
        <span v-bind="p" @click="requireTerm(props.text)" :class="{ unimpl: !refData[props.text]?.s }">{{ props.text }}</span>
      </template>
      <text-node v-if="refData[props.text]?.s" :text="refData[props.text]?.s" :notip="true"></text-node>
    </v-tooltip>
  </template>
</template>

<style scoped>
span {
  text-decoration: underline;
}
.unimpl {
  color: red
}
</style>