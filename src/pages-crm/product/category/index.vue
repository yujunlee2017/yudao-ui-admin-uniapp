<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="产品分类"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 搜索框 -->
    <view @click="searchVisible = true">
      <wd-search placeholder="搜索产品分类" hide-cancel disabled />
    </view>

    <!-- 搜索弹窗 -->
    <wd-popup v-model="searchVisible" position="top" :custom-style="getTopPopupStyle()" :modal-style="getTopPopupModalStyle()" @close="searchVisible = false">
      <view class="yd-search-form-container">
        <view class="yd-search-form-item">
          <view class="yd-search-form-label">
            分类名称
          </view>
          <wd-input v-model="searchName" placeholder="请输入分类名称" clearable />
        </view>
        <view class="yd-search-form-actions">
          <wd-button class="flex-1" variant="plain" @click="handleReset">
            重置
          </wd-button>
          <wd-button class="flex-1" type="primary" @click="handleSearch">
            搜索
          </wd-button>
        </view>
      </view>
    </wd-popup>

    <!-- 产品分类列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :refresher-enabled="true"
      empty-view-text="暂无产品分类数据"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view v-for="item in list" :key="item.id" class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm" @click="handleDetail(item)">
          <view class="mb-16rpx flex items-start justify-between gap-16rpx">
            <view class="min-w-0 flex-1 truncate text-32rpx text-[#333] font-semibold">
              {{ item.name }}
            </view>
          </view>
          <view class="text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">父级编号：</text>{{ item.parentId ?? '-' }}
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 新增按钮 -->
    <wd-fab v-if="hasAccessByCodes(['crm:product-category:create'])" position="right-bottom" type="primary" :expandable="false" @click="handleAdd" />
  </view>
</template>

<script lang="ts" setup>
import type { ProductCategory } from '@/api/crm/product/category'
import { onUnload } from '@dcloudio/uni-app'
import { onMounted, ref } from 'vue'
import { getProductCategoryList } from '@/api/crm/product/category'
import { useAccess } from '@/hooks/useAccess'
import { getTopPopupModalStyle, getTopPopupStyle, navigateBackPlus } from '@/utils'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const list = ref<ProductCategory[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用
const searchVisible = ref(false) // 搜索弹窗显示状态
const searchName = ref('') // 搜索分类名称
const queryName = ref('') // 已生效的搜索条件

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询产品分类列表（无分页，一次性返回全部） */
async function queryList() {
  try {
    const data = await getProductCategoryList()
    const filtered = queryName.value
      ? data.filter(item => item.name?.includes(queryName.value))
      : data
    pagingRef.value?.completeByTotal(filtered, filtered.length)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 搜索按钮操作 */
function handleSearch() {
  queryName.value = searchName.value
  searchVisible.value = false
  reload()
}

/** 重置按钮操作 */
function handleReset() {
  searchName.value = ''
  queryName.value = ''
  searchVisible.value = false
  reload()
}

/** 重新加载 */
function reload() {
  pagingRef.value?.reload()
}

/** 新增产品分类 */
function handleAdd() {
  uni.navigateTo({ url: '/pages-crm/product/category/form/index' })
}

/** 查看详情 */
function handleDetail(item: ProductCategory) {
  uni.navigateTo({ url: `/pages-crm/product/category/detail/index?id=${item.id}` })
}

/** 初始化 */
onMounted(() => {
  uni.$on('crm:productCategory:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('crm:productCategory:reload', reload)
})
</script>
