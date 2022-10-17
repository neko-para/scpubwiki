<script setup>
import { ref, computed } from 'vue'
import NodeView from './components/NodeView.vue'
import NodeList from './components/NodeList.vue'
import AboutDialog from './components/AboutDialog.vue'
import SearchView from './components/SearchView.vue'
import { data } from './data.js'
import bus from './bus.js'

const refers = ref([])

const referNodes = computed(() => {
  const nodes = []
  refers.value.forEach(k => {
    const n = data[k]
    if (n.type === 'disa') {
      for (const kk in n) {
        if (kk === 'type') {
          continue
        }
        nodes.push(n[kk])
      }
    } else {
      nodes.push(n)
    }
  })
  return nodes
})

bus.on('request', n => {
  let i = refers.value.indexOf(n.s)
  if (i === -1) {
    refers.value = [ n.s, ...refers.value ]
  } else {
    refers.value = [ n.s, ...refers.value.slice(0, i), ...refers.value.slice(i + 1) ]
  }
})

bus.on('requestClose', n => {
  let i = refers.value.indexOf(n)
  if (i !== -1) {
    refers.value = [ ...refers.value.slice(0, i), ...refers.value.slice(i + 1) ]
  }
})

</script>

<template>
  <v-app>
    <v-app-bar>
      <v-app-bar-title>星际酒馆 非官方Wiki</v-app-bar-title>
      <v-spacer></v-spacer>
      <about-dialog></about-dialog>
    </v-app-bar>
    <v-main>
      <v-container>
        <v-row>
          <v-col cols="10">
            <search-view></search-view>
          </v-col>
        </v-row>
      </v-container>
      <node-list :nodes="referNodes" class="right-panel" :brief="true" :closable="true"></node-list>
    </v-main>
  </v-app>
</template>

<style scoped>
.right-panel {
  position: fixed;
  top: 64px;
  right: 0;
  width: 25%;
}

</style>
