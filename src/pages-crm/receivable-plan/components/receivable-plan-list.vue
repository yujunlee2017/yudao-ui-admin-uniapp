<template>
  <!-- 回款计划列表（按客户/合同加载，卡片样式对齐回款计划列表页） -->
  <view class="p-24rpx pb-160rpx">
    <view v-for="item in list" :key="item.id" class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm" @click="handleDetail(item)">
      <view class="mb-16rpx flex items-start justify-between gap-16rpx">
        <view class="min-w-0 flex-1 truncate text-32rpx text-[#333] font-semibold">
          {{ item.contractNo || '-' }}
        </view>
        <dict-tag v-if="item.returnType != null" :type="DICT_TYPE.CRM_RECEIVABLE_RETURN_TYPE" :value="item.returnType" />
      </view>
      <view v-if="item.period != null" class="mb-12rpx text-28rpx text-[#666]">
        <text class="mr-8rpx text-[#999]">期数：</text>{{ item.period }}
      </view>
      <view v-if="item.price != null" class="mb-12rpx text-28rpx text-[#666]">
        <text class="mr-8rpx text-[#999]">金额：</text>{{ Number(item.price).toFixed(2) }}
      </view>
      <view v-if="item.returnTime" class="text-28rpx text-[#666]">
        <text class="mr-8rpx text-[#999]">日期：</text>{{ formatDate(item.returnTime) }}
      </view>
    </view>
    <wd-empty v-if="!loading && list.length === 0" icon="content" tip="暂无回款计划" />
    <view v-if="loading" class="py-48rpx text-center text-28rpx text-[#999]">
      加载中...
    </view>
  </view>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { getReceivablePlanPageByCustomer } from '@/api/crm/receivable/plan'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate } from '@/utils/date'

const props = defineProps<{ customerId?: number, contractId?: number }>()
const loading = ref(false) // 列表加载状态
const list = ref<Record<string, any>[]>([]) // 回款计划列表

/** 加载回款计划 */
async function getList() {
  if (!props.customerId && !props.contractId) {
    return
  }
  loading.value = true
  try {
    // TODO @AI：是不是要翻页？？？
    const data = await getReceivablePlanPageByCustomer({
      pageNo: 1,
      pageSize: 20,
      customerId: props.customerId,
      contractId: props.contractId,
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
  uni.navigateTo({ url: `/pages-crm/receivable-plan/detail/index?id=${item.id}` })
}

/** 新增回款计划 */
function openAdd() {
  const params = [
    props.customerId ? `customerId=${props.customerId}` : '',
    props.contractId ? `contractId=${props.contractId}` : '',
  ].filter(Boolean).join('&')
  uni.navigateTo({ url: `/pages-crm/receivable-plan/form/index${params ? `?${params}` : ''}` })
}

watch(() => [props.customerId, props.contractId], () => getList())

defineExpose({ getList, openAdd })

/** 初始化 */
onMounted(() => {
  getList()
  uni.$on('crm:receivablePlan:reload', getList)
})

/** 卸载 */
onUnmounted(() => {
  uni.$off('crm:receivablePlan:reload', getList)
})
</script>
