<script setup>
import { ref } from 'vue'

import CardList from './components/CardList.vue'
import ReferList from './components/ReferList.vue'
import data from './data.js'

const cardData = ref(data.data)
const race = ref({
  T: '人族',
  P: '神族',
  Z: '虫族',
  M: '中立'
})

</script>

<template>
  <v-app>
    <v-main>
      <v-container>
        <v-row>
          <v-col cols="6">
            <v-expansion-panels multiple>
              <v-expansion-panel v-for="(d, r) in cardData" :key="r">
                <v-expansion-panel-title>
                  {{ race[r] }}
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <card-list :data="d" />
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </v-col>
          <v-col cols="3">
            <refer-list></refer-list>
          </v-col>
          <v-col cols="3"></v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>
