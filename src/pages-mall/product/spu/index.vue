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

    <!-- 商品状态 tab（tabType 唯一来源，对齐 PC 端 ProductSpuPageReqVO.tabType） -->
    <view class="bg-white">
      <wd-tabs v-model="tabIndex" @change="handleTabChange">
        <wd-tab
          v-for="tab in SPU_TABS"
          :key="tab.value"
          :title="`${tab.label}(${tabCounts[tab.value] ?? 0})`"
        />
      </wd-tabs>
    </view>

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

          <!-- 行内操作：回收站 tab 提供恢复，其它 tab 提供回收 -->
          <view v-if="canUpdate" class="mt-16rpx flex justify-end gap-16rpx border-t border-[#f0f0f0] pt-16rpx" @click.stop>
            <template v-if="isRecycleTab">
              <wd-button size="small" type="primary" plain @click.stop="handleStatusChange(item, ProductSpuStatusEnum.DISABLE)">
                恢复
              </wd-button>
            </template>
            <template v-else>
              <wd-button size="small" type="danger" plain @click.stop="handleStatusChange(item, ProductSpuStatusEnum.RECYCLE)">
                回收
              </wd-button>
            </template>
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
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { getProductSpuPage, getProductSpuTabsCount, updateProductSpuStatus } from '@/api/mall/product/spu'
import { useAccess } from '@/hooks/useAccess'
import { formatMallMoney } from '@/pages-mall/utils'
import { currRoute, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import SearchForm from './components/search-form.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

// 商品状态 tab（对齐后端 ProductSpuPageReqVO 的 tabType 常量；count 由 get-count 返回，key 为 tabType）
const SPU_TABS = [
  { label: '出售中', value: 0 },
  { label: '仓库中', value: 1 },
  { label: '已售罄', value: 2 },
  { label: '警戒库存', value: 3 },
  { label: '回收站', value: 4 },
]

// 商品上下架/回收状态（对齐 PC 端 ProductSpuStatusEnum）
const ProductSpuStatusEnum = {
  RECYCLE: -1,
  DISABLE: 0,
  ENABLE: 1,
}

const { hasAccessByCodes } = useAccess()
const dialog = useDialog()
const toast = useToast()
const list = ref<ProductSpu[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用
const tabIndex = ref(0) // 当前 tab 下标
const tabCounts = ref<Record<number, number>>({}) // 各 tab 商品数量（key 为 tabType）
const queryParams = ref<Record<string, any>>({}) // 查询参数（搜索表单部分：name；tabType/categoryId 单独维护）
const categoryId = ref<number>() // 路由透传的分类筛选（分类模块「查看商品」深链）
const RECYCLE_BIN_TAB = 4 // 回收站 tabType（对齐后端 ProductSpuPageReqVO.RECYCLE_BIN）
const tabType = computed(() => SPU_TABS[tabIndex.value].value) // 当前 tabType
const isRecycleTab = computed(() => tabType.value === RECYCLE_BIN_TAB) // 是否回收站 tab
const canUpdate = computed(() => hasAccessByCodes(['product:spu:update']))

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询商品列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getProductSpuPage({ ...queryParams.value, tabType: tabType.value, categoryId: categoryId.value, pageNo, pageSize })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 加载各 tab 数量 */
async function loadTabCounts() {
  try {
    const res = await getProductSpuTabsCount()
    const counts: Record<number, number> = {}
    Object.keys(res || {}).forEach((key) => {
      counts[Number(key)] = Number(res[key]) || 0
    })
    tabCounts.value = counts
  } catch {
    // 数量为辅助信息，失败时静默
  }
}

/** 搜索按钮操作 */
function handleQuery(data: Record<string, any> = {}) {
  queryParams.value = { ...data }
  reload()
}

/** 重置按钮操作 */
function handleReset() {
  handleQuery()
}

/** tab 切换 */
function handleTabChange({ index }: { index: number }) {
  tabIndex.value = index
  reload()
}

/** 重新加载（同时刷新数量） */
function reload() {
  loadTabCounts()
  pagingRef.value?.reload()
}

/** 加入回收站 / 恢复到仓库 */
async function handleStatusChange(item: ProductSpu, status: number) {
  const text = status === ProductSpuStatusEnum.RECYCLE ? '加入到回收站' : '恢复到仓库'
  try {
    await dialog.confirm({ title: '提示', msg: `确认要将"${item.name}"${text}吗？` })
  } catch {
    return
  }
  try {
    await updateProductSpuStatus({ id: item.id!, status })
    toast.success(`${text}成功`)
    reload()
  } catch {
    // 失败时 toast 已由 http 层提示
  }
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
  // 读取路由透传的 categoryId（分类模块「查看商品」深链）
  const query = currRoute().query
  // #ifdef H5
  const hashQuery = new URLSearchParams(window.location.hash.split('?')[1] || '')
  categoryId.value = Number(hashQuery.get('categoryId') || query.categoryId || 0) || undefined
  // #endif
  // #ifndef H5
  categoryId.value = Number(query.categoryId || 0) || undefined
  // #endif
  loadTabCounts()
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
