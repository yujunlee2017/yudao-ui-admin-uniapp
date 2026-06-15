<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="客户统计"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 统计概览 -->
    <scroll-view scroll-y class="min-h-0 flex-1">
      <view class="p-24rpx">
        <!-- 筛选条件 -->
        <view class="mb-24rpx rounded-12rpx bg-white p-8rpx shadow-sm">
          <wd-form-item
            title="开始日期"
            title-width="160rpx"
            is-link
            :value="formatDate(filters.startTime)"
            placeholder="请选择开始日期"
            @click="startVisible = true"
          />
          <wd-datetime-picker
            v-model="filters.startTime"
            v-model:visible="startVisible"
            title="请选择开始日期"
            type="date"
            @confirm="loadData"
          />
          <wd-form-item
            title="结束日期"
            title-width="160rpx"
            is-link
            :value="formatDate(filters.endTime)"
            placeholder="请选择结束日期"
            @click="endVisible = true"
          />
          <wd-datetime-picker
            v-model="filters.endTime"
            v-model:visible="endVisible"
            title="请选择结束日期"
            type="date"
            @confirm="loadData"
          />
          <wd-form-item
            title="时间间隔"
            title-width="160rpx"
            is-link
            :value="intervalLabel"
            placeholder="请选择时间间隔"
            @click="intervalVisible = true"
          />
          <wd-picker
            v-model:visible="intervalVisible"
            :model-value="filters.interval"
            title="请选择时间间隔"
            :columns="intervalColumns"
            @confirm="handleIntervalConfirm"
          />
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
import type { StatisticsSection } from '../components/statistics'
import { computed, onMounted, reactive, ref } from 'vue'
import {
  getContractSummary,
  getCustomerDealCycleByArea,
  getCustomerDealCycleByProduct,
  getCustomerDealCycleByUser,
  getCustomerSummaryByDate,
  getCustomerSummaryByUser,
  getFollowUpSummaryByDate,
  getFollowUpSummaryByType,
  getPoolSummaryByDate,
} from '@/api/crm/statistics/customer'
import { getSimpleDeptList } from '@/api/system/dept'
import UserPicker from '@/components/system-select/user-picker.vue'
import { getDictLabel, getIntDictOptions } from '@/hooks/useDict'
import { useUserStore } from '@/store/user'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate, formatDateRange } from '@/utils/date'
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
  startTime: now.getTime() - 3600 * 1000 * 24 * 30,
  endTime: now.getTime(),
  interval: 2,
  deptId: getDefaultDeptId(userStore.userInfo),
  userId: undefined as number | undefined,
}) // 筛选条件
const loading = ref(false) // 统计加载状态
const deptTree = ref<Dept[]>([]) // 部门树形结构
const sectionData = ref<Record<string, any[]>>({}) // 统计数据
const startVisible = ref(false) // 开始日期选择器显隐
const endVisible = ref(false) // 结束日期选择器显隐
const intervalVisible = ref(false) // 时间间隔选择器显隐
const userPickerRef = ref<InstanceType<typeof UserPicker>>() // 员工选择器引用

const intervalColumns = computed(() => // 时间间隔选项
  getIntDictOptions(DICT_TYPE.DATE_INTERVAL).map(dict => ({ value: dict.value, label: dict.label })),
)
const intervalLabel = computed(() => getDictLabel(DICT_TYPE.DATE_INTERVAL, filters.interval)) // 时间间隔展示文案
const queryParams = computed(() => ({
  deptId: filters.deptId,
  interval: filters.interval,
  userId: filters.userId,
  times: formatDateRange([filters.startTime, filters.endTime]),
})) // 查询参数
const periodText = computed(() => {
  const times = queryParams.value.times || []
  return times.length === 2 ? `${formatDate(times[0])} 至 ${formatDate(times[1])}` : '默认统计周期'
})

const customerColumns = [
  { prop: 'time', label: '时间' },
  { prop: 'customerCreateCount', label: '新增客户' },
  { prop: 'customerDealCount', label: '成交客户' },
]
const sections = [
  {
    title: '客户总量（按日期）',
    columns: customerColumns,
    load: getCustomerSummaryByDate,
    chart: {
      type: 'line',
      categoryProp: 'time',
      series: [
        { name: '新增客户', prop: 'customerCreateCount' },
        { name: '成交客户', prop: 'customerDealCount' },
      ],
    },
  },
  {
    title: '客户总量（按用户）',
    columns: [
      { prop: 'ownerUserName', label: '负责人' },
      { prop: 'customerCreateCount', label: '新增客户' },
      { prop: 'customerDealCount', label: '成交客户' },
      { prop: 'contractPrice', label: '合同金额', type: 'money' },
      { prop: 'receivablePrice', label: '回款金额', type: 'money' },
    ],
    load: getCustomerSummaryByUser,
    chart: {
      type: 'bar',
      categoryProp: 'ownerUserName',
      series: [
        { name: '新增客户', prop: 'customerCreateCount' },
        { name: '成交客户', prop: 'customerDealCount' },
      ],
    },
  },
  {
    title: '跟进次数（按日期）',
    columns: [
      { prop: 'time', label: '时间' },
      { prop: 'followUpRecordCount', label: '跟进次数' },
      { prop: 'followUpCustomerCount', label: '跟进客户数' },
    ],
    load: getFollowUpSummaryByDate,
    chart: {
      type: 'line',
      categoryProp: 'time',
      series: [
        { name: '跟进次数', prop: 'followUpRecordCount' },
        { name: '跟进客户数', prop: 'followUpCustomerCount' },
      ],
    },
  },
  {
    title: '跟进方式',
    columns: [
      { prop: 'followUpType', label: '方式' },
      { prop: 'followUpRecordCount', label: '次数' },
    ],
    load: getFollowUpSummaryByType,
    chart: { type: 'pie', categoryProp: 'followUpType', valueProp: 'followUpRecordCount' },
  },
  {
    title: '合同摘要',
    columns: [
      { prop: 'customerName', label: '客户' },
      { prop: 'contractName', label: '合同' },
      { prop: 'totalPrice', label: '合同金额', type: 'money' },
      { prop: 'receivablePrice', label: '回款金额', type: 'money' },
    ],
    load: getContractSummary,
  },
  {
    title: '公海分析',
    columns: [
      { prop: 'time', label: '时间' },
      { prop: 'customerPutCount', label: '放入公海' },
      { prop: 'customerTakeCount', label: '领取公海' },
    ],
    load: getPoolSummaryByDate,
    chart: {
      type: 'line',
      categoryProp: 'time',
      series: [
        { name: '放入公海', prop: 'customerPutCount' },
        { name: '领取公海', prop: 'customerTakeCount' },
      ],
    },
  },
  {
    title: '成交周期（按用户）',
    columns: [
      { prop: 'ownerUserName', label: '负责人' },
      { prop: 'customerDealCycle', label: '成交周期' },
      { prop: 'customerDealCount', label: '成交客户' },
    ],
    load: getCustomerDealCycleByUser,
    chart: { type: 'bar', categoryProp: 'ownerUserName', series: [{ name: '成交周期', prop: 'customerDealCycle' }] },
  },
  {
    title: '成交周期（按地区）',
    columns: [
      { prop: 'areaName', label: '地区' },
      { prop: 'customerDealCycle', label: '成交周期' },
      { prop: 'customerDealCount', label: '成交客户' },
    ],
    load: getCustomerDealCycleByArea,
    chart: { type: 'bar', categoryProp: 'areaName', series: [{ name: '成交周期', prop: 'customerDealCycle' }] },
  },
  {
    title: '成交周期（按产品）',
    columns: [
      { prop: 'productName', label: '产品' },
      { prop: 'customerDealCycle', label: '成交周期' },
      { prop: 'customerDealCount', label: '成交客户' },
    ],
    load: getCustomerDealCycleByProduct,
    chart: { type: 'bar', categoryProp: 'productName', series: [{ name: '成交周期', prop: 'customerDealCycle' }] },
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
          nextData[section.title] = normalizeRows(await section.load?.(queryParams.value))
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

/** 时间间隔确认 */
function handleIntervalConfirm({ value }: { value: (number | string)[] }) {
  filters.interval = Number(value[0])
  loadData()
}

/** 部门变更 */
function handleDeptChange() {
  filters.userId = undefined
  loadData()
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
