<script setup>
import { ref } from 'vue'
import TextRefer from './TextRefer.vue'
import TextNode from './TextNode.vue'
const props = defineProps({
  data: Object
})
let isGold = ref(false)

</script>

<template>
  <v-expansion-panel-text>
    <v-card-title>单位</v-card-title>
    <v-card-text>
      <v-chip v-for="(number, unit) in props.data.unit" :key="unit">
        <template v-if="unit[0] === '$'">
          <text-refer :text="unit.substring(1)"></text-refer>
        </template>
        <template v-else>
          {{ unit }}
        </template>
        {{number}}
      </v-chip>
    </v-card-text>
  </v-expansion-panel-text>
  <v-divider></v-divider>
  <v-expansion-panel-text>
    <v-card-title>
      <v-row>
        <v-col>
          卡面描述
        </v-col>
        <v-spacer></v-spacer>
        <v-col cols="3">
          <v-switch :disabled="props.data.attr?.gold" v-model="isGold" color="primary" label="三连"></v-switch>
        </v-col>
      </v-row>
    </v-card-title>
    <v-card-text>
      <v-card elevation="5">
        <template v-if="props.data.banner">
          <v-card-text>
            {{ props.data.banner }}
          </v-card-text>
          <v-divider></v-divider>
        </template>
        <template v-if="props.data.attr?.gold">
          <v-card-text >
            <text-refer text='无法三连' />
          </v-card-text>
          <v-divider></v-divider>
        </template>
        <template v-if="props.data.attr?.insert">
          <v-card-text>
            能够<text-refer text='定点部署' />
          </v-card-text>
          <v-divider></v-divider>
        </template>
        <template v-if="props.data.attr?.origin">
          <v-card-text>
            属于<text-refer text='原始虫群' />
          </v-card-text>
          <v-divider></v-divider>
        </template>
        <template v-if="props.data.attr?.dark">
          <v-card-text>
            具有<text-refer text='黑暗容器' />
          </v-card-text>
          <v-divider></v-divider>
        </template>
        <template v-for="(desc, idx) in props.data.desc" :key="idx">
          <v-divider v-if="idx > 0"></v-divider>
          <v-card-text >
            <text-node :text="desc(isGold)"></text-node>
          </v-card-text>
        </template>
        <template v-if="props.data.attr?.void">
          <v-divider></v-divider>
          <v-card-text>
            具有<text-refer text='虚空投影' />
          </v-card-text>
        </template>
      </v-card>
    </v-card-text>
    <template  v-if="props.data.remark">
      <v-divider></v-divider>
      <v-card-title>
        备注
      </v-card-title>
      <v-card-text>
        <text-node :text="props.data.remark"></text-node>
      </v-card-text>
    </template>
  </v-expansion-panel-text>
</template>
