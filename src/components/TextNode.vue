<script setup>
import TextRefer from './TextRefer.vue'

const props = defineProps({
  text: String,
  notip: {
    type: Boolean,
    default: false
  }
})
function preprocess (text) {
  let res = []
  text.split('\n').forEach(s => {
    res.push(s)
    res.push({
      br: true
    })
  })
  res.pop();
  let newRes = []
  res.forEach(n => {
    if (n instanceof Object) {
      newRes.push(n)
    } else {
      newRes.push(...n.split(/(?=<.+>)|(?<=<.+>)/).map(s => {
        if (s[0] === '<') {
          return {
            key: s.substr(1, s.length - 2)
          }
        } else {
          return s
        }
      }))
    }
  })
  return newRes
}
</script>

<template>
  <span v-for="(n, idx) in preprocess(props.text)" :key="idx">
    <span v-if="typeof(n) === 'string'">{{ n }}</span>
    <br v-else-if="n.br" />
    <template v-else>
      <span v-if="notip">{{ n.key }}</span>
      <text-refer v-else :text="n.key"></text-refer>
    </template>
  </span>
</template>
