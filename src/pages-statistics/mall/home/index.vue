<!-- TODO @AI：从对齐 vue3 + ep 功能来看，还缺什么么？ -->
<template>
  <!-- TODO @AI：会员概览，可以有么？ -->
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="商城首页"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- TODO @AI：tabs？避免过长？类似 crm 的 -->
    <scroll-view scroll-y class="min-h-0 flex-1">
      <view class="p-24rpx">
        <!-- 核心数据：今日销售额 / 访问量 / 订单量 / 新增用户（今日 vs 昨日） -->
        <SummaryGrid class="mb-24rpx" :items="comparisonItems" reference-label="较昨日" />

        <view class="mb-24rpx flex justify-end">
          <wd-button size="small" type="primary" variant="plain" :loading="loading" @click="loadData">
            刷新
          </wd-button>
        </view>

        <!-- 运营数据：待办与商品概况，点击下钻至对应列表 -->
        <view class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm">
          <text class="mb-20rpx block text-30rpx text-[#333] font-semibold">运营数据</text>
          <view class="grid grid-cols-2 gap-20rpx">
            <view
              v-for="item in operationCards"
              :key="item.key"
              class="rounded-8rpx bg-[#f7f8fa] px-20rpx py-18rpx"
              @click="handleOpen(item.route)"
            >
              <view class="text-24rpx text-[#999]">
                {{ item.label }}
              </view>
              <view class="mt-8rpx text-34rpx text-[#333] font-semibold">
                {{ item.value }}
              </view>
            </view>
          </view>
        </view>

        <!-- 交易量趋势折线图（近 30 天） -->
        <StatisticsCard :section="trendSection" :rows="trendRows" />

        <!-- 会员漏斗：访客→下单→成交，附客单价 -->
        <view class="rounded-12rpx bg-white p-24rpx shadow-sm">
          <view class="mb-20rpx flex items-center justify-between">
            <text class="text-30rpx text-[#333] font-semibold">会员漏斗</text>
            <text class="text-26rpx text-[#999]">客单价 ￥{{ atvText }}</text>
          </view>
          <YdChart v-if="funnelOption" :option="funnelOption" height="480rpx" />
          <wd-empty v-else icon="content" tip="暂无统计数据" />
        </view>

        <!-- 底部安全区域 -->
        <view class="h-40rpx" />
      </view>
    </scroll-view>
  </view>
</template>

<script lang="ts" setup>
import type { SummaryItem } from '@/pages-statistics/components/card/summary-grid.vue'
import type { StatisticsSection } from '@/pages-statistics/utils/statistics'
import { computed, onMounted, ref } from 'vue'
import { getProductSpuTabsCount } from '@/api/mall/product/spu'
import {
  getMemberAnalyse,
  getMemberUserCountComparison,
  getTradeOrderComparison,
  getTradeOrderCount,
  getTradeStatisticsList,
  getWalletRechargePrice,
} from '@/api/mall/statistics'
import { navigateBackPlus } from '@/utils'
import { formatDateRange } from '@/utils/date'
import { fenToYuan, formatDisplayMoney } from '@/utils/format'
import { buildFunnelOption, normalizeRows } from '@/pages-statistics/utils/statistics'
import YdChart from '@/pages-statistics/components/yd-chart/yd-chart.vue'
import StatisticsCard from '@/pages-statistics/components/card/statistics-card.vue'
import SummaryGrid from '@/pages-statistics/components/card/summary-grid.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const now = new Date()
const times = formatDateRange([now.getTime() - 3600 * 1000 * 24 * 30, now.getTime()]) // 趋势/漏斗时间区间（近 30 天）

const loading = ref(false) // 统计加载状态
const orderComparison = ref<Record<string, any>>({ value: {}, reference: {} }) // 交易对照（今日 vs 昨日）
const userComparison = ref<Record<string, any>>({ value: {}, reference: {} }) // 会员对照（今日 vs 昨日）
const trendRows = ref<Record<string, any>[]>([]) // 交易趋势明细（已转元）
const analyse = ref<Record<string, any>>({}) // 会员漏斗分析

const comparisonItems = computed<SummaryItem[]>(() => [
  { label: '今日销售额', value: fenToYuan(orderComparison.value.value?.orderPayPrice), reference: fenToYuan(orderComparison.value.reference?.orderPayPrice), prefix: '￥' },
  { label: '用户访问量', value: Number(userComparison.value.value?.visitUserCount || 0), reference: Number(userComparison.value.reference?.visitUserCount || 0) },
  { label: '订单量', value: orderComparison.value.value?.orderPayCount || 0, reference: orderComparison.value.reference?.orderPayCount || 0 },
  { label: '新增用户', value: userComparison.value.value?.registerUserCount || 0, reference: userComparison.value.reference?.registerUserCount || 0 },
]) // 核心数据卡片：环比展示由 SummaryCard 自行计算

const operationCards = ref([
  { key: 'undelivered', label: '待发货订单', value: '-', route: '/pages-mall/trade/order/index' },
  { key: 'afterSaleApply', label: '退款中订单', value: '-', route: '/pages-mall/trade/after-sale/index' },
  { key: 'pickUp', label: '待核销订单', value: '-', route: '/pages-mall/trade/delivery/pick-up-order/index' },
  { key: 'productForSale', label: '上架商品', value: '-', route: '/pages-mall/product/spu/index' },
  { key: 'productWarehouse', label: '仓库商品', value: '-', route: '/pages-mall/product/spu/index' },
  { key: 'productAlertStock', label: '库存预警', value: '-', route: '/pages-mall/product/spu/index' },
  { key: 'withdrawAuditing', label: '提现待审核', value: '-', route: '/pages-mall/trade/brokerage/withdraw/index' },
  { key: 'rechargePrice', label: '账户充值', value: '-', route: '/pages-mall/trade/order/index' },
]) // 运营数据

const atvText = computed(() => fenToYuan(analyse.value.atv).toFixed(2)) // 客单价（分转元）

const trendSection: StatisticsSection = {
  title: '交易量趋势',
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

const funnelOption = computed(() => {
  const value = analyse.value
  if (!value || value.visitUserCount === undefined) {
    return undefined
  }
  // 访客→下单→成交
  return buildFunnelOption([
    { name: '访客', value: value.visitUserCount || 0 },
    { name: '下单', value: value.orderUserCount || 0 },
    { name: '成交', value: value.payUserCount || 0 },
  ], '会员漏斗')
}) // 会员漏斗图配置

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 打开下钻列表 */
function handleOpen(route: string) {
  uni.navigateTo({ url: route })
}

/** 更新运营数据 */
function updateOperationCard(key: string, value: string | number) {
  const item = operationCards.value.find(card => card.key === key)
  if (item) {
    item.value = String(value)
  }
}

/** 加载统计数据 */
async function loadData() {
  loading.value = true
  try {
    const [order, user, orderCount, productCount, paySummary, trendList, analyseData] = await Promise.allSettled([
      getTradeOrderComparison(),
      getMemberUserCountComparison(),
      getTradeOrderCount(),
      getProductSpuTabsCount(),
      getWalletRechargePrice(),
      getTradeStatisticsList({ times }),
      getMemberAnalyse({ times }),
    ])

    if (order.status === 'fulfilled') {
      orderComparison.value = order.value || { value: {}, reference: {} }
    }
    if (user.status === 'fulfilled') {
      userComparison.value = user.value || { value: {}, reference: {} }
    }
    if (orderCount.status === 'fulfilled') {
      updateOperationCard('undelivered', orderCount.value.undelivered || 0)
      updateOperationCard('afterSaleApply', orderCount.value.afterSaleApply || 0)
      updateOperationCard('pickUp', orderCount.value.pickUp || 0)
      updateOperationCard('withdrawAuditing', orderCount.value.auditingWithdraw || 0)
    }
    if (productCount.status === 'fulfilled') {
      updateOperationCard('productForSale', productCount.value['0'] || 0)
      updateOperationCard('productWarehouse', productCount.value['1'] || 0)
      updateOperationCard('productAlertStock', productCount.value['3'] || 0)
    }
    if (paySummary.status === 'fulfilled') {
      updateOperationCard('rechargePrice', formatDisplayMoney(paySummary.value.rechargePrice || 0))
    }
    if (trendList.status === 'fulfilled') {
      // 明细金额由分转元，避免折线图金额 ×100
      trendRows.value = normalizeRows(trendList.value).map(item => ({
        ...item,
        turnoverPrice: fenToYuan(item.turnoverPrice),
        orderPayPrice: fenToYuan(item.orderPayPrice),
        rechargePrice: fenToYuan(item.rechargePrice),
        expensePrice: fenToYuan(item.expensePrice),
      }))
    }
    if (analyseData.status === 'fulfilled') {
      analyse.value = analyseData.value || {}
    }
  } finally {
    loading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  loadData()
})
</script>
