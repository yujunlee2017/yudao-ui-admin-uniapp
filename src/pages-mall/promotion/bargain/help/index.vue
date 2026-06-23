<!-- TODO @AI：它是不是不用 search-form.vue？按照 vue3 + ep，它可以被访问，是不是就 ok 了哈？传递砍价记录？ -->
<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="砍价助力"
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
      empty-view-text="暂无砍价助力"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx overflow-hidden rounded-12rpx bg-white p-24rpx shadow-sm"
        >
          <view class="mb-12rpx flex items-center justify-between gap-16rpx">
            <text class="text-30rpx text-[#333] font-semibold">助力记录 #{{ item.id }}</text>
            <text class="text-30rpx text-[#fa8c16] font-semibold">{{ formatDisplayMoney(item.reducePrice) }}</text>
          </view>
          <view class="flex items-center justify-between text-26rpx text-[#666]">
            <text>砍价记录：{{ item.record ?? '-' }}</text>
            <text>用户：{{ item.userId ?? '-' }}</text>
          </view>
          <view class="mt-8rpx text-24rpx text-[#999]">
            助力时间：{{ formatDateTime(item.createTime) || '-' }}
          </view>
        </view>
      </view>
    </z-paging>
  </view>
</template>

<script lang="ts" setup>
import type { PromotionBargainHelp } from '@/api/mall/promotion/bargain'
import { onUnload } from '@dcloudio/uni-app'
import { onMounted, ref } from 'vue'
import { getPromotionBargainHelpPage } from '@/api/mall/promotion/bargain'
import { formatDisplayMoney } from '@/utils/format'
import { navigateBackPlus } from '@/utils'
import { formatDateTime } from '@/utils/date'
import SearchForm from './components/search-form.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const list = ref<PromotionBargainHelp[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用
const queryParams = ref<Record<string, any>>({}) // 查询参数

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询砍价助力列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getPromotionBargainHelpPage({ ...queryParams.value, pageNo, pageSize })
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

/** 初始化 */
onMounted(() => {
  uni.$on('mall:promotion-bargain-help:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('mall:promotion-bargain-help:reload', reload)
})
</script>
