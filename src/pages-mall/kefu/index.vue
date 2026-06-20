<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="客服会话"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 会话列表 -->
    <view class="flex min-h-0 flex-1">
      <scroll-view class="w-260rpx border-r border-[#f0f0f0] bg-white" scroll-y>
        <view
          v-for="item in conversations"
          :key="item.id"
          class="border-b border-[#f5f5f5] p-20rpx"
          :class="currentConversation?.id === item.id ? 'bg-[#e6f4ff]' : ''"
          @click="handleSelectConversation(item)"
        >
          <view class="truncate text-26rpx text-[#333] font-semibold">
            {{ item.userNickname || `用户 ${item.userId}` }}
          </view>
          <view class="mt-8rpx line-clamp-2 text-22rpx text-[#999]">
            {{ item.lastMessageContent || '暂无消息' }}
          </view>
          <wd-tag v-if="item.adminUnreadMessageCount" class="mt-8rpx" type="danger" plain>
            {{ item.adminUnreadMessageCount }}
          </wd-tag>
        </view>
        <view v-if="conversations.length === 0" class="p-24rpx text-center text-24rpx text-[#999]">
          暂无会话
        </view>
      </scroll-view>

      <!-- 消息区域 -->
      <view class="min-w-0 flex flex-1 flex-col bg-[#f7f8fa]">
        <scroll-view class="min-h-0 flex-1 p-24rpx" scroll-y>
          <view
            v-for="item in parsedMessages"
            :key="item.id"
            class="mb-20rpx"
          >
            <!-- 系统消息：居中展示 -->
            <view v-if="item.kind === 'system'" class="text-center text-22rpx text-[#999]">
              {{ item.text }}
            </view>
            <!-- 用户/客服消息 -->
            <template v-else>
              <view class="mb-8rpx text-22rpx text-[#999]">
                {{ item.senderLabel }} · {{ item.createTime || '-' }}
              </view>
              <image
                v-if="item.kind === 'image'"
                :src="item.picUrl"
                class="max-w-320rpx rounded-12rpx bg-[#eee]"
                mode="widthFix"
              />
              <view
                v-else
                class="inline-block max-w-full rounded-12rpx bg-white p-20rpx text-26rpx text-[#333] shadow-sm"
              >
                {{ item.text }}
              </view>
            </template>
          </view>
          <view v-if="currentConversation && parsedMessages.length === 0" class="pt-80rpx text-center text-26rpx text-[#999]">
            暂无消息
          </view>
          <view v-if="!currentConversation" class="pt-80rpx text-center text-26rpx text-[#999]">
            请选择会话
          </view>
        </scroll-view>
        <view v-if="currentConversation" class="border-t border-[#eee] bg-white p-16rpx">
          <wd-textarea v-model="messageContent" clearable :maxlength="1000" placeholder="输入回复内容" />
          <wd-button class="mt-12rpx" type="primary" block :loading="sending" @click="handleSend">
            发送
          </wd-button>
        </view>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { PromotionKefuConversation } from '@/api/mall/promotion/kefu/conversation'
import type { PromotionKefuMessage } from '@/api/mall/promotion/kefu/message'
import { onUnload } from '@dcloudio/uni-app'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import {
  getPromotionKefuConversationList,
} from '@/api/mall/promotion/kefu/conversation'
import {
  getPromotionKefuMessageList,
  sendPromotionKefuMessage,
  updatePromotionKefuMessageReadStatus,
} from '@/api/mall/promotion/kefu/message'
import { navigateBackPlus } from '@/utils'
import { connectKefuWebSocket, disconnectKefuWebSocket } from './composables/useKefuWebSocket'

// 客服消息内容类型：1 文本、2 图片、10 系统（其余按结构化消息兜底）
const CONTENT_TYPE = { TEXT: 1, IMAGE: 2, SYSTEM: 10 }
// 发送者类型：1 会员、2 管理员（客服）
const SENDER_ADMIN = 2

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const conversations = ref<PromotionKefuConversation[]>([]) // 会话列表
const currentConversation = ref<PromotionKefuConversation>() // 当前会话
const messages = ref<PromotionKefuMessage[]>([]) // 消息列表
const messageContent = ref('') // 消息内容
const sending = ref(false) // 发送状态

/** 解析消息内容，按类型区分文本/图片/系统消息 */
const parsedMessages = computed(() => {
  return messages.value.map((item) => {
    const payload = parseContent(item.content)
    const isImage = item.contentType === CONTENT_TYPE.IMAGE || !!payload.picUrl
    const isSystem = item.contentType === CONTENT_TYPE.SYSTEM
    return {
      id: item.id,
      createTime: item.createTime,
      senderLabel: item.senderType === SENDER_ADMIN ? '客服' : '用户',
      kind: isSystem ? 'system' : (isImage ? 'image' : 'text'),
      text: payload.text || (typeof item.content === 'string' ? item.content : ''),
      picUrl: payload.picUrl,
    }
  })
})

/** 解析消息 content（PC 端文本/图片均为 JSON 结构） */
function parseContent(content: any): { text?: string, picUrl?: string } {
  if (typeof content !== 'string') {
    return content || {}
  }
  const text = content.trim()
  if (!text.startsWith('{')) {
    return { text }
  }
  try {
    return JSON.parse(text)
  } catch {
    return { text }
  }
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mall/index')
}

/** 加载会话 */
async function loadConversations() {
  conversations.value = await getPromotionKefuConversationList()
  if (!currentConversation.value && conversations.value.length > 0) {
    await handleSelectConversation(conversations.value[0])
  }
}

/** 选择会话 */
async function handleSelectConversation(item: PromotionKefuConversation) {
  currentConversation.value = item
  await updatePromotionKefuMessageReadStatus(Number(item.id))
  await loadMessages()
}

/** 加载消息 */
async function loadMessages() {
  if (!currentConversation.value?.id) {
    messages.value = []
    return
  }
  messages.value = await getPromotionKefuMessageList({
    conversationId: currentConversation.value.id,
  })
}

/** 发送消息：文本消息按 PC 端结构封装为 { text } */
async function handleSend() {
  if (!currentConversation.value?.id || !messageContent.value.trim()) {
    return
  }
  sending.value = true
  try {
    await sendPromotionKefuMessage({
      conversationId: currentConversation.value.id,
      receiverId: currentConversation.value.userId,
      receiverType: 1,
      contentType: CONTENT_TYPE.TEXT,
      content: JSON.stringify({ text: messageContent.value.trim() }),
    })
    messageContent.value = ''
    await loadMessages()
    await loadConversations()
  } finally {
    sending.value = false
  }
}

/** 收到新消息：属于当前会话则追加并标记已读，同时刷新会话列表 */
function handleWsMessage(message: PromotionKefuMessage) {
  if (message?.conversationId && currentConversation.value?.id === message.conversationId) {
    if (!messages.value.some(item => item.id === message.id)) {
      messages.value.push(message)
    }
    updatePromotionKefuMessageReadStatus(Number(message.conversationId))
  }
  loadConversations()
}

/** 收到已读回执：刷新会话列表 */
function handleWsRead() {
  loadConversations()
}

/** 初始化：加载会话 + 建立 WebSocket 实时链路 */
onMounted(() => {
  loadConversations()
  connectKefuWebSocket()
  uni.$on('mall:kefu:message', handleWsMessage)
  uni.$on('mall:kefu:read', handleWsRead)
})

/** 卸载：断开 WebSocket 与事件监听 */
function cleanup() {
  uni.$off('mall:kefu:message', handleWsMessage)
  uni.$off('mall:kefu:read', handleWsRead)
  disconnectKefuWebSocket()
}

onUnmounted(cleanup)
onUnload(cleanup)
</script>
