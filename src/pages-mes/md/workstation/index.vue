<template>
  <view class="yd-page-container yd-page-container-paging">
    <wd-navbar title="工作站" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />
    <SearchForm ref="searchFormRef" @search="handleQuery" @reset="handleReset" />
    <view v-if="hasAccessByCodes(['mes:md-workstation:export'])" class="bg-white px-24rpx py-16rpx">
      <view class="h-64rpx flex items-center justify-center border-2rpx border-[#1677ff] rounded-8rpx text-26rpx text-[#1677ff]" :class="exportLoading ? 'opacity-60' : ''" @click="handleExport">
        {{ exportLoading ? '导出中...' : '导出当前筛选数据' }}
      </view>
    </view>
    <z-paging ref="pagingRef" v-model="list" :fixed="false" class="min-h-0 flex-1" :default-page-size="10" :refresher-enabled="true" :inside-more="true" :loading-more-default-as-loading="true" empty-view-text="暂无工作站数据" @query="queryList">
      <view class="p-24rpx">
        <ListCardWrapper v-for="item in list" :key="item.id" :item="item" :item-id="item.id" :selecting="selecting" :selected="isSelected(item.id)" :can-delete="canDelete" @click="handleDetail" @longpress="enterSelectMode" @toggle-select="toggleSelect" @swipe-delete="handleSwipeDelete">
          <view class="p-24rpx">
            <view class="mb-16rpx flex items-start justify-between gap-16rpx">
              <view class="min-w-0 flex-1 truncate text-32rpx text-[#333] font-semibold">
                {{ item.name || '-' }}
              </view>
              <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="item.status" />
            </view>
            <view class="text-26rpx text-[#666] space-y-8rpx">
              <view>编码：{{ item.code || '-' }}</view>
              <view>所在车间：{{ item.workshopName || '-' }}</view>
              <view>所属工序：{{ item.processName || '-' }}</view>
              <view>地点：{{ item.address || '-' }}</view>
              <view v-if="item.remark">
                备注：{{ item.remark }}
              </view>
            </view>
          </view>
        </ListCardWrapper>
      </view>
    </z-paging>
    <view v-if="selecting" class="yd-detail-footer">
      <view class="flex items-center justify-between px-24rpx">
        <wd-button variant="plain" size="small" @click="exitSelectMode">
          取消
        </wd-button>
        <text class="text-28rpx text-[#666]">已选 {{ selectedIds.size }} 项</text>
        <wd-button type="danger" size="small" :loading="batchDeleting" :disabled="selectedIds.size === 0" @click="handleBatchDelete">
          删除
        </wd-button>
      </view>
    </view>
    <wd-fab v-if="hasAccessByCodes(['mes:md-workstation:create'])" position="right-bottom" type="primary" :expandable="false" @click="handleAdd" />
  </view>
</template>

<script lang="ts" setup>
import type { MdWorkstationQueryParams, MdWorkstationVO } from '@/api/mes/md/workstation'
import { onUnload } from '@dcloudio/uni-app'
import { onMounted, ref } from 'vue'
import { deleteWorkstation, getWorkstationPage } from '@/api/mes/md/workstation'
import { downloadApiFile } from '@/utils/download'
import { useAccess } from '@/hooks/useAccess'
import { useBatchSelect } from '@/pages-erp/hooks/useBatchSelect'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import ListCardWrapper from '@/pages-erp/components/list-card-wrapper.vue'
import SearchForm from './components/search-form.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const list = ref<MdWorkstationVO[]>([])
const pagingRef = ref<ZPagingRef<MdWorkstationVO>>()
const queryParams = ref<MdWorkstationQueryParams>({})
const exportLoading = ref(false)

const {
  selecting,
  selectedIds,
  batchDeleting,
  canDelete,
  isSelected,
  toggleSelect,
  enterSelectMode,
  exitSelectMode,
  handleSwipeDelete,
  handleBatchDelete,
} = useBatchSelect({
  permission: 'mes:md-workstation:delete',
  deleteApi: (ids: number[]) => Promise.all(ids.map(id => deleteWorkstation(id))).then(() => {}),
  reloadEvent: 'mes:md:workstation:reload',
})

function handleBack() {
  navigateBackPlus('/pages-mes/home/index')
}

async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getWorkstationPage({ ...queryParams.value, pageNo, pageSize })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

function handleQuery(data: MdWorkstationQueryParams) {
  queryParams.value = { ...data }
  reload()
}

function handleReset() {
  queryParams.value = {}
  reload()
}

function reload() {
  pagingRef.value?.reload()
}

async function handleExport() {
  if (exportLoading.value)
    return
  try {
    await new Promise<void>((resolve, reject) => {
      uni.showModal({
        title: '导出确认',
        content: '确定要导出当前筛选数据吗？',
        success: (res) => {
          if (res.confirm) {
            resolve()
          } else {
            reject(new Error('cancelled'))
          }
        },
        fail: () => reject(new Error('cancelled')),
      })
    })
  } catch {
    return
  }
  exportLoading.value = true
  try {
    await downloadApiFile(`/mes/md-workstation/export-excel`, queryParams.value, '工作站.xls')
  } finally {
    exportLoading.value = false
  }
}

function handleAdd() {
  uni.navigateTo({ url: `/pages-mes/md/workstation/form/index` })
}

function handleDetail(item: MdWorkstationVO) {
  uni.navigateTo({ url: `/pages-mes/md/workstation/detail/index?id=${item.id}` })
}

onMounted(() => {
  uni.$on('mes:md:workstation:reload', reload)
})

onUnload(() => {
  uni.$off('mes:md:workstation:reload', reload)
})
</script>
