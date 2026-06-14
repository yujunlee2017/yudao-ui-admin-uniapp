<template>
  <!-- 合同列表（按客户/商机加载，卡片样式对齐合同列表页） -->
  <view class="p-24rpx pb-160rpx">
    <view v-for="item in list" :key="item.id" class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm" @click="handleDetail(item)">
      <view class="mb-16rpx flex items-start justify-between gap-16rpx">
        <view class="min-w-0 flex-1 truncate text-32rpx text-[#333] font-semibold">
          {{ item.name || '-' }}
        </view>
        <dict-tag v-if="item.auditStatus != null" :type="DICT_TYPE.CRM_AUDIT_STATUS" :value="item.auditStatus" />
      </view>
      <view v-if="item.no" class="mb-12rpx text-28rpx text-[#666]">
        <text class="mr-8rpx text-[#999]">编号：</text>{{ item.no }}
      </view>
      <view v-if="item.totalPrice != null" class="text-28rpx text-[#666]">
        <text class="mr-8rpx text-[#999]">金额：</text>{{ Number(item.totalPrice).toFixed(2) }}
      </view>
    </view>
    <wd-empty v-if="!loading && list.length === 0" icon="content" tip="暂无合同" />
    <view v-if="loading" class="py-48rpx text-center text-28rpx text-[#999]">
      加载中...
    </view>
  </view>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { getContractPageByBusiness, getContractPageByCustomer } from '@/api/crm/contract'
import { DICT_TYPE } from '@/utils/constants'

const props = defineProps<{ customerId?: number, businessId?: number }>()
const loading = ref(false) // 列表加载状态
const list = ref<Record<string, any>[]>([]) // 合同列表

/** 加载合同 */
async function getList() {
  if (!props.customerId && !props.businessId) {
    return
  }
  loading.value = true
  try {
    // TODO @AI：是不是要翻页？？？
    const data = props.businessId
      ? await getContractPageByBusiness({
          pageNo: 1,
          pageSize: 20,
          businessId: props.businessId,
        })
      : await getContractPageByCustomer({
          pageNo: 1,
          pageSize: 20,
          customerId: props.customerId!,
        })
    list.value = data.list
  } catch {
    list.value = []
  } finally {
    loading.value = false
  }
}

/** 查看详情 */
function handleDetail(item: Record<string, any>) {
  uni.navigateTo({ url: `/pages-crm/contract/detail/index?id=${item.id}` })
}

/** 新增合同 */
function openAdd() {
  const params = [
    props.customerId ? `customerId=${props.customerId}` : '',
    props.businessId ? `businessId=${props.businessId}` : '',
  ].filter(Boolean).join('&')
  uni.navigateTo({ url: `/pages-crm/contract/form/index${params ? `?${params}` : ''}` })
}

watch(() => [props.customerId, props.businessId], () => getList())

defineExpose({ getList, openAdd })

/** 初始化 */
onMounted(() => {
  getList()
  uni.$on('crm:contract:reload', getList)
})

/** 卸载 */
onUnmounted(() => {
  uni.$off('crm:contract:reload', getList)
})
</script>
