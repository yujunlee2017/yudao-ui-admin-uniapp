<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="商品统计"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <scroll-view scroll-y class="min-h-0 flex-1">
      <view class="p-24rpx">
        <!-- 搜索组件 -->
        <SearchForm
          class="mb-24rpx"
          :initial-start-time="defaultStartTime"
          :initial-end-time="defaultEndTime"
          @search="handleQuery"
          @reset="handleReset"
        />

        <view class="mb-24rpx flex justify-end">
          <wd-button size="small" type="primary" variant="plain" :loading="loading" @click="loadData">
            刷新
          </wd-button>
        </view>

        <!-- 商品概况：浏览量等 6 项 -->
        <view class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm">
          <text class="mb-20rpx block text-30rpx text-[#333] font-semibold">商品概况</text>
          <SummaryGrid :items="summaryItems" reference-label="较前一周期" />
        </view>

        <!-- 商品趋势折线图 -->
        <StatisticsCard :section="trendSection" :rows="trendRows" />

        <!-- 商品排行 -->
        <StatisticsCard rank :section="rankSection" :rows="rankRows" />
      </view>
    </scroll-view>
  </view>
</template>

<script lang="ts" setup>
import type { SummaryItem } from '@/pages-statistics/components/card/summary-grid.vue'
import type { StatisticsSection } from '@/pages-statistics/utils/statistics'
import { computed, onMounted, reactive, ref } from 'vue'
import {
  getProductStatisticsAnalyse,
  getProductStatisticsList,
  getProductStatisticsRankPage,
} from '@/api/mall/statistics'
import { navigateBackPlus } from '@/utils'
import { formatDateRange } from '@/utils/date'
import SearchForm from '../components/search-form.vue'
import { fenToYuan } from '@/utils/format'
import { normalizeRows } from '@/pages-statistics/utils/statistics'
import StatisticsCard from '@/pages-statistics/components/card/statistics-card.vue'
import SummaryGrid from '@/pages-statistics/components/card/summary-grid.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const now = new Date()
const defaultStartTime = now.getTime() - 3600 * 1000 * 24 * 30 // 默认开始日期
const defaultEndTime = now.getTime() // 默认结束日期
const filters = reactive({
  startTime: defaultStartTime,
  endTime: defaultEndTime,
}) // 筛选条件
const loading = ref(false) // 统计加载状态
const summary = ref<Record<string, any>>({ value: {}, reference: {} }) // 商品概况
const trendRows = ref<Record<string, any>[]>([]) // 商品趋势明细（已转元）
const rankRows = ref<Record<string, any>[]>([]) // 商品排行明细（已转元）

const times = computed(() => formatDateRange([filters.startTime, filters.endTime])) // 查询时间区间

const summaryItems = computed<SummaryItem[]>(() => {
  const value = summary.value.value || {}
  const reference = summary.value.reference || {}
  return [
    { label: '浏览量', value: value.browseCount || 0, reference: reference.browseCount },
    { label: '访客数', value: value.browseUserCount || 0, reference: reference.browseUserCount },
    { label: '支付件数', value: value.orderPayCount || 0, reference: reference.orderPayCount },
    { label: '支付金额', value: fenToYuan(value.orderPayPrice), reference: fenToYuan(reference.orderPayPrice), prefix: '￥' },
    { label: '退款件数', value: value.afterSaleCount || 0, reference: reference.afterSaleCount },
    { label: '退款金额', value: fenToYuan(value.afterSaleRefundPrice), reference: fenToYuan(reference.afterSaleRefundPrice), prefix: '￥' },
  ]
}) // 商品概况卡片

const trendSection: StatisticsSection = {
  title: '商品趋势',
  columns: [
    { prop: 'time', label: '时间' },
    { prop: 'browseCount', label: '浏览量' },
    { prop: 'browseUserCount', label: '访客数' },
    { prop: 'orderPayPrice', label: '支付金额', type: 'money' },
    { prop: 'afterSaleRefundPrice', label: '退款金额', type: 'money' },
  ],
  chart: {
    type: 'line',
    categoryProp: 'time',
    series: [
      { name: '浏览量', prop: 'browseCount', type: 'line' },
      { name: '访客数', prop: 'browseUserCount', type: 'line' },
      { name: '支付金额', prop: 'orderPayPrice', type: 'bar' },
      { name: '退款金额', prop: 'afterSaleRefundPrice', type: 'bar' },
    ],
  },
} // 商品趋势分组配置

const rankSection: StatisticsSection = {
  title: '商品排行',
  columns: [
    { prop: 'name', label: '商品' },
    { prop: 'browseCount', label: '浏览量' },
    { prop: 'browseUserCount', label: '访客数' },
    { prop: 'orderPayCount', label: '支付件数' },
    { prop: 'orderPayPrice', label: '支付金额', type: 'money' },
    { prop: 'browseConvertPercent', label: '访客-支付转化率', type: 'percent' },
  ],
  chart: {
    type: 'bar',
    categoryProp: 'name',
    series: [{ name: '支付金额', prop: 'orderPayPrice' }],
    money: true,
  },
} // 商品排行分组配置

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 加载统计数据 */
async function loadData() {
  loading.value = true
  try {
    const params = { times: times.value }
    const [summaryData, listData, rankData] = await Promise.all([
      getProductStatisticsAnalyse(params).catch(() => ({ value: {}, reference: {} })),
      getProductStatisticsList(params).catch(() => []),
      getProductStatisticsRankPage({ pageNo: 1, pageSize: 20, times: times.value }).catch(() => ({ list: [] })),
    ])
    summary.value = summaryData || { value: {}, reference: {} }
    // 明细金额由分转元，避免金额 ×100
    trendRows.value = normalizeRows(listData).map(item => ({
      ...item,
      orderPayPrice: fenToYuan(item.orderPayPrice),
      afterSaleRefundPrice: fenToYuan(item.afterSaleRefundPrice),
    }))
    rankRows.value = normalizeRows(rankData?.list).map(item => ({
      ...item,
      orderPayPrice: fenToYuan(item.orderPayPrice),
    }))
  } finally {
    loading.value = false
  }
}

/** 搜索按钮操作 */
function handleQuery(data: { endTime: number, startTime: number }) {
  filters.startTime = data.startTime
  filters.endTime = data.endTime
  loadData()
}

/** 重置按钮操作 */
function handleReset() {
  filters.startTime = defaultStartTime
  filters.endTime = defaultEndTime
  loadData()
}

/** 初始化 */
onMounted(() => {
  loadData()
})
</script>
