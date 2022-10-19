<script setup>
import { ref } from 'vue'
import HandCard from './HandCard.vue'
import PresentCard from './PresentCard.vue'
import bus from '../bus.js'
import { Player } from './emulator.js'

const counter = ref(0)
function refresh () {
  counter.value = counter.value + 1
}

const player = new Player()
player.logger = str => {
  console.log('Emulator: ' + str)
}

const hand = ref(Array(6).fill(null))
const choosingPos = ref(-1)
let chooseResolve = null

player.queryHand = () => {
  return hand.value.map((n, i) => {
    if (i === choosingPos.value) {
      return null
    }
    return n ? n.name : null
  })
}

bus.on('add-to-hand', ({ card }) => {
  for (let i = 0; i < 6; i++) {
    if (!hand.value[i]) {
      hand.value[i] = card
      return
    }
  }
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
  player.requestEnter(hand.value[i], async () => {
    return new Promise((resolve) => {
      chooseResolve = resolve
      choosingPos.value = i
    })
  }).then(enterd => {
    if (enterd) {
      hand.value[i] = null
      refresh()
    }
  })
}

function sell (i) {
  if (choosingPos.value !== -1) {
    return
  }
  hand.value[i] = null
  player.mineral += 1
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
</script>

<template>
  <v-card>
    <v-card-text>目前只支持所有人族卡牌, 不支持三连!</v-card-text>
    <v-card-title>
      控制区
    </v-card-title>
    <v-card-actions>
      <v-btn @click="goNextRound()">下一回合</v-btn>
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
          <hand-card :card="hand[i - 1]" :entering="choosingPos === i - 1"
            @enter="enter(i - 1)" @sell="sell(i - 1)"></hand-card>
        </v-col>
      </v-row>
      <v-row>
        <v-col v-for="i in 3">
          <hand-card :card="hand[i + 2]" :entering="choosingPos === i + 2" 
            @enter="enter(i + 2)" @sell="sell(i + 2)"></hand-card>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>
