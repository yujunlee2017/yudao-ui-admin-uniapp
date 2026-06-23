<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="MES 点检项目管理"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 搜索组件 -->
    <SearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 导出入口 -->
    <view v-if="hasAccessByCodes(['mes:dv-subject:export'])" class="bg-white px-24rpx py-16rpx">
      <view
        class="h-64rpx flex items-center justify-center border-2rpx border-[#1677ff] rounded-8rpx text-26rpx text-[#1677ff]"
        :class="exportLoading ? 'opacity-60' : ''"
        @click="handleExport"
      >
        {{ exportLoading ? '导出中...' : '导出当前筛选数据' }}
      </view>
    </view>

    <!-- 列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无点检项目数据"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm"
          @click="handleDetail(item)"
        >
          <view class="p-24rpx">
            <view class="mb-16rpx flex items-center justify-between gap-16rpx">
              <view class="min-w-0 flex-1 truncate text-32rpx text-[#333] font-semibold">
                {{ item.name || item.code || '-' }}
              </view>
              <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="item.status" />
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">项目编码：</text>
              <text class="min-w-0 flex-1 truncate">{{ item.code || '-' }}</text>
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">项目类型：</text>
              <dict-tag :type="DICT_TYPE.MES_DV_SUBJECT_TYPE" :value="item.type" />
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">项目内容：</text>
              <text class="min-w-0 flex-1 truncate">{{ item.content || '-' }}</text>
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">标准：</text>
              <text class="min-w-0 flex-1 truncate">{{ item.standard || '-' }}</text>
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">创建时间：</text>
              <text class="min-w-0 flex-1 truncate">{{ formatDateTime(item.createTime) || '-' }}</text>
            </view>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 新增按钮 -->
    <wd-fab
      v-if="hasAccessByCodes(['mes:dv-subject:create'])"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />
  </view>
</template>

<script lang="ts" setup>
import type { DvSubjectQueryParams, DvSubjectVO } from '@/api/mes/dv/subject'
import { onUnload } from '@dcloudio/uni-app'
import { onMounted, ref } from 'vue'
import { getSubjectPage } from '@/api/mes/dv/subject'
import { downloadApiFile } from '@/utils/download'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import SearchForm from './components/search-form.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const list = ref<DvSubjectVO[]>([]) // 列表数据
const pagingRef = ref<ZPagingRef<DvSubjectVO>>() // 分页组件引用
const queryParams = ref<DvSubjectQueryParams>({}) // 查询参数
const exportLoading = ref(false) // 导出状态

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/home/index')
}

/** 查询列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const params = {
      ...queryParams.value,
      pageNo,
      pageSize,
    }
    const data = await getSubjectPage(params)
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 搜索按钮操作 */
function handleQuery(data?: DvSubjectQueryParams) {
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

/** 导出按钮操作 */
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
    await downloadApiFile('/mes/dv/subject/export-excel', queryParams.value, '点检保养项目.xls')
  } finally {
    exportLoading.value = false
  }
}

/** 新增 */
function handleAdd() {
  uni.navigateTo({
    url: '/pages-mes/dv/subject/form/index',
  })
}

/** 查看详情 */
function handleDetail(item: DvSubjectVO) {
  uni.navigateTo({
    url: `/pages-mes/dv/subject/detail/index?id=${item.id}`,
  })
}

/** 初始化 */
onMounted(() => {
  uni.$on('mes:dv:subject:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('mes:dv:subject:reload', reload)
})
</script>

<style lang="scss" scoped>
</style>
