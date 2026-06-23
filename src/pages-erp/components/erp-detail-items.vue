<!-- ERP 单据详情明细卡片：展示 ERP 单据 items 数组中的产品/仓库/金额等明细字段 -->
<template>
  <view v-if="items.length > 0" class="mt-24rpx">
    <view class="px-24rpx py-16rpx text-28rpx text-[#666]">
      {{ title }}
    </view>
    <view class="px-24rpx">
      <view
        v-for="(item, index) in items"
        :key="index"
        class="mb-20rpx rounded-12rpx bg-white p-24rpx shadow-sm"
      >
        <view class="mb-12rpx text-28rpx text-[#333] font-semibold">
          明细 {{ index + 1 }}
        </view>
        <view
          v-for="field in visibleFields(item)"
          :key="field.prop"
          class="mb-10rpx flex text-26rpx text-[#666]"
        >
          <text class="mr-8rpx shrink-0 text-[#999]">{{ field.label }}：</text>
          <text class="min-w-0 flex-1">{{ formatFieldValue(item, field) }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { ErpDetailItemField } from './types'
import { formatCount, formatMoney, formatNumber, formatPercent } from '@/pages-erp/utils'

const props = withDefaults(defineProps<{
  title: string
  items?: Record<string, any>[]
  fields: ErpDetailItemField[]
}>(), {
  items: () => [],
})

/** 判断字段是否有值 */
function hasValue(value: any) {
  return value !== undefined && value !== null && value !== ''
}

/** 获取可见字段 */
function visibleFields(item: Record<string, any>) {
  return props.fields.filter(field => !field.hiddenWhenEmpty || hasValue(item[field.prop]))
}

/** 格式化字段展示 */
function formatFieldValue(item: Record<string, any>, field: ErpDetailItemField) {
  const value = item[field.prop]
  if (field.formatter) {
    return field.formatter(value, item)
  }
  if (field.type === 'money') {
    return formatMoney(value)
  }
  if (field.type === 'count') {
    return formatCount(value)
  }
  if (field.type === 'percent') {
    return formatPercent(value)
  }
  if (field.type === 'number') {
    return formatNumber(value)
  }
  if (!hasValue(value)) {
    return '-'
  }
  return String(value)
}
</script>
