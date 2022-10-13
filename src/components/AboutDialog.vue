<script setup>
import { ref } from 'vue';

const show = ref(false)
</script>

<template>
  <v-dialog v-model="show" width="480">
    <template v-slot:activator="{ props }">
      <v-btn v-bind="props">关于</v-btn>
    </template>
    <v-card>
      <v-card-title>
        星际酒馆 非官方Wiki
      </v-card-title>
      <v-card-text>
        项目地址 <a href="https://github.com/neko-para/scpubwiki">https://github.com/neko-para/scpubwiki</a>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-card-action>
          <v-btn @click="show = false">关闭</v-btn>
        </v-card-action>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
