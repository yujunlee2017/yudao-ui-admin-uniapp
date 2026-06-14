<!-- TODO @AI：应该拿到所属模块的 components 里 -->
<template>
  <view class="mt-24rpx">
    <!-- 操作日志 -->
    <view class="mb-16rpx px-24rpx">
      <text class="text-30rpx text-[#333] font-semibold">操作日志</text>
    </view>
    <view class="bg-white">
      <view
        v-for="item in list"
        :key="item.id"
        class="border-b border-[#f5f5f5] p-24rpx"
      >
        <view class="mb-12rpx flex items-center justify-between gap-16rpx">
          <text class="min-w-0 flex-1 text-28rpx text-[#333] font-semibold">
            {{ item.action || item.type || item.subType || '操作记录' }}
          </text>
          <text class="shrink-0 text-26rpx text-[#999]">
            {{ formatDateTime(item.createTime) || '-' }}
          </text>
        </view>
        <view class="text-26rpx text-[#666]">
          操作人：{{ item.userName || '-' }}
        </view>
      </view>
      <wd-empty v-if="!loading && list.length === 0" icon="content" tip="暂无操作日志" />
      <view v-if="loading" class="p-24rpx text-center text-28rpx text-[#999]">
        加载中...
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { OperateLog } from '@/api/crm/operateLog'
import { onMounted, ref, watch } from 'vue'
import { getOperateLogPage } from '@/api/crm/operateLog'
import { formatDateTime } from '@/utils/date'

const props = defineProps<{
  bizId: number
  bizType: number
}>()

const loading = ref(false) // 日志加载状态
const list = ref<OperateLog[]>([]) // 操作日志

/** 加载操作日志 */
async function getList() {
  if (!props.bizId || !props.bizType) {
    return
  }
  loading.value = true
  try {
    const data = await getOperateLogPage({
      pageNo: 1,
      pageSize: 20,
      bizId: props.bizId,
      bizType: props.bizType,
    })
    list.value = data.list
  } finally {
    loading.value = false
  }
}

watch(
  () => [props.bizType, props.bizId],
  () => {
    getList()
  },
)

/** 初始化 */
onMounted(() => {
  getList()
})
</script>
