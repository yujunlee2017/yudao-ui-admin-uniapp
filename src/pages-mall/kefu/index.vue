<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="客服会话"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 会话列表 -->
    <scroll-view class="min-h-0 flex-1" scroll-y>
      <view v-if="conversations.length">
        <view
          v-for="item in conversations"
          :key="item.id"
          class="flex items-center gap-20rpx border-b border-[#f5f5f5] bg-white px-24rpx py-24rpx active:bg-[#f7f8fa]"
          @click="handleOpen(item)"
        >
          <!-- 头像 + 未读角标 -->
          <view class="relative shrink-0">
            <wd-img
              v-if="item.userAvatar"
              :src="item.userAvatar"
              width="88rpx" height="88rpx" radius="44rpx" mode="aspectFill"
            />
            <view v-else class="h-88rpx w-88rpx flex items-center justify-center rounded-full bg-[#e6f4ff]">
              <wd-icon name="user" size="44rpx" color="#1677ff" />
            </view>
            <view
              v-if="item.adminUnreadMessageCount"
              class="absolute min-w-32rpx rounded-16rpx bg-[#fa4350] px-8rpx text-center text-20rpx text-white leading-32rpx -right-8rpx -top-8rpx"
            >
              {{ item.adminUnreadMessageCount > 99 ? '99+' : item.adminUnreadMessageCount }}
            </view>
          </view>
          <!-- 昵称 + 最后消息 + 时间 -->
          <view class="min-w-0 flex-1">
            <view class="flex items-center justify-between gap-16rpx">
              <text class="truncate text-30rpx text-[#333] font-semibold">
                {{ item.userNickname || `用户 ${item.userId}` }}
              </text>
              <text class="shrink-0 text-22rpx text-[#999]">
                {{ formatKefuTime(item.lastMessageTime) }}
              </text>
            </view>
            <text class="line-clamp-1 mt-8rpx text-26rpx text-[#999]">
              {{ kefuLastMessagePreview(item.lastMessageContent, item.lastMessageContentType) }}
            </text>
          </view>
        </view>
      </view>
      <wd-empty v-else icon="message" tip="暂无会话" />
    </scroll-view>
  </view>
</template>

<script lang="ts" setup>
import type { PromotionKefuConversation } from '@/api/mall/promotion/kefu/conversation'
import { onUnload } from '@dcloudio/uni-app'
import { onMounted, onUnmounted, ref } from 'vue'
import { getPromotionKefuConversationList } from '@/api/mall/promotion/kefu/conversation'
import { navigateBackPlus } from '@/utils'
import { connectKefuWebSocket, disconnectKefuWebSocket } from './composables/useKefuWebSocket'
import { formatKefuTime, kefuLastMessagePreview } from './composables/message'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const conversations = ref<PromotionKefuConversation[]>([]) // 会话列表

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 加载会话列表 */
async function loadConversations() {
  conversations.value = await getPromotionKefuConversationList()
}

/** 打开会话详情 */
function handleOpen(item: PromotionKefuConversation) {
  const query = [
    `id=${item.id}`,
    item.userId != null ? `userId=${item.userId}` : '',
    item.userNickname ? `nickname=${encodeURIComponent(item.userNickname)}` : '',
  ].filter(Boolean).join('&')
  uni.navigateTo({ url: `/pages-mall/kefu/chat/index?${query}` })
}

/** 收到新消息 / 已读回执：刷新会话列表（未读数、最后消息） */
function handleWsRefresh() {
  loadConversations()
}

/** 初始化：加载会话 + 建立 WebSocket（单例，幂等） */
onMounted(() => {
  loadConversations()
  connectKefuWebSocket()
  uni.$on('mall:kefu:message', handleWsRefresh)
  uni.$on('mall:kefu:read', handleWsRefresh)
})

/** 卸载：离开客服功能时断开 WebSocket 与监听 */
// TODO @AI：这个需要讨论，websocket 对象，可以 cache 在全局的一个 store 或者哪里么？通过 event 去通信？
function cleanup() {
  uni.$off('mall:kefu:message', handleWsRefresh)
  uni.$off('mall:kefu:read', handleWsRefresh)
  disconnectKefuWebSocket()
}

onUnmounted(cleanup)
onUnload(cleanup)
</script>
