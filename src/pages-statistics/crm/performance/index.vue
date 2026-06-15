<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="员工业绩"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 统计概览 -->
    <scroll-view scroll-y class="min-h-0 flex-1">
      <view class="p-24rpx">
        <!-- 筛选条件 -->
        <view class="mb-24rpx rounded-12rpx bg-white p-8rpx shadow-sm">
          <wd-form-item title="选择年份" title-width="160rpx" is-link :value="formatDate(filters.year, 'YYYY')" placeholder="请选择年份" @click="yearVisible = true" />
          <wd-datetime-picker v-model="filters.year" v-model:visible="yearVisible" title="请选择年份" type="year" @confirm="loadData" />
          <yd-tree-select
            v-model="filters.deptId"
            label="归属部门"
            label-width="160rpx"
            filterable
            :data="deptTree"
            :props="{ value: 'id', label: 'name', children: 'children' }"
            placeholder="请选择归属部门"
            @change="handleDeptChange"
          />
          <UserPicker
            ref="userPickerRef"
            v-model="filters.userId"
            type="radio"
            label="员工"
            label-width="160rpx"
            placeholder="请选择员工"
            @confirm="loadData"
          />
        </view>

        <!-- 统计周期与刷新 -->
        <view class="mb-24rpx flex items-center justify-between">
          <view class="text-26rpx text-[#999]">
            {{ periodText }}
          </view>
          <wd-button size="small" type="primary" variant="plain" :loading="loading" @click="loadData">
            刷新
          </wd-button>
        </view>

        <!-- 统计列表 -->
        <StatisticsCard
          v-for="section in sections"
          :key="section.title"
          :section="section"
          :rows="sectionData[section.title] || []"
        />
      </view>
    </scroll-view>
  </view>
</template>

<script lang="ts" setup>
import type { Dept } from '@/api/system/dept'
import type { StatisticsColumn, StatisticsSection } from '../components/statistics'
import { computed, onMounted, reactive, ref } from 'vue'
import {
  getContractCountPerformance,
  getContractPricePerformance,
  getReceivablePricePerformance,
} from '@/api/crm/statistics/performance'
import { getSimpleDeptList } from '@/api/system/dept'
import UserPicker from '@/components/system-select/user-picker.vue'
import { useUserStore } from '@/store/user'
import { navigateBackPlus } from '@/utils'
import { formatDate } from '@/utils/date'
import { handleTree } from '@/utils/tree'
import {
  getDefaultDeptId,
  getFirstDeptId,
  normalizeRows,
} from '../components/statistics'
import StatisticsCard from '../components/statistics-card.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const userStore = useUserStore()
const now = new Date()
const filters = reactive({
  year: new Date(now.getFullYear(), 0, 1).getTime(),
  deptId: getDefaultDeptId(userStore.userInfo),
  userId: undefined as number | undefined,
}) // 筛选条件
const loading = ref(false) // 统计加载状态
const deptTree = ref<Dept[]>([]) // 部门树形结构
const sectionData = ref<Record<string, any[]>>({}) // 统计数据
const yearVisible = ref(false) // 年份选择器显隐
const userPickerRef = ref<InstanceType<typeof UserPicker>>() // 员工选择器引用

const queryParams = computed(() => {
  const year = filters.year ? new Date(filters.year).getFullYear() : now.getFullYear()
  return {
    deptId: filters.deptId,
    userId: filters.userId,
    times: [
      formatDate(new Date(year, 0, 1), 'YYYY-MM-DD HH:mm:ss'),
      formatDate(new Date(year, 11, 31, 23, 59, 59), 'YYYY-MM-DD HH:mm:ss'),
    ],
  }
}) // 查询参数
const periodText = computed(() => {
  const times = queryParams.value.times || []
  return times.length === 2 ? `${formatDate(times[0])} 至 ${formatDate(times[1])}` : '默认统计周期'
})
const sections = [
  {
    title: '合同金额业绩',
    columns: performanceColumns('合同金额'),
    load: getContractPricePerformance,
    chart: performanceChart('合同金额'),
  },
  {
    title: '回款金额业绩',
    columns: performanceColumns('回款金额'),
    load: getReceivablePricePerformance,
    chart: performanceChart('回款金额'),
  },
  {
    title: '签约合同数业绩',
    columns: performanceColumns('合同数'),
    load: getContractCountPerformance,
    chart: performanceChart('合同数'),
  },
] as StatisticsSection[] // 统计分组配置

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 加载统计数据 */
async function loadData() {
  loading.value = true
  const nextData: Record<string, any[]> = {}
  try {
    await Promise.all(
      sections.map(async (section) => {
        try {
          const rows = normalizeRows(await section.load?.(queryParams.value))
          nextData[section.title] = rows.map(row => withPerformanceGrowthRate(row))
        } catch {
          nextData[section.title] = []
        }
      }),
    )
    sectionData.value = nextData
  } finally {
    loading.value = false
  }
}

/** 部门变更 */
function handleDeptChange() {
  filters.userId = undefined
  loadData()
}

/** 计算业绩增长率：环比 =(当期-上期)/上期，同比 =(当期-去年同期)/去年同期；除数为 0 时返回 null（展示为 -） */
function withPerformanceGrowthRate(row: Record<string, any>) {
  const current = Number(row.currentMonthCount) || 0
  const lastMonth = Number(row.lastMonthCount) || 0
  const lastYear = Number(row.lastYearCount) || 0
  return {
    ...row,
    momGrowthRate: lastMonth !== 0 ? (((current - lastMonth) / lastMonth) * 100).toFixed(2) : null,
    yoyGrowthRate: lastYear !== 0 ? (((current - lastYear) / lastYear) * 100).toFixed(2) : null,
  }
}

/** 业绩列：包含当期/上期/去年同期，以及环比、同比增长率 */
function performanceColumns(label: string): StatisticsColumn[] {
  return [
    { prop: 'time', label: '时间' },
    { prop: 'currentMonthCount', label: `当期${label}` },
    { prop: 'lastMonthCount', label: `上期${label}` },
    { prop: 'lastYearCount', label: `去年同期${label}` },
    { prop: 'momGrowthRate', label: '环比增长率', type: 'percent' },
    { prop: 'yoyGrowthRate', label: '同比增长率', type: 'percent' },
  ]
}

/** 业绩图表配置 */
function performanceChart(label: string): StatisticsSection['chart'] {
  return {
    type: 'line',
    categoryProp: 'time',
    money: label.includes('金额'),
    series: [
      { name: `当期${label}`, prop: 'currentMonthCount' },
      { name: `上期${label}`, prop: 'lastMonthCount' },
      { name: `去年同期${label}`, prop: 'lastYearCount' },
    ],
  }
}

/** 初始化 */
onMounted(async () => {
  deptTree.value = handleTree(await getSimpleDeptList())
  if (!filters.deptId) {
    filters.deptId = getFirstDeptId(deptTree.value)
  }
  await loadData()
})
</script>
