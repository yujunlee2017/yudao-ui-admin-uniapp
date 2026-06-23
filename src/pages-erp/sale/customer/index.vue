<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="客户"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 搜索组件 -->
    <SearchForm @search="handleQuery" @reset="handleReset" />
    <ExportAction module-key="customer" :params="queryParams" />

    <!-- 客户列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无客户数据"
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
                {{ item.name || '-' }}
              </view>
              <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="item.status" />
            </view>
            <view v-if="item.contact" class="mb-12rpx text-28rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">联系人：</text>{{ item.contact }}
            </view>
            <view v-if="item.mobile" class="mb-12rpx text-28rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">手机：</text>{{ item.mobile }}
            </view>
            <view v-if="item.telephone" class="mb-12rpx text-28rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">电话：</text>{{ item.telephone }}
            </view>
            <view v-if="item.email" class="mb-12rpx text-28rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">邮箱：</text>{{ item.email }}
            </view>
            <view v-if="item.remark" class="text-28rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">备注：</text>
              <text class="line-clamp-1">{{ item.remark }}</text>
            </view>
          </view>
        </ListCardWrapper>
      </view>
    </z-paging>

    <!-- 批量操作栏 -->
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

    <!-- 新增按钮 -->
    <wd-fab
      v-if="hasAccessByCodes(['erp:customer:create'])"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />
  </view>
</template>

<script lang="ts" setup>
import type { Customer } from '@/api/erp/sale/customer'
import { onUnload } from '@dcloudio/uni-app'
import { onMounted, ref } from 'vue'
import { deleteCustomer, getCustomerPage } from '@/api/erp/sale/customer'
import { useAccess } from '@/hooks/useAccess'
import { useBatchSelect } from '@/pages-erp/hooks/useBatchSelect'
import ListCardWrapper from '@/pages-erp/components/list-card-wrapper.vue'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import ExportAction from '@/pages-erp/components/export-action.vue'
import SearchForm from './components/search-form.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const list = ref<Customer[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用
const queryParams = ref<Record<string, any>>({}) // 查询参数

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
  permission: 'erp:customer:delete',
  deleteApi: (ids: number[]) => deleteCustomer(ids[0]),
  reloadEvent: 'erp:customer:reload',
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询客户列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getCustomerPage({ ...queryParams.value, pageNo, pageSize })
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

/** 新增客户 */
function handleAdd() {
  uni.navigateTo({ url: '/pages-erp/sale/customer/form/index' })
}

/** 查看详情 */
function handleDetail(item: Customer) {
  uni.navigateTo({ url: `/pages-erp/sale/customer/detail/index?id=${item.id}` })
}

/** 初始化 */
onMounted(() => {
  uni.$on('erp:customer:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('erp:customer:reload', reload)
})
</script>
