<!-- TODO @AI：浏览记录，是不是 vue3 + ep 没有。如果是，貌似不用做呀？ -->
<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="浏览记录"
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
      empty-view-text="暂无浏览记录"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx overflow-hidden rounded-12rpx bg-white p-24rpx shadow-sm"
          @click="handleDetail(item)"
        >
          <view class="flex items-start gap-20rpx">
            <image
              v-if="item.picUrl"
              :src="item.picUrl"
              class="h-140rpx w-140rpx shrink-0 rounded-8rpx bg-[#f5f5f5]"
              mode="aspectFill"
            />
            <view class="min-w-0 flex-1">
              <view class="mb-12rpx flex items-start justify-between gap-16rpx">
                <view class="min-w-0 flex-1 truncate text-32rpx text-[#333] font-semibold">
                  {{ item.name || `商品 #${item.spuId ?? '-'}` }}
                </view>
                <dict-tag v-if="item.status != null" :type="DICT_TYPE.PRODUCT_SPU_STATUS" :value="item.status" />
              </view>
              <view class="mb-12rpx text-34rpx text-[#fa8c16] font-semibold">
                {{ formatMallMoney(item.price) }}
              </view>
              <view class="flex items-center gap-24rpx text-26rpx text-[#666]">
                <text>用户：{{ item.userId ?? '-' }}</text>
                <text>销量：{{ item.salesCount ?? '-' }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </z-paging>
  </view>
</template>

<script lang="ts" setup>
import type { ProductBrowseHistory } from '@/api/mall/product/history'
import { onUnload } from '@dcloudio/uni-app'
import { onMounted, ref } from 'vue'
import { getProductBrowseHistoryPage } from '@/api/mall/product/history'
import { formatMallMoney } from '@/pages-mall/utils'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import SearchForm from './components/search-form.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const list = ref<ProductBrowseHistory[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用
const queryParams = ref<Record<string, any>>({}) // 查询参数

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询浏览记录列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getProductBrowseHistoryPage({ ...queryParams.value, pageNo, pageSize })
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

/** 查看详情：浏览记录接口无 get 接口，详情字段经路由参数透传，避免“取前 100 条再 find”的反模式 */
function handleDetail(item: ProductBrowseHistory) {
  const query = [
    `id=${item.id}`,
    item.spuId != null ? `spuId=${item.spuId}` : '',
    item.userId != null ? `userId=${item.userId}` : '',
    item.name ? `name=${encodeURIComponent(item.name)}` : '',
    item.picUrl ? `picUrl=${encodeURIComponent(item.picUrl)}` : '',
    item.price != null ? `price=${item.price}` : '',
    item.status != null ? `status=${item.status}` : '',
    item.createTime ? `createTime=${encodeURIComponent(item.createTime)}` : '',
  ].filter(Boolean).join('&')
  uni.navigateTo({ url: `/pages-mall/product/browse-history/detail/index?${query}` })
}

/** 初始化 */
onMounted(() => {
  uni.$on('mall:product-browse-history:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('mall:product-browse-history:reload', reload)
})
</script>
