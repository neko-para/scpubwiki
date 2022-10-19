<script setup>
import { ref } from 'vue'
import HandCard from './HandCard.vue'
import PresentCard from './PresentCard.vue'
import bus from '../bus.js'
import { Player } from '../../emulator'

const steping = ref(false)

const counter = ref(0)
function refresh () {
  counter.value = counter.value + 1
}

const player = new Player()
player.logger = str => {
  console.log('Emulator: ' + str)
}
player.refresh = refresh

const stepMessage = ref('')
const goNextStep = ref(null)
function installStep () {
  steping.value = true
  player.stepper = async (msg) => new Promise((resolve) => {
    stepMessage.value = msg
    goNextStep.value = () => {
      stepMessage.value = ''
      goNextStep.value = null
      resolve()
    }
  })
}

function stopStep () {
  steping.value = false
  if (goNextStep.value) {
    goNextStep.value()
  }
  player.stepper = null
}

const choosingPos = ref(-1)
let chooseResolve = null

bus.on('add-to-hand', async ({ card }) => {
  await player.obtain_hand(card)
  refresh()
})

player.bus.async_emit('round-start')

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
}

function sell (i) {
  if (choosingPos.value !== -1) {
    return
  }
  player.sell_hand(i)
}

</script>

<template>
  <v-card>
    <v-card-text>目前只支持所有人族卡牌! 注意不要在单步调试的时候尝试连续获取多个卡牌, 最好关闭单步调试后去获取卡牌</v-card-text>
    <v-card-actions>
      <v-btn :disabled="steping" color="red" @click="installStep()">开启单步调试</v-btn>
      <v-btn :disabled="!steping" color="red" @click="stopStep()">停止单步调试</v-btn>
      <v-btn :disabled="!goNextStep" @click="goNextStep()">步进</v-btn>
    </v-card-actions>
    <v-card-text v-if="steping">
      {{ stepMessage }}
    </v-card-text>
    <v-card-title :key="`CT-${counter}`">
      控制区 回合 {{ player.round }} 等级 {{ player.level }}
    </v-card-title>
    <v-card-text :key="`IF-${counter}`">
      晶体矿 {{ player.mineral }} / {{ player.max_mineral }} 瓦斯 {{ player.gas }} / 6
    </v-card-text>
    <v-card-actions>
      <v-btn :disabled="!!goNextStep" @click="player.next_round()">下一回合</v-btn>
      <v-btn :disabled="!!goNextStep" @click="player.do_refresh()">刷新</v-btn>
      <v-btn :disabled="!!goNextStep || player.level === 6 || player.mineral < player.upgrade_cost" @click="player.do_upgrade()" :key="`Upgrade-${counter}`">升级 {{ player.upgrade_cost }}</v-btn>
    </v-card-actions>
    <v-card-title :key="`PT-${counter}`">
      进场区 {{ player.calculateValue() }}
    </v-card-title>
    <v-card-text>
      <v-row>
        <v-col v-for="i in 4" :key="`Present-${i - 1}`">
          <present-card :card="player.present[i - 1]" :indexing="choosingPos !== -1"
            @sell="player.sell(i - 1)" @choose="choose(i - 1)"
            :key="`PC-${i - 1}-${counter}`"></present-card>
        </v-col>
      </v-row>
      <v-row>
        <v-col v-for="i in 3" :key="`Present-${i + 3}`">
          <present-card :card="player.present[i + 3]" :indexing="choosingPos !== -1"
            @sell="player.sell(i + 3)" @choose="choose(i + 3)"
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
