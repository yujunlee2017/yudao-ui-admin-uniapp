<template>
  <!-- 客户下的商机列表（卡片样式对齐商机列表页） -->
  <view class="p-24rpx pb-160rpx">
    <view v-for="item in list" :key="item.id" class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm" @click="handleDetail(item)">
      <view class="mb-16rpx flex items-start justify-between gap-16rpx">
        <view class="min-w-0 flex-1 truncate text-32rpx text-[#333] font-semibold">
          {{ item.name || '-' }}
        </view>
        <wd-tag v-if="item.statusName" type="primary" variant="plain">
          {{ item.statusName }}
        </wd-tag>
      </view>
      <view v-if="item.totalPrice != null" class="mb-12rpx text-28rpx text-[#666]">
        <text class="mr-8rpx text-[#999]">金额：</text>{{ Number(item.totalPrice).toFixed(2) }}
      </view>
      <view v-if="item.ownerUserName" class="text-28rpx text-[#666]">
        <text class="mr-8rpx text-[#999]">负责人：</text>{{ item.ownerUserName }}
      </view>
    </view>
    <wd-empty v-if="!loading && list.length === 0" icon="content" tip="暂无商机" />
    <view v-if="loading" class="py-48rpx text-center text-28rpx text-[#999]">
      加载中...
    </view>
  </view>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { getBusinessPageByCustomer } from '@/api/crm/business'

const props = defineProps<{ customerId: number }>()
const loading = ref(false) // 列表加载状态
const list = ref<Record<string, any>[]>([]) // 商机列表

/** 加载商机 */
async function getList() {
  if (!props.customerId) {
    return
  }
  loading.value = true
  try {
    const data = await getBusinessPageByCustomer({ pageNo: 1, pageSize: 20, customerId: props.customerId })
    list.value = data.list
  } catch {
    list.value = []
  } finally {
    loading.value = false
  }
}

/** 查看详情 */
function handleDetail(item: Record<string, any>) {
  uni.navigateTo({ url: `/pages-crm/business/detail/index?id=${item.id}` })
}

/** 新增商机 */
function openAdd() {
  uni.navigateTo({ url: `/pages-crm/business/form/index?customerId=${props.customerId}` })
}

watch(() => props.customerId, () => getList())

defineExpose({ getList, openAdd })

/** 初始化 */
onMounted(() => {
  getList()
  uni.$on('crm:business:reload', getList)
})

/** 卸载 */
onUnmounted(() => {
  uni.$off('crm:business:reload', getList)
})
</script>
