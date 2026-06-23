<!-- TODO @AI：挪到 /Users/yunai/Java/yudao-ui-admin-uniapp-next-v4/src/pages-mall/product/property/value； -->
<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="属性值"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 搜索组件 -->
    <!-- TODO @AI：顶部搜搜没生效； -->
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
      empty-view-text="暂无属性值数据"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx overflow-hidden rounded-12rpx bg-white p-24rpx shadow-sm"
          @click="handleDetail(item)"
        >
          <view class="mb-12rpx truncate text-32rpx text-[#333] font-semibold">
            {{ item.name || '-' }}
          </view>
          <!-- TODO @AI：是不是不用在这里？更多放在 title 里？ -->
          <view class="mb-8rpx flex items-center text-26rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">所属属性：</text>
            <text class="truncate">{{ getPropertyName(item.propertyId) }}</text>
          </view>
          <view class="flex items-center text-26rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">创建时间：</text>
            <text>{{ formatDateTime(item.createTime) || '-' }}</text>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 新增按钮 -->
    <wd-fab
      v-if="hasAccessByCodes(['product:property:create'])"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />
  </view>
</template>

<script lang="ts" setup>
import type { ProductPropertyValue } from '@/api/mall/product/property'
import { onUnload } from '@dcloudio/uni-app'
import { onMounted, ref } from 'vue'
import { getProductPropertyValuePage, getSimpleProductPropertyList } from '@/api/mall/product/property'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { formatDateTime } from '@/utils/date'

// TODO @AI：这个注释，是不是写到 propertyId 后面？
// 由属性列表「属性值」入口传入 propertyId，进入后仅展示该属性下的属性值
const props = defineProps<{
  propertyId?: number | any
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const list = ref<ProductPropertyValue[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用
// TODO @AI：scopedPropertyId 其他地方的代码，都是这么写的么？
// TODO @AI：通过 props.propertyId 传入的属性编号，这里是不是就不用了 scopedPropertyId
// TODO @AI：这个注释，是不是写到 scopedPropertyId 后面？
// 路由透传的属性编号（限定作用域），undefined 表示展示全部
const scopedPropertyId = props.propertyId != null && props.propertyId !== '' ? Number(props.propertyId) : undefined
const queryParams = ref<Record<string, any>>(scopedPropertyId != null ? { propertyId: scopedPropertyId } : {}) // 查询参数
const propertyNameMap = ref<Record<number, string>>({}) // 属性编号到名称映射，用于回显所属属性名

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 获取属性名称 */
function getPropertyName(propertyId?: number) {
  if (propertyId == null) {
    return '-'
  }
  return propertyNameMap.value[propertyId] || `属性 #${propertyId}`
}

/** 加载属性名称映射 */
async function loadPropertyNames() {
  const list = await getSimpleProductPropertyList()
  const map: Record<number, string> = {}
  list.forEach((item) => {
    if (item.id != null) {
      map[item.id] = item.name
    }
  })
  propertyNameMap.value = map
}

/** 查询属性值列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getProductPropertyValuePage({ ...queryParams.value, pageNo, pageSize })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 搜索按钮操作（限定属性时始终保留 propertyId 作用域） */
function handleQuery(data?: Record<string, any>) {
  queryParams.value = scopedPropertyId != null
    ? { ...data, propertyId: scopedPropertyId }
    : { ...data }
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

/** 新增属性值（限定属性时带上 propertyId，表单内锁定所属属性） */
function handleAdd() {
  const url = scopedPropertyId != null
    ? `/pages-mall/product/property-value/form/index?propertyId=${scopedPropertyId}`
    : '/pages-mall/product/property-value/form/index'
  uni.navigateTo({ url })
}

/** 查看详情 */
function handleDetail(item: ProductPropertyValue) {
  uni.navigateTo({ url: `/pages-mall/product/property-value/detail/index?id=${item.id}` })
}

/** 初始化 */
onMounted(() => {
  loadPropertyNames()
  uni.$on('mall:product-property-value:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('mall:product-property-value:reload', reload)
})
</script>
