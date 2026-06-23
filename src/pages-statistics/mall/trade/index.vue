<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="交易统计"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <scroll-view scroll-y class="min-h-0 flex-1">
      <view class="p-24rpx">
        <!-- 交易概览：昨日/本月 订单数与支付金额 -->
        <SummaryGrid class="mb-24rpx" :items="summaryItems" reference-label="较前一周期" />

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

        <!-- 交易状况：营业额等 7 项金额 -->
        <view class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm">
          <text class="mb-20rpx block text-30rpx text-[#333] font-semibold">交易状况</text>
          <SummaryGrid :items="trendItems" reference-label="较前一周期" />
        </view>

        <!-- 交易趋势折线图 -->
        <StatisticsCard :section="trendSection" :rows="trendRows" />
      </view>
    </scroll-view>
  </view>
</template>

<script lang="ts" setup>
import type { SummaryItem } from '../components/summary-grid.vue'
import type { StatisticsSection } from '../components/statistics'
import { computed, onMounted, reactive, ref } from 'vue'
import {
  getTradeStatisticsAnalyse,
  getTradeStatisticsList,
  getTradeStatisticsSummary,
} from '@/api/mall/statistics'
import { navigateBackPlus } from '@/utils'
import { formatDateRange } from '@/utils/date'
import SearchForm from '../components/search-form.vue'
import { fenToYuan, normalizeRows } from '../components/statistics'
import StatisticsCard from '../components/statistics-card.vue'
import SummaryGrid from '../components/summary-grid.vue'

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
const summary = ref<Record<string, any>>({ value: {}, reference: {} }) // 交易概览（昨日/本月）
const trend = ref<Record<string, any>>({ value: {}, reference: {} }) // 交易状况概览
const trendRows = ref<Record<string, any>[]>([]) // 交易趋势明细（已转元）

const times = computed(() => formatDateRange([filters.startTime, filters.endTime])) // 查询时间区间

const summaryItems = computed<SummaryItem[]>(() => [
  { label: '昨日订单数', value: summary.value.value?.yesterdayOrderCount || 0, reference: summary.value.reference?.yesterdayOrderCount },
  { label: '本月订单数', value: summary.value.value?.monthOrderCount || 0, reference: summary.value.reference?.monthOrderCount },
  { label: '昨日支付金额', value: fenToYuan(summary.value.value?.yesterdayPayPrice), reference: fenToYuan(summary.value.reference?.yesterdayPayPrice), prefix: '￥' },
  { label: '本月支付金额', value: fenToYuan(summary.value.value?.monthPayPrice), reference: fenToYuan(summary.value.reference?.monthPayPrice), prefix: '￥' },
]) // 交易概览卡片
const trendItems = computed<SummaryItem[]>(() => {
  const value = trend.value.value || {}
  const reference = trend.value.reference || {}
  // 营业额、商品支付、充值、支出、余额支付、支付佣金、商品退款
  const props = ['turnoverPrice', 'orderPayPrice', 'rechargePrice', 'expensePrice', 'walletPayPrice', 'brokerageSettlementPrice', 'afterSaleRefundPrice']
  const labels = ['营业额', '商品支付', '充值', '支出', '余额支付', '支付佣金', '商品退款']
  return props.map((prop, index) => ({
    label: labels[index],
    value: fenToYuan(value[prop]),
    reference: fenToYuan(reference[prop]),
    prefix: '￥',
  }))
}) // 交易状况卡片

const trendSection: StatisticsSection = {
  title: '交易趋势',
  columns: [
    { prop: 'time', label: '时间' },
    { prop: 'turnoverPrice', label: '营业额', type: 'money' },
    { prop: 'orderPayPrice', label: '商品支付', type: 'money' },
    { prop: 'rechargePrice', label: '充值', type: 'money' },
    { prop: 'expensePrice', label: '支出', type: 'money' },
  ],
  chart: {
    type: 'line',
    categoryProp: 'time',
    money: true,
    series: [
      { name: '营业额', prop: 'turnoverPrice' },
      { name: '商品支付', prop: 'orderPayPrice' },
      { name: '充值', prop: 'rechargePrice' },
      { name: '支出', prop: 'expensePrice' },
    ],
  },
} // 交易趋势分组配置

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 加载统计数据 */
async function loadData() {
  loading.value = true
  try {
    const params = { times: times.value }
    const [summaryData, trendData, listData] = await Promise.all([
      getTradeStatisticsSummary().catch(() => ({ value: {}, reference: {} })),
      getTradeStatisticsAnalyse(params).catch(() => ({ value: {}, reference: {} })),
      getTradeStatisticsList(params).catch(() => []),
    ])
    summary.value = summaryData || { value: {}, reference: {} }
    trend.value = trendData || { value: {}, reference: {} }
    // 明细金额由分转元，避免折线图金额 ×100
    trendRows.value = normalizeRows(listData).map(item => ({
      ...item,
      turnoverPrice: fenToYuan(item.turnoverPrice),
      orderPayPrice: fenToYuan(item.orderPayPrice),
      rechargePrice: fenToYuan(item.rechargePrice),
      expensePrice: fenToYuan(item.expensePrice),
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
