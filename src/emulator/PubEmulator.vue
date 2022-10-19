<script setup>
import { ref } from 'vue'
import HandCard from './HandCard.vue'
import PresentCard from './PresentCard.vue'
import bus from '../bus.js'
import { Player } from '../../emulator'

const counter = ref(0)
function refresh () {
  counter.value = counter.value + 1
}

const player = new Player()
player.logger = str => {
  console.log('Emulator: ' + str)
}
player.refresh = refresh

const choosingPos = ref(-1)
let chooseResolve = null

bus.on('add-to-hand', ({ card }) => {
  player.obtain_hand(card)
  refresh()
})

player.bus.emit('round-start')

function choose (i) {
  chooseResolve(i)
  choosingPos.value = -1
}

function enter (i) {
  if (choosingPos.value !== -1) {
    return
  }
  player.requestEnter(i, async () => {
    return new Promise((resolve) => {
      chooseResolve = resolve
      choosingPos.value = i
    })
  }).then(enterd => {
    if (enterd) {
      refresh()
    }
  })
}

function combine (i) {
  if (choosingPos.value !== -1) {
    return
  }
  player.combine(i)
  refresh()
}

function sell (i) {
  if (choosingPos.value !== -1) {
    return
  }
  player.sell_hand(i)
  refresh()
}

function sellP (i) {
  player.sell(i)
  refresh()
}

function goNextRound () {
  player.bus.emit('round-end')
  player.bus.emit('round-start')
  refresh()
}

function goRefresh () {
  player.bus.emit('refresh')
  refresh()
}

</script>

<template>
  <v-card>
    <v-card-text>目前只支持所有人族卡牌!</v-card-text>
    <v-card-title>
      控制区
    </v-card-title>
    <v-card-actions>
      <v-btn @click="goNextRound()">下一回合</v-btn>
      <v-btn @click="goRefresh()">刷新</v-btn>
    </v-card-actions>
    <v-card-title>
      进场区
    </v-card-title>
    <v-card-text>
      <v-row>
        <v-col v-for="i in 4" :key="`Present-${i - 1}`">
          <present-card :card="player.present[i - 1]" :indexing="choosingPos !== -1"
            @sell="sellP(i - 1)" @choose="choose(i - 1)"
            :key="`PC-${i - 1}-${counter}`"></present-card>
        </v-col>
      </v-row>
      <v-row>
        <v-col v-for="i in 3" :key="`Present-${i + 3}`">
          <present-card :card="player.present[i + 3]" :indexing="choosingPos !== -1"
            @sell="sellP(i + 3)" @choose="choose(i + 3)"
            :key="`PC-${i + 3}-${counter}`"></present-card>
        </v-col>
        <v-col></v-col>
      </v-row>
    </v-card-text>
    <v-card-title>
      暂存区
    </v-card-title>
    <v-card-text>
      <v-row>
        <v-col v-for="i in 3" :key="`Hand-${i - 1}`">
          <hand-card :card="player.hand[i - 1]" :entering="choosingPos === i - 1" :combining="player.canCombine(i - 1)"
            @enter="enter(i - 1)" @combine="combine(i - 1)" @sell="sell(i - 1)"
            :key="`HC-${i - 1}-${counter}`"></hand-card>
        </v-col>
      </v-row>
      <v-row>
        <v-col v-for="i in 3">
          <hand-card :card="player.hand[i + 2]" :entering="choosingPos === i + 2" :combining="player.canCombine(i + 2)"
            @enter="enter(i + 2)" @combine="combine(i + 2)" @sell="sell(i + 2)"
            :key="`HC-${i + 2}-${counter}`"></hand-card>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>
