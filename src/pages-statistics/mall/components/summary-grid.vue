<template>
  <!-- 指标卡片网格 -->
  <view class="grid grid-cols-2 gap-16rpx">
    <view
      v-for="item in items"
      :key="item.label"
      class="rounded-12rpx bg-white p-24rpx shadow-sm"
    >
      <text class="text-26rpx text-[#999]">{{ item.label }}</text>
      <view class="mt-12rpx flex items-end gap-4rpx">
        <text v-if="item.prefix" class="text-28rpx text-[#333] font-semibold">{{ item.prefix }}</text>
        <text class="text-40rpx text-[#333] font-semibold leading-none">{{ formatValue(item) }}</text>
      </view>
      <!-- 较参考值的环比增长率 -->
      <view v-if="item.reference !== undefined" class="mt-12rpx flex items-center gap-6rpx text-24rpx">
        <text class="text-[#bbb]">{{ referenceLabel }}</text>
        <text :class="rateClass(item)">{{ rateText(item) }}</text>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { calculateRelativeRate } from './statistics'

export interface SummaryItem {
  label: string
  value: number
  reference?: number // 对比参考值，存在时展示环比
  prefix?: string // 前缀，如金额 ￥
}

const props = withDefaults(defineProps<{
  items: SummaryItem[]
  referenceLabel?: string // 对比说明文案
}>(), {
  referenceLabel: '较昨日',
})

/** 格式化数值（金额前缀场景保留两位小数） */
function formatValue(item: SummaryItem) {
  const value = Number(item.value || 0)
  if (Number.isNaN(value)) {
    return String(item.value ?? '-')
  }
  return item.prefix ? value.toFixed(2) : String(value)
}

/** 计算环比增长率 */
function rate(item: SummaryItem) {
  return calculateRelativeRate(item.value, item.reference)
}

/** 环比增长率文案 */
function rateText(item: SummaryItem) {
  const value = rate(item)
  return `${value > 0 ? '+' : ''}${value}%`
}

/** 环比增长率配色：增长红、下降绿 */
function rateClass(item: SummaryItem) {
  const value = rate(item)
  if (value > 0) {
    return 'text-[#f5222d]'
  }
  if (value < 0) {
    return 'text-[#52c41a]'
  }
  return 'text-[#999]'
}

defineExpose({ items: props.items })
</script>
