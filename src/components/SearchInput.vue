<script setup>
import { ref } from 'vue'
import bus from '../bus'

const attribs = {
  insert: '定点部署',
  gold: '无法三连',
  origin: '原始虫群',
  dark: '黑暗容器',
  void: '虚空投影'
}

const starRange = ref([1, 6])
const raceRange = ref(['T', 'P', 'Z', 'M'])
const attrReq = ref([])
const groupType = ref('none')

function emitQueryInfo () {
  const levelLow = starRange.value[0]
  const levelHigh = starRange.value[1]
  const raceReq = [ ...raceRange.value ]
  let filters = []
  if (groupType.value !== 'star') {
    filters.push(c => c.level >= levelLow && c.level <= levelHigh)
  }
  if (groupType.value !== 'race') {
    filters.push(c => raceReq.indexOf(c.race) !== -1)
  }
  for (const a of attrReq.value) {
    filters.push(c => c.attr && a in c.attr)
  }
  bus.emit('cardFilter', {
    filter: c => {
      for (const f of filters) {
        if (!f(c)) {
          return false
        }
      }
      return true
    },
    groupby: groupType.value
  })
}
const race = ref({
  T: '人族',
  P: '神族',
  Z: '虫族',
  M: '中立'
})
</script>

<template>
  <v-card>
    <v-card-text>
      分组方式
      <v-radio-group v-model="groupType" inline>
        <v-radio value="none" label="无"></v-radio>
        <v-radio value="race" label="种族"></v-radio>
        <v-radio value="star" label="星级"></v-radio>
      </v-radio-group>
    </v-card-text>
    <v-card-text v-if="groupType !== 'star'">
      <v-range-slider v-model="starRange" :step="1" :min="0" :max="7">
        <template v-slot:prepend>
          星级范围
        </template>
        <template v-slot:append>
          {{ `${starRange[0]} ~ ${starRange[1]}` }}
        </template>
      </v-range-slider>
    </v-card-text>
    <v-card-text v-if="groupType !== 'race'">
      <v-row>
        <v-col v-for="(d, r) in race" :key="r">
          <v-switch hide-details color="primary" v-model="raceRange" :label="d" :value="r"></v-switch>
        </v-col>
      </v-row>
    </v-card-text>
    <v-card-text>
      <v-row>
        <v-col v-for="(d, a) in attribs" :key="a">
          <v-switch hide-details color="primary" v-model="attrReq" :label="d" :value="a"></v-switch>
        </v-col>
      </v-row>
    </v-card-text>
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn color="primary" @click="emitQueryInfo()">筛选</v-btn>
    </v-card-actions>
  </v-card>
</template>
