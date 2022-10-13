<script setup>
import { ref } from 'vue';
import CardListAll from './components/CardListAll.vue'
import ReferList from './components/ReferList.vue'
import AboutDialog from './components/AboutDialog.vue';

const tab = ref(null)
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
          <v-col cols="9">
            <v-card elevation="10">
              <v-tabs v-model="tab">
                <v-tab value="card">卡牌</v-tab>
                <v-tab value="unit">单位</v-tab>
              </v-tabs>
              <v-window v-model="tab">
                <v-window-item value="card">
                  <card-list-all></card-list-all>
                </v-window-item>
                <v-window-item value="unit">
                  123
                </v-window-item>
              </v-window>
            </v-card>
          </v-col>
          <v-col cols="3">
            <refer-list></refer-list>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>
