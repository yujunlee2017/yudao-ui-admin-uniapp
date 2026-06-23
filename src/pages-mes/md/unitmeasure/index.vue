<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="计量单位"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 搜索与导出 -->
    <SearchForm @search="handleQuery" @reset="handleReset" />
    <view v-if="canExport" class="bg-white px-24rpx pb-16rpx">
      <wd-button block variant="plain" :loading="exportLoading" @click="handleExport">
        导出当前筛选数据
      </wd-button>
    </view>

    <!-- 计量单位列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无计量单位数据"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
          @click="handleDetail(item)"
        >
          <view class="mb-16rpx flex items-start justify-between gap-16rpx">
            <view class="min-w-0 flex-1">
              <view class="truncate text-32rpx text-[#333] font-semibold">
                {{ item.name || '-' }}
              </view>
              <view class="mt-8rpx truncate text-24rpx text-[#999]">
                {{ item.code || '-' }}
              </view>
            </view>
            <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="item.status" />
          </view>
          <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">单位类型：</text>
            <dict-tag :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="item.primaryFlag" />
          </view>
          <view v-if="!item.primaryFlag" class="mb-12rpx text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">换算比例：</text>{{ formatChangeRate(item.changeRate) }}
          </view>
          <view v-if="item.remark" class="mb-12rpx text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">备注：</text>{{ item.remark }}
          </view>
          <view v-if="item.createTime" class="text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">创建时间：</text>{{ formatDateTime(item.createTime) }}
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 新增按钮 -->
    <wd-fab
      v-if="hasAccessByCodes(['mes:md-unit-measure:create'])"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />
  </view>
</template>

<script lang="ts" setup>
import type { MdUnitMeasurePageParam, MdUnitMeasureVO } from '@/api/mes/md/unitmeasure'
import type { ZPagingRef } from 'z-paging'
import { onUnload } from '@dcloudio/uni-app'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { getUnitMeasurePage } from '@/api/mes/md/unitmeasure'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import { downloadApiFile } from '@/utils/download'
import SearchForm from './components/search-form.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const toast = useToast()
const list = ref<MdUnitMeasureVO[]>([]) // 列表数据
const pagingRef = ref<ZPagingRef<MdUnitMeasureVO>>() // 分页组件引用
const queryParams = ref<MdUnitMeasurePageParam>({}) // 查询参数
const exportLoading = ref(false) // 导出状态
const canExport = computed(() => hasAccessByCodes(['mes:md-unit-measure:export']))

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/home/index')
}

/** 格式化换算比例 */
function formatChangeRate(value?: number) {
  return value === undefined || value === null ? '-' : String(value)
}

/** 查询计量单位列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const params = {
      ...queryParams.value,
      pageNo,
      pageSize,
    }
    if (params.status === -1) {
      delete params.status
    }
    const data = await getUnitMeasurePage(params)
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 搜索按钮操作 */
function handleQuery(data?: MdUnitMeasurePageParam) {
  queryParams.value = { ...data }
  reload()
}

/** 重置按钮操作 */
function handleReset() {
  handleQuery()
}

/** 重新加载 */
function reload() {
  pagingRef.value?.reload()
}

/** 导出计量单位 */
async function handleExport() {
  if (exportLoading.value) {
    return
  }
  const { confirm } = await uni.showModal({
    title: '导出确认',
    content: '确定要导出当前筛选条件下的计量单位吗？',
  })
  if (!confirm) {
    return
  }
  const params = { ...queryParams.value }
  if (params.status === -1) {
    delete params.status
  }
  exportLoading.value = true
  try {
    await downloadApiFile('/mes/md/unit-measure/export-excel', params, '计量单位.xls')
    toast.success('导出成功')
  } finally {
    exportLoading.value = false
  }
}

/** 新增计量单位 */
function handleAdd() {
  uni.navigateTo({ url: '/pages-mes/md/unitmeasure/form/index' })
}

/** 查看详情 */
function handleDetail(item: MdUnitMeasureVO) {
  uni.navigateTo({ url: `/pages-mes/md/unitmeasure/detail/index?id=${item.id}` })
}

/** 初始化 */
onMounted(() => {
  uni.$on('mes:md:unitmeasure:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('mes:md:unitmeasure:reload', reload)
})
</script>
