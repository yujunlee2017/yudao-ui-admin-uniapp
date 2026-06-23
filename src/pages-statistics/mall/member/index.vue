<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="会员统计"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- TODO @AI：是不是要 tabs？ -->
    <scroll-view scroll-y class="min-h-0 flex-1">
      <view class="p-24rpx">
        <!-- 会员概览：累计会员数等 4 项（累计值，无环比） -->
        <SummaryGrid class="mb-24rpx" :items="summaryItems" />

        <!-- 搜索组件（用于会员漏斗的时间区间） -->
        <SearchForm
          class="mb-24rpx"
          :initial-start-time="defaultStartTime"
          :initial-end-time="defaultEndTime"
          @search="handleQuery"
          @reset="handleReset"
        />

        <!-- 统计周期与刷新 -->
        <view class="mb-24rpx flex items-center justify-between">
          <!-- TODO @AI：这里是不是不用噢？因为 search 那已经展示了 -->
          <view class="text-26rpx text-[#999]">
            {{ periodText }}
          </view>
          <wd-button size="small" type="primary" variant="plain" :loading="loading" @click="loadData">
            刷新
          </wd-button>
        </view>

        <!-- 会员漏斗：访客→下单→成交，附客单价 -->
        <view class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm">
          <view class="mb-20rpx flex items-center justify-between">
            <text class="text-30rpx text-[#333] font-semibold">会员漏斗</text>
            <text class="text-26rpx text-[#999]">客单价 ￥{{ atvText }}</text>
          </view>
          <YdChart v-if="funnelOption" :option="funnelOption" height="480rpx" />
          <wd-empty v-else icon="content" tip="暂无统计数据" />
        </view>

        <!-- 终端分布 -->
        <StatisticsCard :section="terminalSection" :rows="terminalRows" />

        <!-- 性别比例 -->
        <StatisticsCard :section="sexSection" :rows="sexRows" />

        <!-- 地域分布（移动端以排行表呈现，不渲染地图） -->
        <!-- TODO @AI：有没更好的呈现方式？ -->
        <StatisticsCard :section="areaSection" :rows="areaRows" />
      </view>
    </scroll-view>
  </view>
</template>

<script lang="ts" setup>
import type { SummaryItem } from '../components/summary-grid.vue'
import type { StatisticsSection } from '../components/statistics'
import { computed, onMounted, reactive, ref } from 'vue'
import {
  getMemberAnalyse,
  getMemberAreaStatisticsList,
  getMemberSexStatisticsList,
  getMemberSummary,
  getMemberTerminalStatisticsList,
} from '@/api/mall/statistics'
import { getDictLabel } from '@/hooks/useDict'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate, formatDateRange } from '@/utils/date'
import YdChart from '../../components/yd-chart/yd-chart.vue'
import SearchForm from '../components/search-form.vue'
import { buildChartOption, fenToYuan, normalizeRows } from '../components/statistics'
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
const summary = ref<Record<string, any>>({}) // 会员累计概览
const analyse = ref<Record<string, any>>({}) // 会员漏斗分析
const terminalRows = ref<Record<string, any>[]>([]) // 终端分布（含字典标签）
const sexRows = ref<Record<string, any>[]>([]) // 性别分布（含字典标签）
const areaRows = ref<Record<string, any>[]>([]) // 地域分布（已转元）

const times = computed(() => formatDateRange([filters.startTime, filters.endTime])) // 查询时间区间
const periodText = computed(() => {
  const range = times.value || []
  return range.length === 2 ? `${formatDate(range[0])} 至 ${formatDate(range[1])}` : '默认统计周期'
})
const atvText = computed(() => fenToYuan(analyse.value.atv).toFixed(2)) // 客单价（分转元）

const summaryItems = computed<SummaryItem[]>(() => [
  { label: '累计会员数', value: summary.value.userCount || 0 },
  { label: '累计充值人数', value: summary.value.rechargeUserCount || 0 },
  { label: '累计充值金额', value: fenToYuan(summary.value.rechargePrice), prefix: '￥' },
  { label: '累计消费金额', value: fenToYuan(summary.value.expensePrice), prefix: '￥' },
]) // 会员概览卡片

const funnelOption = computed(() => {
  const value = analyse.value
  if (!value || value.visitUserCount === undefined) {
    return undefined
  }
  // 通用漏斗：访客→下单→成交
  return buildChartOption({
    title: '会员漏斗',
    chart: {
      type: 'funnel',
      funnelData: [
        { name: '访客', value: value.visitUserCount || 0 },
        { name: '下单', value: value.orderUserCount || 0 },
        { name: '成交', value: value.payUserCount || 0 },
      ],
    },
  }, [])
}) // 会员漏斗图配置

const terminalSection: StatisticsSection = {
  title: '终端分布',
  columns: [
    { prop: 'terminalName', label: '终端' },
    { prop: 'userCount', label: '会员数' },
  ],
  chart: { type: 'pie', categoryProp: 'terminalName', valueProp: 'userCount' },
} // 终端分布分组配置

const sexSection: StatisticsSection = {
  title: '性别比例',
  columns: [
    { prop: 'sexName', label: '性别' },
    { prop: 'userCount', label: '会员数' },
  ],
  chart: { type: 'pie', categoryProp: 'sexName', valueProp: 'userCount' },
} // 性别比例分组配置

const areaSection: StatisticsSection = {
  title: '地域分布',
  columns: [
    { prop: 'areaName', label: '省份' },
    { prop: 'userCount', label: '会员数' },
    { prop: 'orderCreateUserCount', label: '下单数' },
    { prop: 'orderPayUserCount', label: '支付数' },
    { prop: 'orderPayPrice', label: '支付金额', type: 'money' },
  ],
} // 地域分布分组配置

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 加载统计数据 */
async function loadData() {
  loading.value = true
  try {
    const [summaryData, analyseData, terminalData, sexData, areaData] = await Promise.all([
      getMemberSummary().catch(() => ({})),
      getMemberAnalyse({ times: times.value }).catch(() => ({})),
      getMemberTerminalStatisticsList().catch(() => []),
      getMemberSexStatisticsList().catch(() => []),
      getMemberAreaStatisticsList().catch(() => []),
    ])
    summary.value = summaryData || {}
    analyse.value = analyseData || {}
    // 终端、性别使用字典标签，而非原始 code
    terminalRows.value = normalizeRows(terminalData).map(item => ({
      ...item,
      terminalName: getDictLabel(DICT_TYPE.TERMINAL, item.terminal) || '未知',
    }))
    sexRows.value = normalizeRows(sexData).map(item => ({
      ...item,
      sexName: getDictLabel(DICT_TYPE.SYSTEM_USER_SEX, item.sex) || '未知',
    }))
    // 地域支付金额由分转元
    areaRows.value = normalizeRows(areaData).map(item => ({
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
