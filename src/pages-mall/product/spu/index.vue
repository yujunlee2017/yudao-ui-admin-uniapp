<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="商品管理"
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
      empty-view-text="暂无商品数据"
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
                  {{ item.name || '-' }}
                </view>
                <dict-tag v-if="item.status != null" :type="DICT_TYPE.PRODUCT_SPU_STATUS" :value="item.status" />
              </view>
              <view class="mb-12rpx text-34rpx text-[#fa8c16] font-semibold">
                {{ formatMallMoney(item.price) }}
              </view>
              <view class="flex items-center gap-24rpx text-26rpx text-[#666]">
                <text>库存：{{ item.stock ?? '-' }}</text>
                <text>销量：{{ item.salesCount ?? '-' }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 新增按钮 -->
    <wd-fab
      v-if="hasAccessByCodes(['product:spu:create'])"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />
  </view>
</template>

<script lang="ts" setup>
import type { ProductSpu } from '@/api/mall/product/spu'
import { onUnload } from '@dcloudio/uni-app'
import { onMounted, ref } from 'vue'
import { getProductSpuPage } from '@/api/mall/product/spu'
import { useAccess } from '@/hooks/useAccess'
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

const { hasAccessByCodes } = useAccess()
const list = ref<ProductSpu[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用
const queryParams = ref<Record<string, any>>({}) // 查询参数

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询商品列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getProductSpuPage({ ...queryParams.value, pageNo, pageSize })
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

/** 新增商品 */
function handleAdd() {
  uni.navigateTo({ url: '/pages-mall/product/spu/form/index' })
}

/** 查看详情 */
function handleDetail(item: ProductSpu) {
  uni.navigateTo({ url: `/pages-mall/product/spu/detail/index?id=${item.id}` })
}

/** 初始化 */
onMounted(() => {
  // 详情删除发 kebab 事件；已有 SPU 表单页（不可改）创建/编辑后发 camelCase 事件，两者都监听
  uni.$on('mall:product-spu:reload', reload)
  uni.$on('mall:productSpu:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('mall:product-spu:reload', reload)
  uni.$off('mall:productSpu:reload', reload)
})
</script>
