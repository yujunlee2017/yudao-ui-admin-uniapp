<template>
  <!-- 联系人列表（按客户/商机加载，卡片样式对齐联系人列表页） -->
  <view class="p-24rpx pb-160rpx">
    <view v-for="item in list" :key="item.id" class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm" @click="handleDetail(item)">
      <view class="mb-16rpx flex items-start justify-between gap-16rpx">
        <view class="min-w-0 flex-1 truncate text-32rpx text-[#333] font-semibold">
          {{ item.name || '-' }}
        </view>
        <wd-tag v-if="item.master" type="primary" variant="plain">
          关键决策人
        </wd-tag>
      </view>
      <view v-if="item.mobile" class="mb-12rpx text-28rpx text-[#666]">
        <text class="mr-8rpx text-[#999]">手机：</text>{{ item.mobile }}
      </view>
      <view v-if="item.ownerUserName" class="text-28rpx text-[#666]">
        <text class="mr-8rpx text-[#999]">负责人：</text>{{ item.ownerUserName }}
      </view>
    </view>
    <wd-empty v-if="!loading && list.length === 0" icon="content" tip="暂无联系人" />
    <view v-if="loading" class="py-48rpx text-center text-28rpx text-[#999]">
      加载中...
    </view>
  </view>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { getContactPageByBusiness, getContactPageByCustomer } from '@/api/crm/contact'

const props = defineProps<{ customerId?: number, businessId?: number }>()
const loading = ref(false) // 列表加载状态
const list = ref<Record<string, any>[]>([]) // 联系人列表

/** 加载联系人 */
async function getList() {
  if (!props.customerId && !props.businessId) {
    return
  }
  loading.value = true
  try {
    // TODO @AI：是不是要翻页？？？
    const data = props.businessId
      ? await getContactPageByBusiness({
          pageNo: 1,
          pageSize: 20,
          businessId: props.businessId,
          customerId: props.customerId,
        })
      : await getContactPageByCustomer({
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
  uni.navigateTo({ url: `/pages-crm/contact/detail/index?id=${item.id}` })
}

/** 新增联系人 */
function openAdd() {
  const query = props.customerId ? `?customerId=${props.customerId}` : ''
  uni.navigateTo({ url: `/pages-crm/contact/form/index${query}` })
}

watch(() => [props.customerId, props.businessId], () => getList())

defineExpose({ getList, openAdd })

/** 初始化 */
onMounted(() => {
  getList()
  uni.$on('crm:contact:reload', getList)
})

/** 卸载 */
onUnmounted(() => {
  uni.$off('crm:contact:reload', getList)
})
</script>
