<template>
  <view class="h-full flex flex-col bg-white">
    <!-- 搜索 -->
    <view class="px-24rpx pb-8rpx pt-12rpx">
      <wd-search v-model="keyword" placeholder="搜索群聊" hide-cancel />
    </view>

    <scroll-view class="min-h-0 flex-1" scroll-y>
      <!-- 加群申请入口 -->
      <view class="flex items-center gap-20rpx px-24rpx py-20rpx active:bg-[#f5f5f5]" @click="goRequests">
        <view class="h-84rpx w-84rpx flex items-center justify-center rounded-12rpx bg-[#13c2c2]">
          <wd-icon name="notification" size="44rpx" color="#fff" />
        </view>
        <view class="flex-1 border-b border-b-[#f2f3f5] py-10rpx text-30rpx text-[#222]">加群申请</view>
      </view>

      <!-- 群聊列表 -->
      <view
        v-for="item in filteredGroups"
        :key="item.id"
        class="flex items-center gap-20rpx px-24rpx active:bg-[#f5f5f5]"
        @click="openChat(item)"
      >
        <view class="py-16rpx">
          <ImAvatar :src="item.avatar" :name="item.name" :round="false" size="84rpx" />
        </view>
        <view class="min-w-0 flex-1 border-b border-b-[#f2f3f5] py-16rpx">
          <view class="flex items-center gap-10rpx">
            <text class="line-clamp-1 text-30rpx text-[#222] font-medium">{{ item.name }}</text>
            <wd-tag v-if="item.banned" type="danger" plain custom-class="scale-90">已封禁</wd-tag>
            <wd-tag v-if="item.mutedAll" type="warning" plain custom-class="scale-90">全员禁言</wd-tag>
          </view>
          <view class="mt-4rpx line-clamp-1 text-24rpx text-[#999]">{{ item.notice || '暂无群公告' }}</view>
        </view>
      </view>

      <wd-empty v-if="!loading && filteredGroups.length === 0" icon="content" tip="暂无群聊" />
    </scroll-view>
  </view>
</template>

<script lang="ts" setup>
import type { ImGroupRespVO } from '@/api/im/group'
import { computed, ref, watch } from 'vue'
import { getMyGroupList } from '@/api/im/group'
import { ImConversationType } from '@/utils/constants'
import ImAvatar from '../../components/im-avatar.vue'

const props = defineProps<{
  active?: boolean
}>()

const keyword = ref('') // 搜索关键词
const loading = ref(false) // 加载状态
const groupList = ref<ImGroupRespVO[]>([]) // 群聊列表

/** 群聊过滤列表 */
const filteredGroups = computed(() => {
  const word = keyword.value.trim().toLowerCase()
  return groupList.value
    .filter(item => item.status !== 1)
    .filter((item) => {
      if (!word) {
        return true
      }
      return [item.name, item.notice, item.id].some(value => String(value || '').toLowerCase().includes(word))
    })
})

/** 加群申请 */
function goRequests() {
  uni.navigateTo({ url: '/pages-im/home/request/index?tab=group' })
}

/** 打开群聊 */
function openChat(item: ImGroupRespVO) {
  uni.navigateTo({
    url: `/pages-im/home/chat/index?type=${ImConversationType.GROUP}&targetId=${item.id}&title=${encodeURIComponent(item.name)}`,
  })
}

/** 加载群聊 */
async function load() {
  loading.value = true
  try {
    groupList.value = await getMyGroupList()
  } finally {
    loading.value = false
  }
}

/** 激活时加载 */
watch(() => props.active, (val) => {
  if (val) {
    load()
  }
}, { immediate: true })
</script>
