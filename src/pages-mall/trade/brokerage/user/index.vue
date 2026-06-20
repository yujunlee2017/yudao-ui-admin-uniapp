<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="分销用户"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 搜索组件 -->
    <SearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 分页列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无分销用户"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx overflow-hidden rounded-12rpx bg-white p-24rpx shadow-sm"
          @click="handleDetail(item)"
        >
          <view class="mb-16rpx flex items-center gap-20rpx">
            <image
              v-if="item.avatar"
              :src="item.avatar"
              class="h-88rpx w-88rpx shrink-0 rounded-full bg-[#f5f5f5]"
              mode="aspectFill"
            />
            <view class="min-w-0 flex-1">
              <view class="flex items-center justify-between gap-16rpx">
                <text class="min-w-0 flex-1 truncate text-32rpx text-[#333] font-semibold">
                  {{ item.nickname || `用户 #${item.id}` }}
                </text>
                <wd-tag :type="item.brokerageEnabled ? 'success' : 'info'" plain>
                  {{ item.brokerageEnabled ? '有资格' : '无资格' }}
                </wd-tag>
              </view>
              <view class="mt-6rpx text-26rpx text-[#999]">
                推广员：{{ item.bindUserId ?? '无' }}
              </view>
            </view>
          </view>
          <view class="flex items-center justify-between text-26rpx text-[#666]">
            <text>可用佣金：{{ formatMallMoney(item.price) }}</text>
            <text>冻结佣金：{{ formatMallMoney(item.frozenPrice) }}</text>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 新增按钮 -->
    <wd-fab
      v-if="hasAccessByCodes(['trade:brokerage-user:create'])"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />
  </view>
</template>

<script lang="ts" setup>
import type { TradeBrokerageUser } from '@/api/mall/trade/brokerage/user'
import { onUnload } from '@dcloudio/uni-app'
import { onMounted, ref } from 'vue'
import { getTradeBrokerageUserPage } from '@/api/mall/trade/brokerage/user'
import { useAccess } from '@/hooks/useAccess'
import { formatMallMoney } from '@/pages-mall/utils'
import { navigateBackPlus } from '@/utils'
import SearchForm from './components/search-form.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const list = ref<TradeBrokerageUser[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用
const queryParams = ref<Record<string, any>>({}) // 查询参数

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询分销用户列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getTradeBrokerageUserPage({ ...queryParams.value, pageNo, pageSize })
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

/** 新增分销用户 */
function handleAdd() {
  uni.navigateTo({ url: '/pages-mall/trade/brokerage/user/form/index' })
}

/** 查看详情 */
function handleDetail(item: TradeBrokerageUser) {
  uni.navigateTo({ url: `/pages-mall/trade/brokerage/user/detail/index?id=${item.id}` })
}

/** 初始化 */
onMounted(() => {
  uni.$on('mall:brokerage-user:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('mall:brokerage-user:reload', reload)
})
</script>
