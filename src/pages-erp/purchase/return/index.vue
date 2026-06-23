<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar title="采购退货" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 搜索组件 -->
    <SearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 采购退货列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无采购退货数据"
      @query="queryList"
    >
      <view class="p-24rpx">
        <ListCardWrapper
          v-for="item in list"
          :key="item.id"
          :item="item"
          :item-id="item.id"
          :selecting="selecting"
          :selected="isSelected(item.id)"
          :can-delete="canDelete"
          @click="handleDetail"
          @longpress="enterSelectMode"
          @toggle-select="toggleSelect"
          @swipe-delete="handleSwipeDelete"
        >
          <view class="p-24rpx">
            <view class="mb-16rpx flex items-start justify-between gap-16rpx">
              <view class="min-w-0 flex-1 truncate text-32rpx text-[#333] font-semibold">
                {{ item.no || '保存后自动生成' }}
              </view>
              <dict-tag :type="DICT_TYPE.ERP_AUDIT_STATUS" :value="item.status" />
            </view>
            <view class="mb-12rpx text-28rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">供应商：</text>{{ item.supplierName || '-' }}
            </view>
            <view v-if="item.productNames" class="mb-12rpx text-28rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">产品：</text>
              <text class="line-clamp-1">{{ item.productNames }}</text>
            </view>
            <view class="mb-12rpx text-28rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">退货时间：</text>{{ formatDateTime(item.returnTime) || '-' }}
            </view>
            <view class="mb-12rpx flex text-28rpx text-[#666]">
              <view class="flex-1">
                <text class="mr-8rpx text-[#999]">总数量：</text>{{ formatCount(item.totalCount) }}
              </view>
              <view class="flex-1">
                <text class="mr-8rpx text-[#999]">已退：</text>{{ formatMoney(item.refundPrice) }}
              </view>
            </view>
            <view class="flex text-28rpx text-[#666]">
              <view class="flex-1">
                <text class="mr-8rpx text-[#999]">应退：</text>{{ formatMoney(item.totalPrice) }}
              </view>
              <view class="flex-1">
                <text class="mr-8rpx text-[#999]">未退：</text>{{ formatMoney(getUnrefundedPrice(item)) }}
              </view>
            </view>
          </view>
        </ListCardWrapper>
      </view>
    </z-paging>

    <!-- 新增按钮 -->
    <wd-fab
      v-if="hasAccessByCodes(['erp:purchase-return:create'])"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />
  </view>
</template>

<script lang="ts" setup>
import type { PurchaseReturn } from '@/api/erp/purchase/return'
import { onUnload } from '@dcloudio/uni-app'
import { onMounted, ref } from 'vue'
import { deletePurchaseReturn, getPurchaseReturnPage } from '@/api/erp/purchase/return'
import { useAccess } from '@/hooks/useAccess'
import { useBatchSelect } from '@/pages-erp/hooks/useBatchSelect'
import ListCardWrapper from '@/pages-erp/components/list-card-wrapper.vue'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import SearchForm from './components/search-form.vue'
import { formatCount, formatMoney } from '@/pages-erp/utils'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const list = ref<PurchaseReturn[]>([])
const pagingRef = ref<any>()
const queryParams = ref<Record<string, any>>({})

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
  permission: 'erp:purchase-return:delete',
  deleteApi: (ids: number[]) => deletePurchaseReturn(ids),
  reloadEvent: 'erp:purchase-return:reload',
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

function getUnrefundedPrice(item: PurchaseReturn) {
  return Number(item.totalPrice || 0) - Number(item.refundPrice || 0)
}

/** 查询列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getPurchaseReturnPage({ ...queryParams.value, pageNo, pageSize })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 搜索按钮操作 */
function handleQuery(data?: Record<string, any>) {
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

/** 新增 */
function handleAdd() {
  uni.navigateTo({ url: '/pages-erp/purchase/return/form/index' })
}

function handleDetail(item: PurchaseReturn) {
  uni.navigateTo({ url: `/pages-erp/purchase/return/detail/index?id=${item.id}` })
}

onMounted(() => {
  uni.$on('erp:purchase-return:reload', reload)
})

onUnload(() => {
  uni.$off('erp:purchase-return:reload', reload)
})
</script>
