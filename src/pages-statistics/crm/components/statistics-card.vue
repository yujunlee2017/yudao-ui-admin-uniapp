<template>
  <view class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm">
    <view class="mb-20rpx flex items-center justify-between">
      <text class="text-30rpx text-[#333] font-semibold">{{ section.title }}</text>
      <wd-tag type="primary" variant="plain">
        {{ rows.length }} 条
      </wd-tag>
    </view>

    <!-- 统计图表 -->
    <YdChart
      v-if="chartOption"
      class="mb-20rpx"
      :option="chartOption"
      :height="getChartHeight(section, { rank })"
    />

    <view v-if="rows.length > 0">
      <view
        v-for="(row, index) in visibleRows"
        :key="index"
        class="border-t border-[#f5f5f5] py-16rpx"
      >
        <template v-if="section.columns?.length">
          <view
            v-for="column in section.columns"
            :key="column.prop"
            class="mb-8rpx flex items-center justify-between gap-16rpx text-28rpx"
          >
            <text class="shrink-0 text-[#999]">{{ column.label }}</text>
            <text class="min-w-0 flex-1 text-right text-[#333]">{{ formatColumnValue(row, column) }}</text>
          </view>
        </template>
        <template v-else>
          <view
            v-for="entry in formatEntries(row)"
            :key="entry.label"
            class="mb-8rpx flex items-center justify-between gap-16rpx text-28rpx"
          >
            <text class="shrink-0 text-[#999]">{{ entry.label }}</text>
            <text class="min-w-0 flex-1 text-right text-[#333]">{{ entry.value }}</text>
          </view>
        </template>
      </view>

      <!-- 展开更多 / 收起：超过默认展示行数时出现 -->
      <view
        v-if="rows.length > DEFAULT_VISIBLE_ROWS"
        class="border-t border-[#f5f5f5] pt-16rpx text-center text-26rpx text-[--wot-color-theme]"
        @click="expanded = !expanded"
      >
        {{ expanded ? '收起' : `展开更多（共 ${rows.length} 条）` }}
      </view>
      <!-- 数据量过大时仅展示前 MAX_VISIBLE_ROWS 条 -->
      <view
        v-if="rows.length > MAX_VISIBLE_ROWS"
        class="pt-8rpx text-center text-24rpx text-[#bbb]"
      >
        仅展示前 {{ MAX_VISIBLE_ROWS }} 条
      </view>
    </view>
    <wd-empty v-else icon="content" tip="暂无统计数据" />
  </view>
</template>

<script lang="ts" setup>
// TODO @芋艿：这里后续要考虑下，要不要作为公用部分？还是这么做就是合理的？？？
import type { StatisticsSection } from './statistics'
import { computed, ref } from 'vue'
import YdChart from '../../components/yd-chart/yd-chart.vue'
import {
  buildChartOption,
  DEFAULT_VISIBLE_ROWS,
  formatColumnValue,
  formatEntries,
  getChartHeight,
  MAX_VISIBLE_ROWS,
} from './statistics'

const props = withDefaults(defineProps<{
  rank?: boolean
  rows?: Record<string, any>[]
  section: StatisticsSection
}>(), {
  rank: false,
  rows: () => [],
})

const expanded = ref(false) // 展开状态
const chartOption = computed(() => buildChartOption(props.section, props.rows, { rank: props.rank })) // 图表配置
const visibleRows = computed(() => { // 当前可见数据
  if (expanded.value) {
    return props.rows.slice(0, MAX_VISIBLE_ROWS)
  }
  return props.rows.slice(0, DEFAULT_VISIBLE_ROWS)
})
</script>
