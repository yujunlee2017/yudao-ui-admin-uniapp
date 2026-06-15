<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="排行榜"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 搜索组件 -->
    <SearchForm
      :dept-tree="deptTree"
      :dept-id="filters.deptId"
      :initial-start-time="defaultStartTime"
      :initial-end-time="defaultEndTime"
      :default-dept-id="defaultDeptId"
      @search="handleQuery"
      @reset="handleReset"
    />

    <!-- 排行分类 -->
    <view class="bg-white">
      <wd-tabs v-model="tabIndex" slidable="always" @change="handleTabChange">
        <wd-tab v-for="section in sections" :key="section.title" :title="section.title" />
      </wd-tabs>
    </view>

    <!-- 排行数据 -->
    <scroll-view scroll-y class="min-h-0 flex-1">
      <view class="p-24rpx">
        <view class="mb-24rpx flex items-center justify-between">
          <view class="text-26rpx text-[#999]">
            {{ periodText }}
          </view>
          <wd-button size="small" type="primary" variant="plain" :loading="loading" @click="loadData">
            刷新
          </wd-button>
        </view>
        <StatisticsCard rank :section="activeSection" :rows="rows" />
      </view>
    </scroll-view>
  </view>
</template>

<script lang="ts" setup>
import type { Dept } from '@/api/system/dept'
import type { StatisticsSection } from '../components/statistics'
import { computed, onMounted, reactive, ref } from 'vue'
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
import { useUserStore } from '@/store/user'
import { navigateBackPlus } from '@/utils'
import { formatDate, formatDateRange } from '@/utils/date'
import { handleTree } from '@/utils/tree'
import SearchForm from '../components/search-form.vue'
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
const defaultStartTime = now.getTime() - 3600 * 1000 * 24 * 30 // 默认开始日期
const defaultEndTime = now.getTime() // 默认结束日期
const defaultDeptId = ref(getDefaultDeptId(userStore.userInfo)) // 默认归属部门
const filters = reactive({
  startTime: defaultStartTime,
  endTime: defaultEndTime,
  deptId: defaultDeptId.value,
}) // 筛选条件
const deptTree = ref<Dept[]>([]) // 部门树形结构
const loading = ref(false) // 统计加载状态
const rows = ref<Record<string, any>[]>([]) // 当前排行数据
const tabIndex = ref(0) // 当前排行分类下标

const rankColumns = [
  { prop: 'nickname', label: '员工' },
  { prop: 'deptName', label: '部门' },
  { prop: 'count', label: '数值' },
]
const sections = [
  { title: '合同金额排行', columns: rankColumns, load: getContractPriceRank, chart: rankChart(true) },
  { title: '回款金额排行', columns: rankColumns, load: getReceivablePriceRank, chart: rankChart(true) },
  { title: '签约合同排行', columns: rankColumns, load: getContractCountRank, chart: rankChart() },
  { title: '产品销量排行', columns: rankColumns, load: getProductSalesRank, chart: rankChart() },
  { title: '新增客户排行', columns: rankColumns, load: getCustomerCountRank, chart: rankChart() },
  { title: '新增联系人数排行', columns: rankColumns, load: getContactsCountRank, chart: rankChart() },
  { title: '跟进次数排行', columns: rankColumns, load: getFollowCountRank, chart: rankChart() },
  { title: '跟进客户数排行', columns: rankColumns, load: getFollowCustomerCountRank, chart: rankChart() },
] // 排行分类配置
const activeSection = computed(() => sections[tabIndex.value] || sections[0]) // 当前排行分类
const queryParams = computed(() => ({
  deptId: filters.deptId,
  times: formatDateRange([filters.startTime, filters.endTime]),
})) // 查询参数
const periodText = computed(() => {
  const times = queryParams.value.times || []
  return times.length === 2 ? `${formatDate(times[0])} 至 ${formatDate(times[1])}` : '默认统计周期'
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 加载统计数据 */
async function loadData() {
  loading.value = true
  try {
    rows.value = normalizeRows(await activeSection.value.load(queryParams.value))
  } catch {
    rows.value = []
  } finally {
    loading.value = false
  }
}

/** 搜索按钮操作 */
function handleQuery(data: Record<string, any>) {
  filters.startTime = data.startTime
  filters.endTime = data.endTime
  filters.deptId = data.deptId
  loadData()
}

/** 重置按钮操作 */
function handleReset() {
  filters.startTime = defaultStartTime
  filters.endTime = defaultEndTime
  filters.deptId = defaultDeptId.value || getFirstDeptId(deptTree.value)
  loadData()
}

/** 排行分类切换 */
function handleTabChange({ index }: { index: number }) {
  tabIndex.value = index
  loadData()
}

/** 排行榜图表配置 */
function rankChart(money = false): StatisticsSection['chart'] {
  return {
    type: 'bar',
    categoryProp: 'nickname',
    money,
    series: [{ name: '数值', prop: 'count' }],
  }
}

/** 初始化 */
onMounted(async () => {
  deptTree.value = handleTree(await getSimpleDeptList())
  if (!filters.deptId) {
    filters.deptId = getFirstDeptId(deptTree.value)
    defaultDeptId.value = filters.deptId
  }
  await loadData()
})
</script>
