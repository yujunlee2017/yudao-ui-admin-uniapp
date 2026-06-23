<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar title="排班计划" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 搜索组件 -->
    <SearchForm ref="searchFormRef" @search="handleQuery" @reset="handleReset" />

    <!-- 导出入口 -->
    <view v-if="hasAccessByCodes(['mes:cal-plan:export'])" class="bg-white px-24rpx py-16rpx">
      <view
        class="h-64rpx flex items-center justify-center border-2rpx border-[#1677ff] rounded-8rpx text-26rpx text-[#1677ff]"
        :class="exportLoading ? 'opacity-60' : ''"
        @click="handleExport"
      >
        {{ exportLoading ? '导出中...' : '导出当前筛选数据' }}
      </view>
    </view>

    <!-- 分页列表 -->
    <z-paging ref="pagingRef" v-model="list" :fixed="false" class="min-h-0 flex-1" :default-page-size="10" :refresher-enabled="true" :inside-more="true" :loading-more-default-as-loading="true" empty-view-text="暂无排班计划数据" @query="queryList">
      <view class="p-24rpx">
        <view v-for="item in list" :key="item.id" class="mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm">
          <view class="p-24rpx" @click="handleDetail(item)">
            <view class="mb-16rpx flex items-start justify-between gap-16rpx">
              <view class="min-w-0 flex-1">
                <view class="truncate text-32rpx text-[#333] font-semibold">
                  {{ item.name || '-' }}
                </view>
                <view class="mt-4rpx text-24rpx text-[#999]">
                  {{ item.code || '-' }}
                </view>
              </view>
              <dict-tag v-if="item.status != null" :type="DICT_TYPE.MES_CAL_PLAN_STATUS" :value="item.status" />
            </view>
            <view class="mb-12rpx flex flex-wrap gap-12rpx">
              <dict-tag v-if="item.calendarType != null" :type="DICT_TYPE.MES_CAL_CALENDAR_TYPE" :value="item.calendarType" />
              <dict-tag v-if="item.shiftType != null" :type="DICT_TYPE.MES_CAL_SHIFT_TYPE" :value="item.shiftType" />
              <dict-tag v-if="item.shiftMethod != null" :type="DICT_TYPE.MES_CAL_SHIFT_METHOD" :value="item.shiftMethod" />
            </view>
            <view class="text-26rpx text-[#666] space-y-8rpx">
              <view>计划日期：{{ formatDate(item.startDate) || '-' }} 至 {{ formatDate(item.endDate) || '-' }}</view>
              <view v-if="item.shiftCount">
                倒班天数：{{ item.shiftCount }} 天
              </view>
              <view v-if="item.remark">
                备注：{{ item.remark }}
              </view>
              <view>创建时间：{{ formatDateTime(item.createTime) || '-' }}</view>
            </view>
          </view>
          <view class="flex border-t border-[#f3f4f6] text-26rpx">
            <view v-if="isPrepare(item) && hasAccessByCodes(['mes:cal-plan:update'])" class="flex-1 py-18rpx text-center text-[#1677ff]" @click="handleEdit(item)">
              编辑
            </view>
            <view v-if="isPrepare(item) && hasAccessByCodes(['mes:cal-plan:delete'])" class="flex-1 py-18rpx text-center text-[#f56c6c]" @click="handleDelete(item)">
              删除
            </view>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 新增按钮 -->
    <wd-fab v-if="hasAccessByCodes(['mes:cal-plan:create'])" position="right-bottom" type="primary" :expandable="false" @click="handleAdd" />
  </view>
</template>

<script lang="ts" setup>
import type { CalPlanQueryParams, CalPlanVO } from '@/api/mes/cal/plan'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref } from 'vue'
import { deletePlan, getPlanPage } from '@/api/mes/cal/plan'
import { downloadApiFile } from '@/utils/download'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate, formatDateTime } from '@/utils/date'
import SearchForm from './components/search-form.vue'

const MesCalPlanStatusEnum = {
  PREPARE: 0,
  CONFIRMED: 1,
} as const

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const dialog = useDialog()
const toast = useToast()
const list = ref<CalPlanVO[]>([]) // 列表数据
const pagingRef = ref<ZPagingRef<CalPlanVO>>() // 分页组件引用
const queryParams = ref<Partial<CalPlanQueryParams>>({}) // 查询参数
const searchFormRef = ref<InstanceType<typeof SearchForm>>() // 搜索组件引用
const exportLoading = ref(false) // 导出状态

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/home/index')
}

/** 是否草稿状态 */
function isPrepare(item: CalPlanVO) {
  return item.status === MesCalPlanStatusEnum.PREPARE
}

/** 查询排班计划列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getPlanPage({ ...queryParams.value, pageNo, pageSize })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 搜索按钮操作 */
function handleQuery(data: Partial<CalPlanQueryParams>) {
  queryParams.value = { ...data }
  reload()
}

/** 重置按钮操作 */
function handleReset() {
  queryParams.value = {}
  searchFormRef.value?.resetFields()
  reload()
}

/** 重新加载 */
function reload() {
  pagingRef.value?.reload()
}

/** 导出排班计划 */
async function handleExport() {
  if (exportLoading.value) {
    return
  }
  const { confirm } = await uni.showModal({
    title: '导出确认',
    content: '确定要导出当前筛选数据吗？',
  })
  if (!confirm) {
    return
  }
  exportLoading.value = true
  try {
    await downloadApiFile('/mes/cal/plan/export-excel', queryParams.value, '排班计划.xls')
  } finally {
    exportLoading.value = false
  }
}

/** 新增排班计划 */
function handleAdd() {
  uni.navigateTo({ url: '/pages-mes/cal/plan/form/index' })
}

/** 查看详情 */
function handleDetail(item: CalPlanVO) {
  if (!item.id) {
    return
  }
  uni.navigateTo({ url: `/pages-mes/cal/plan/detail/index?id=${item.id}` })
}

/** 编辑排班计划 */
function handleEdit(item: CalPlanVO) {
  if (!item.id) {
    return
  }
  uni.navigateTo({ url: `/pages-mes/cal/plan/form/index?id=${item.id}` })
}

/** 删除排班计划 */
async function handleDelete(item: CalPlanVO) {
  if (!item.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '删除确认',
      msg: `确定要删除「${item.name || item.code}」排班计划吗？删除后会级联清理班次和计划班组关联。`,
    })
  } catch {
    return
  }
  await deletePlan(item.id)
  toast.success('删除成功')
  reload()
}

onMounted(() => {
  uni.$on('mes:cal:plan:reload', reload)
})

onUnload(() => {
  uni.$off('mes:cal:plan:reload', reload)
})
</script>
