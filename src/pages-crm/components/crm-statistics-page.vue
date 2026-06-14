<!-- TODO @AI：应该拿到所属模块的 components 里 -->
<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      :title="pageTitle"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 统计概览 -->
    <scroll-view scroll-y class="min-h-0 flex-1">
      <view class="p-24rpx">
        <!-- 筛选条件 -->
        <view class="mb-24rpx rounded-12rpx bg-white p-8rpx shadow-sm">
          <!-- 业绩模式：选择年份 -->
          <template v-if="mode === 'performance'">
            <wd-form-item
              title="选择年份"
              title-width="160rpx"
              is-link
              :value="formatDate(filters.year, 'YYYY')"
              placeholder="请选择年份"
              @click="yearVisible = true"
            />
            <wd-datetime-picker
              v-model="filters.year"
              v-model:visible="yearVisible"
              title="请选择年份"
              type="year"
              @confirm="handleFilterChange"
            />
          </template>
          <!-- 其余模式：起止时间 -->
          <template v-else>
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
              @confirm="handleFilterChange"
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
              @confirm="handleFilterChange"
            />
          </template>

          <!-- 时间间隔（仅客户、漏斗模式支持） -->
          <template v-if="supportInterval">
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
          </template>

          <!-- 归属部门（除画像外大多模式支持） -->
          <yd-tree-select
            v-if="supportDept"
            v-model="filters.deptId"
            label="归属部门"
            label-width="160rpx"
            filterable
            :data="deptTree"
            :props="{ value: 'id', label: 'name', children: 'children' }"
            placeholder="请选择归属部门"
            @change="handleDeptChange"
          />

          <!-- 员工（客户、漏斗、业绩、画像模式支持） -->
          <UserPicker
            v-if="supportUser"
            ref="userPickerRef"
            v-model="filters.userId"
            type="radio"
            label="员工"
            label-width="160rpx"
            placeholder="请选择员工"
            @confirm="handleFilterChange"
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

        <view
          v-for="section in sections"
          :key="section.title"
          class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
        >
          <view class="mb-20rpx flex items-center justify-between">
            <text class="text-30rpx text-[#333] font-semibold">{{ section.title }}</text>
            <wd-tag type="primary" variant="plain">
              {{ getRows(section).length }} 条
            </wd-tag>
          </view>

          <view v-if="getRows(section).length > 0">
            <view
              v-for="(row, index) in getVisibleRows(section)"
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
              v-if="getRows(section).length > DEFAULT_VISIBLE_ROWS"
              class="border-t border-[#f5f5f5] pt-16rpx text-center text-26rpx text-[--wot-color-theme]"
              @click="toggleExpand(section)"
            >
              {{ expandedSections[section.title] ? '收起' : `展开更多（共 ${getRows(section).length} 条）` }}
            </view>
            <!-- 数据量过大时仅展示前 MAX_VISIBLE_ROWS 条 -->
            <view
              v-if="getRows(section).length > MAX_VISIBLE_ROWS"
              class="pt-8rpx text-center text-24rpx text-[#bbb]"
            >
              仅展示前 {{ MAX_VISIBLE_ROWS }} 条
            </view>
          </view>
          <wd-empty v-else icon="content" tip="暂无统计数据" />
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script lang="ts" setup>
import type { Dept } from '@/api/system/dept'
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
import {
  getBusinessInversionRateSummaryByDate,
  getBusinessPageByDate,
  getBusinessSummaryByDate,
  getBusinessSummaryByEndStatus,
  getFunnelSummary,
} from '@/api/crm/statistics/funnel'
import {
  getContractCountPerformance,
  getContractPricePerformance,
  getReceivablePricePerformance,
} from '@/api/crm/statistics/performance'
import {
  getCustomerArea,
  getCustomerIndustry,
  getCustomerLevel,
  getCustomerSource,
} from '@/api/crm/statistics/portrait'
import {
  getContactsCountRank,
  getContractCountRank,
  getContractPriceRank,
  getCustomerCountRank,
  getFollowCountRank,
  getFollowCustomerCountRank,
  getProductSalesRank,
  getReceivablePriceRank,
} from '@/api/crm/statistics/rank'
import { getSimpleDeptList } from '@/api/system/dept'
import UserPicker from '@/components/system-select/user-picker.vue'
import { getDictLabel, getIntDictOptions } from '@/hooks/useDict'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate, formatDateRange } from '@/utils/date'
import { handleTree } from '@/utils/tree'

type StatisticsMode = 'customer' | 'funnel' | 'performance' | 'portrait' | 'rank'

interface StatisticsColumn {
  prop: string
  label: string
  dictType?: string
  type?: 'money' | 'percent'
}

interface StatisticsSection {
  title: string
  columns?: StatisticsColumn[]
  load: (params: Record<string, any>) => Promise<any>
}

const props = defineProps<{
  mode: StatisticsMode
}>()

const DEFAULT_VISIBLE_ROWS = 10 // 默认展示行数（折叠态）
const MAX_VISIBLE_ROWS = 50 // 展开后的最大展示行数，避免渲染超大列表

const loading = ref(false) // 统计加载状态
const sectionData = ref<Record<string, any[]>>({}) // 统计数据
const expandedSections = reactive<Record<string, boolean>>({}) // 各分组的展开状态
const deptTree = ref<Dept[]>([]) // 部门树形结构
const userPickerRef = ref<InstanceType<typeof UserPicker>>() // 员工选择器引用

const startVisible = ref(false) // 开始日期选择器显隐
const endVisible = ref(false) // 结束日期选择器显隐
const yearVisible = ref(false) // 年份选择器显隐
const intervalVisible = ref(false) // 时间间隔选择器显隐

const now = new Date()
const filters = reactive({ // 筛选条件：时间用时间戳便于 picker 绑定，最终通过 formatDateRange 转换成接口需要的 times
  // 性能模式默认本年；其余模式默认最近 30 天
  startTime: now.getTime() - 3600 * 1000 * 24 * 30, // 开始日期（时间戳）
  endTime: now.getTime(), // 结束日期（时间戳）
  year: new Date(now.getFullYear(), 0, 1).getTime(), // 业绩模式选择的年份（时间戳）
  interval: 2, // 时间间隔，2 = 周（DATE_INTERVAL 字典）
  deptId: undefined as number | undefined, // 归属部门
  userId: undefined as number | undefined, // 员工
})

const intervalColumns = computed(() => // 时间间隔选项
  getIntDictOptions(DICT_TYPE.DATE_INTERVAL).map(dict => ({ value: dict.value, label: dict.label })),
)
const intervalLabel = computed(() => getDictLabel(DICT_TYPE.DATE_INTERVAL, filters.interval)) // 时间间隔展示文案
const supportInterval = computed(() => props.mode === 'customer' || props.mode === 'funnel') // 是否支持时间间隔
const supportDept = computed(() => props.mode !== 'portrait') // 是否支持归属部门（画像不支持）
const supportUser = computed(() => props.mode !== 'rank') // 是否支持员工（排行榜不支持）

const queryParams = computed(() => createQueryParams(props.mode))
const pageTitle = computed(() => {
  const titleMap: Record<StatisticsMode, string> = {
    customer: '客户统计',
    funnel: '销售漏斗',
    performance: '员工业绩',
    portrait: '客户画像',
    rank: '排行榜',
  }
  return titleMap[props.mode]
})
const periodText = computed(() => {
  const times = queryParams.value.times || []
  return times.length === 2 ? `${formatDate(times[0])} 至 ${formatDate(times[1])}` : '默认统计周期'
})

const customerColumns: StatisticsColumn[] = [
  { prop: 'time', label: '时间' },
  { prop: 'customerCreateCount', label: '新增客户' },
  { prop: 'customerDealCount', label: '成交客户' },
]
const rankColumns: StatisticsColumn[] = [
  { prop: 'nickname', label: '员工' },
  { prop: 'deptName', label: '部门' },
  { prop: 'count', label: '数值' },
]

const sectionMap: Record<StatisticsMode, StatisticsSection[]> = {
  customer: [
    { title: '客户总量（按日期）', columns: customerColumns, load: getCustomerSummaryByDate },
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
    },
    {
      title: '跟进次数（按日期）',
      columns: [
        { prop: 'time', label: '时间' },
        { prop: 'followUpRecordCount', label: '跟进次数' },
        { prop: 'followUpCustomerCount', label: '跟进客户数' },
      ],
      load: getFollowUpSummaryByDate,
    },
    {
      title: '跟进方式',
      columns: [
        { prop: 'followUpType', label: '方式' },
        { prop: 'followUpRecordCount', label: '次数' },
      ],
      load: getFollowUpSummaryByType,
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
    },
    {
      title: '成交周期（按用户）',
      columns: [
        { prop: 'ownerUserName', label: '负责人' },
        { prop: 'customerDealCycle', label: '成交周期' },
        { prop: 'customerDealCount', label: '成交客户' },
      ],
      load: getCustomerDealCycleByUser,
    },
    {
      title: '成交周期（按地区）',
      columns: [
        { prop: 'areaName', label: '地区' },
        { prop: 'customerDealCycle', label: '成交周期' },
        { prop: 'customerDealCount', label: '成交客户' },
      ],
      load: getCustomerDealCycleByArea,
    },
    {
      title: '成交周期（按产品）',
      columns: [
        { prop: 'productName', label: '产品' },
        { prop: 'customerDealCycle', label: '成交周期' },
        { prop: 'customerDealCount', label: '成交客户' },
      ],
      load: getCustomerDealCycleByProduct,
    },
  ],
  funnel: [
    {
      title: '销售漏斗',
      columns: [
        { prop: 'customerCount', label: '客户数' },
        { prop: 'businessCount', label: '商机数' },
        { prop: 'businessWinCount', label: '赢单数' },
      ],
      load: getFunnelSummary,
    },
    {
      title: '商机结束状态',
      columns: [
        { prop: 'endStatus', label: '阶段', dictType: DICT_TYPE.CRM_BUSINESS_END_STATUS_TYPE },
        { prop: 'businessCount', label: '商机数' },
        { prop: 'totalPrice', label: '商机金额', type: 'money' },
      ],
      load: getBusinessSummaryByEndStatus,
    },
    {
      title: '新增商机',
      columns: [
        { prop: 'time', label: '时间' },
        { prop: 'businessCreateCount', label: '新增商机' },
        { prop: 'totalPrice', label: '商机金额', type: 'money' },
      ],
      load: getBusinessSummaryByDate,
    },
    {
      title: '商机转化率',
      columns: [
        { prop: 'time', label: '时间' },
        { prop: 'businessCount', label: '商机数' },
        { prop: 'businessWinCount', label: '赢单数' },
      ],
      load: getBusinessInversionRateSummaryByDate,
    },
    {
      title: '商机列表',
      columns: [
        { prop: 'name', label: '商机名称' },
        { prop: 'customerName', label: '客户' },
        { prop: 'totalPrice', label: '商机金额', type: 'money' },
        { prop: 'statusName', label: '阶段' },
      ],
      load: loadBusinessPage,
    },
  ],
  performance: [
    { title: '合同金额业绩', columns: performanceColumns('合同金额'), load: getContractPricePerformance },
    { title: '回款金额业绩', columns: performanceColumns('回款金额'), load: getReceivablePricePerformance },
    { title: '签约合同数业绩', columns: performanceColumns('合同数'), load: getContractCountPerformance },
  ],
  portrait: [
    {
      title: '地区分布',
      columns: portraitColumns('areaName', '地区'),
      load: getCustomerArea,
    },
    {
      title: '客户级别',
      columns: portraitColumns('level', '级别', DICT_TYPE.CRM_CUSTOMER_LEVEL),
      load: getCustomerLevel,
    },
    {
      title: '客户来源',
      columns: portraitColumns('source', '来源', DICT_TYPE.CRM_CUSTOMER_SOURCE),
      load: getCustomerSource,
    },
    {
      title: '所属行业',
      columns: portraitColumns('industryId', '行业', DICT_TYPE.CRM_CUSTOMER_INDUSTRY),
      load: getCustomerIndustry,
    },
  ],
  rank: [
    { title: '合同金额排行', columns: rankColumns, load: getContractPriceRank },
    { title: '回款金额排行', columns: rankColumns, load: getReceivablePriceRank },
    { title: '签约合同排行', columns: rankColumns, load: getContractCountRank },
    { title: '产品销量排行', columns: rankColumns, load: getProductSalesRank },
    { title: '新增客户排行', columns: rankColumns, load: getCustomerCountRank },
    { title: '新增联系人数排行', columns: rankColumns, load: getContactsCountRank },
    { title: '跟进次数排行', columns: rankColumns, load: getFollowCountRank },
    { title: '跟进客户数排行', columns: rankColumns, load: getFollowCustomerCountRank },
  ],
}

const sections = computed<StatisticsSection[]>(() => sectionMap[props.mode])

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 加载商机列表（分页接口，仅取列表数据展示） */
async function loadBusinessPage(params: Record<string, any>) {
  const data = await getBusinessPageByDate({ pageNo: 1, pageSize: 20, ...params })
  return data?.list || []
}

/** 加载统计数据 */
async function loadData() {
  loading.value = true
  const nextData: Record<string, any[]> = {}
  try {
    await Promise.all(
      sections.value.map(async (section) => {
        try {
          let rows = normalizeRows(await section.load(queryParams.value))
          // 业绩模式：根据当期/上期/去年同期补充环比、同比增长率
          if (props.mode === 'performance') {
            rows = rows.map(row => withPerformanceGrowthRate(row))
          }
          nextData[section.title] = rows
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

/** 筛选条件变更后重新查询 */
function handleFilterChange() {
  loadData()
}

/** 时间间隔确认：wd-picker 返回数组，取首项 */
function handleIntervalConfirm({ value }: { value: (number | string)[] }) {
  filters.interval = Number(value[0])
  loadData()
}

/** 部门变更：切换部门时清空已选员工后再查询 */
function handleDeptChange() {
  filters.userId = undefined
  loadData()
}

/** 切换分组展开状态 */
function toggleExpand(section: StatisticsSection) {
  expandedSections[section.title] = !expandedSections[section.title]
}

/** 获取分组数据 */
function getRows(section: StatisticsSection) {
  return sectionData.value[section.title] || []
}

/** 获取分组可见数据：折叠时取默认行数，展开时最多取 MAX_VISIBLE_ROWS 条 */
function getVisibleRows(section: StatisticsSection) {
  const rows = getRows(section)
  if (expandedSections[section.title]) {
    return rows.slice(0, MAX_VISIBLE_ROWS)
  }
  return rows.slice(0, DEFAULT_VISIBLE_ROWS)
}

/** 格式化字段值 */
function formatColumnValue(row: Record<string, any>, column: StatisticsColumn) {
  const value = row[column.prop]
  if (value === undefined || value === null || value === '') {
    return '-'
  }
  if (column.dictType) {
    return getDictLabel(column.dictType, value) || String(value)
  }
  if (column.type === 'money') {
    const amount = Number(value)
    return Number.isNaN(amount) ? String(value) : amount.toFixed(2)
  }
  if (column.type === 'percent') {
    return `${value}%`
  }
  return String(value)
}

/** 格式化未知结构 */
function formatEntries(row: Record<string, any>) {
  return Object.entries(row)
    .filter(([, value]) => typeof value !== 'object')
    .map(([label, value]) => ({ label, value: value === undefined || value === null || value === '' ? '-' : String(value) }))
}

/** 统一转换统计结果 */
function normalizeRows(data: any) {
  if (Array.isArray(data)) {
    return data
  }
  if (!data) {
    return []
  }
  return [data]
}

/** 创建查询参数 */
function createQueryParams(mode: StatisticsMode): Record<string, any> {
  // 业绩模式按年份统计：起止时间为所选年份的 1 月 1 日 ~ 12 月 31 日
  if (mode === 'performance') {
    const year = filters.year ? new Date(filters.year).getFullYear() : now.getFullYear()
    return {
      deptId: filters.deptId,
      userId: filters.userId,
      times: [
        formatDate(new Date(year, 0, 1), 'YYYY-MM-DD HH:mm:ss'),
        formatDate(new Date(year, 11, 31, 23, 59, 59), 'YYYY-MM-DD HH:mm:ss'),
      ],
    }
  }
  // 其余模式按起止日期统计，formatDateRange 会补齐当天 00:00:00 ~ 23:59:59
  const times = formatDateRange([filters.startTime, filters.endTime])
  const params: Record<string, any> = { times }
  if (supportInterval.value) {
    params.interval = filters.interval
  }
  if (supportDept.value) {
    params.deptId = filters.deptId
  }
  if (supportUser.value) {
    params.userId = filters.userId
  }
  return params
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

/** 画像列 */
function portraitColumns(prop: string, label: string, dictType?: string): StatisticsColumn[] {
  return [
    { prop, label, dictType },
    { prop: 'customerCount', label: '客户数' },
    { prop: 'dealCount', label: '成交数' },
    { prop: 'dealPortion', label: '成交占比', type: 'percent' },
  ]
}

/** 初始化 */
onMounted(async () => {
  // 加载部门树（画像模式无部门筛选，无需加载）
  if (supportDept.value) {
    deptTree.value = handleTree(await getSimpleDeptList())
  }
  loadData()
})
</script>
