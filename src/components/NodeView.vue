<script setup>
import { ref, computed } from 'vue'
import ReferText from './ReferText.vue'
import raw from '../pubdata.js'
import bus from '../bus'
const { attr, tr } = raw

const props = defineProps({
  node: Object,
  brief: {
    type: Boolean,
    default: true
  },
  closable: {
    type: Boolean,
    default: false
  }
})

const bref = ref(true)
bref.value = props.brief

const isGold = ref(false)
const elv = ref(5)

function attrOf (node) {
  const a = []
  if (!node.attr) {
    return a
  }
  attr.$order.forEach(at => {
    if (at in node.attr) {
      a.push(at)
    }
  })
  return a
}

function reqClose() {
  bus.emit('requestClose', props.node.name)
}

</script>

<template>
  <v-card :elevation="elv" @mouseover="elv = 20" @mouseout="elv = 5">
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn v-if="props.node.type === 'card'" @click="bref = !bref">
        {{ bref ? '展开' : '收起' }}
      </v-btn>
      <v-btn v-if="props.closable" @click="reqClose()">关闭</v-btn>
    </v-card-actions>
    <template v-if="node.type === 'card'">
      <v-card-title>
        <span class="text-h5">
          {{ node.name }} {{ tr[node.race] }} {{ node.level }}
        </span>
      </v-card-title>
      <v-divider></v-divider>
      <template v-if="bref">
        <v-card-text>
          <refer-text :text="`${Object.keys(node.unit).map(k => `${k} ${node.unit[k]}`).join(' ')}`"></refer-text>
        </v-card-text>
        <template v-if="node.attr || node.desc.length > 0">
          <v-divider> </v-divider>
          <template v-for="(at, idx) in attrOf(node)" :key="`Attr-${idx}`">
            <v-divider v-if="idx > 0"></v-divider>
            <v-card-text>
              <refer-text :text="attr[at]"></refer-text>
            </v-card-text>
          </template>
          <v-divider v-if="Object.keys(node.attr || {}).length > 0 && node.desc.length > 0"></v-divider>
          <template v-for="(desc, idx) in node.desc" :key="`Desc-${idx}`">
            <v-divider v-if="idx > 0"></v-divider>
            <v-card-text>
              <refer-text :text="desc[isGold ? 1 : 0]"></refer-text>
            </v-card-text>
          </template>
        </template>
      </template>
      <template v-else>
        <v-card-title>
          单位
        </v-card-title>
        <v-card-text>
          <v-chip v-for="(n, k) in node.unit" :key="`Unit-${k}`">
            <refer-text :text="k"></refer-text>
            {{ n }}
          </v-chip>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-title>
          卡面描述
          <v-switch class="float-right" v-model="isGold" :disabled="node.attr?.gold" color="primary" label="三连" hide-details dense></v-switch>
        </v-card-title>
        <v-card-text v-if="node.attr || node.desc.length > 0">
          <v-card elevation="5">
            <template v-for="(at, idx) in attrOf(node)" :key="`Attr-${idx}`">
              <v-divider v-if="idx > 0"></v-divider>
              <v-card-text>
                <refer-text :text="attr[at]"></refer-text>
              </v-card-text>
            </template>
            <v-divider v-if="Object.keys(node.attr || {}).length > 0 && node.desc.length > 0"></v-divider>
            <template v-for="(desc, idx) in node.desc" :key="`Desc-${idx}`">
              <v-divider v-if="idx > 0"></v-divider>
              <v-card-text>
                <refer-text :text="desc[isGold ? 1 : 0]"></refer-text>
              </v-card-text>
            </template>
          </v-card>
        </v-card-text>
      </template>
    </template>
    <template v-else-if="node.type === 'term'">
      <v-card-title class="text-h5">
        {{ node.name }}
      </v-card-title>
      <v-divider></v-divider>
      <v-card-text>
        <refer-text :text="node.bref"></refer-text>
      </v-card-text>
      <template v-if="node.extr">
        <v-divider></v-divider>
        <v-card-text>
          <refer-text :text="node.extr"></refer-text>
        </v-card-text>
      </template>
    </template>
    <template v-else-if="node.type === 'unit'">
      <v-card-title class="text-h5">
        {{ node.name }}
      </v-card-title>
      <v-divider></v-divider>
      <v-card-text>
        价值 {{ node.valu }}
      </v-card-text>
      <template v-if="node.bref">
        <v-divider></v-divider>
        <v-card-text>
          <refer-text :text="node.bref"></refer-text>
        </v-card-text>
      </template>
      <template v-if="node.rmrk">
        <v-divider></v-divider>
        <v-card-text>
          <refer-text :text="node.rmrk"></refer-text>
        </v-card-text>
      </template>
    </template>
  </v-card>
</template>

<style scoped>
</style>
