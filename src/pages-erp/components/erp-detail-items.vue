<!-- ERP 单据详情明细卡片：展示 ERP 单据 items 数组中的产品/仓库/金额等明细字段 -->
<!-- TODO @AI：每个模块自己写，不做这种统一的； -->
<!-- TODO @Yunai：本组件用「itemFields 配置 + v-for + 按 type 分支 formatFieldValue」生成明细每行字段，
     属 AGENTS.md 明确禁止的「字段配置数组 + v-for + 类型分支」迷你 descriptions 引擎。
     规范要求明细行内每个字段逐个显式写（对标 el-descriptions-item / wd-cell）。
     建议改为：保留外层 v-for(item) 渲染明细行，但行内字段在每个 detail 页逐个 <wd-cell> 显式声明，
     删除本组件与各页的 itemFields 配置。涉及 13 个 detail 页：
     purchase/{order,in,return}、sale/{order,out,return}、stock/{in,out,move,check}、finance/{payment,receipt}。
     若权衡后保留（13 页明细字段高度重复），需在迁移文档登记此例外。 -->
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
