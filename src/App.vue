<script setup lang="ts">
import { ref, computed, Ref } from 'vue'
import NodeList from './components/NodeList.vue'
import AboutDialog from './components/AboutDialog.vue'
import SearchView from './components/SearchView.vue'
import PubEmulator from './emulator/PubEmulator.vue'
import bus from './bus'
import { CardKey, Cards, getCard, getTerm, getUnit, getUpgrade, TermKey, Terms, UnitKey, Units, UpgradeKey, Upgrades } from '../data'
import { PubNode } from './components/types'
import { PossibleKey, SplitResultRefer } from '../data'

const showEmulator = ref(false)

const refers: Ref<PossibleKey[]> = ref([])

const referNodes = computed(() => {
  const nodes: PubNode[] = []
  refers.value.forEach(k => {
    if (Units.has(k as UnitKey)) {
      nodes.push(getUnit(k as UnitKey))
    }
    if (Terms.has(k as TermKey)) {
      nodes.push(getTerm(k as TermKey))
    }
    if (Cards.has(k as CardKey)) {
      nodes.push(getCard(k as CardKey))
    }
    if (Upgrades.has(k as UpgradeKey)) {
      nodes.push(getUpgrade(k as UpgradeKey))
    }
  })
  return nodes
})

// @ts-ignore
bus.on('request', ({ node }) => {
  let i = refers.value.indexOf(node.s)
  if (i === -1) {
    refers.value = [ node.s, ...refers.value ]
  } else {
    refers.value = [ node.s, ...refers.value.slice(0, i), ...refers.value.slice(i + 1) ]
  }
})

// @ts-ignore
bus.on('requestClose', ({ name }) => {
  let i = refers.value.indexOf(name)
  if (i !== -1) {
    refers.value = [ ...refers.value.slice(0, i), ...refers.value.slice(i + 1) ]
  }
})

function goUp() {
  document.getElementById('topAnchor')?.scrollIntoView({behavior: 'smooth'})
}

</script>

<template>
  <v-app>
    <v-app-bar>
      <v-app-bar-title>星际酒馆 非官方Wiki</v-app-bar-title>
      <v-spacer></v-spacer>
      <v-btn @click="showEmulator = true">模拟器(测试版)</v-btn>
      <about-dialog></about-dialog>
    </v-app-bar>
    <v-main>
      <div id="topAnchor"></div>
      <v-container>
        <v-row v-if="showEmulator">
          <v-col cols="10">
            <pub-emulator></pub-emulator>
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="10">
            <search-view></search-view>
          </v-col>
        </v-row>
      </v-container>
      <node-list :nodes="referNodes" class="right-panel" :brief="true" :closable="true"></node-list>
      <v-btn icon="mdi-chevron-up" class="fab" @click="goUp()"></v-btn>
    </v-main>
  </v-app>
</template>

<style scoped>
#topAnchor {
  position: absolute;
  top: 0;
}
.right-panel {
  position: fixed;
  top: 64px;
  right: 0;
  width: 25%;
}

.fab {
  position: fixed;
  right: 32px;
  bottom: 32px;
}

</style>
