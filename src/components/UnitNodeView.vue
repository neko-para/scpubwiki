<script setup>
import ReferText from './ReferText.vue'
import { data, tr } from '../../data'

const props = defineProps({
  node: Object
})

const target = {
  G: '地面单位',
  A: '空中单位',
  GA: '空中和地面单位'
}

function calcWeapon (wp) {
  const r = []
  r.push(`伤害: ${wp.damage}`)
  if (wp.multiple) {
    r.push(`多重攻击: ${wp.multiple}`)
  }
  r.push(`攻击范围: ${wp.range}`)
  r.push(`武器速度: ${wp.speed}`)
  r.push(`目标: ${target[wp.target]}`)
  return r.join('\n')
}

function calcArmor (a) {
  const r = []
  r.push(`护甲: ${a.defense}`)
  if (a.speed) {
    r.push(`移动速度: ${a.speed}`)
  }
  return r.join('\n')
}

</script>

<template>
  <v-card-title class="text-h5">
    {{ node.name }}
  </v-card-title>
  <v-divider></v-divider>
  <v-card-text>
    价值 {{ node.value }}
  </v-card-text>
  <template v-if="node.tag">
    <v-divider></v-divider>
    <v-card-text>
      <v-chip>
        生命 {{ node.health }}
      </v-chip>
      <v-chip v-if="node.shield">
        护盾 {{ node.shield }}
      </v-chip>
      <v-chip v-if="node.power">
        能量 {{ node.power }}
      </v-chip>
      <v-chip v-for="(t, i) in node.tag" :key="`Tag-${i}`">
        {{ t }}
      </v-chip>
    </v-card-text>
    <v-divider></v-divider>
    <v-card-title>
      武器 护甲
    </v-card-title>
    <v-card-text>
      <v-card>
        <template v-for="(wp, i) in node.weapon" :key="`Weap-${i}`">
          <v-divider v-if="i > 0"></v-divider>
          <v-card-title>{{ wp.name }}</v-card-title>
          <v-card-text>
            <refer-text :text="calcWeapon(wp)"></refer-text>
          </v-card-text>
        </template>
        <v-divider></v-divider>
        <v-card-title>{{ node.armor.name }}</v-card-title>
        <v-card-text>
          <refer-text :text="calcArmor(node.armor)"></refer-text>
        </v-card-text>
        <template v-if="node.sarmor">  
          <v-divider></v-divider>
          <v-card-title>{{ node.sarmor.name }}</v-card-title>
          <v-card-text>
            <refer-text :text="calcArmor(node.sarmor)"></refer-text>
          </v-card-text>
        </template>
      </v-card>
    </v-card-text>
  </template>
  <template v-if="node.name.endsWith('(精英)')">
    <v-divider></v-divider>
    <v-card-text>
      <refer-text :text="`作为${node.name.substring(0, node.name.length - 4)}的精英变种`"></refer-text>
    </v-card-text>
  </template>
  <template v-else-if="`${node.name}(精英)` in data">
    <v-divider></v-divider>
    <v-card-text>
      <refer-text :text="`存在精英变种${node.name}(精英)`"></refer-text>
    </v-card-text>
  </template>
  <template v-if="node.utyp !== 'normal'">
    <v-divider></v-divider>
    <v-card-text>
      <refer-text :text="tr[node.utyp]"></refer-text>
    </v-card-text>
  </template>
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
