<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="客服会话"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 会话列表 -->
    <view class="min-h-0 flex flex-1">
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
          <view class="line-clamp-2 mt-8rpx text-22rpx text-[#999]">
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
        <scroll-view
          class="min-h-0 flex-1 p-24rpx"
          scroll-y
          scroll-with-animation
          :scroll-into-view="scrollIntoId"
          :upper-threshold="50"
          @scrolltoupper="loadEarlier"
        >
          <!-- 历史消息加载提示（触顶下拉加载更早消息） -->
          <view v-if="currentConversation && parsedMessages.length > 0" class="pb-12rpx text-center text-22rpx text-[#bbb]">
            <text v-if="loadingHistory">加载中…</text>
            <text v-else-if="noMoreHistory">没有更多消息了</text>
            <text v-else>下拉加载更早消息</text>
          </view>
          <view
            v-for="item in parsedMessages"
            :id="`msg-${item.id}`"
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
              <!-- 图片消息 -->
              <image
                v-if="item.kind === 'image'"
                :src="item.picUrl"
                class="max-w-320rpx rounded-12rpx bg-[#eee]"
                mode="widthFix"
              />
              <!-- 商品消息 -->
              <view
                v-else-if="item.kind === 'product'"
                class="max-w-420rpx inline-flex items-center rounded-12rpx bg-white p-16rpx shadow-sm"
              >
                <image
                  v-if="item.picUrl"
                  :src="item.picUrl"
                  class="mr-16rpx h-96rpx w-96rpx rounded-8rpx bg-[#eee]"
                  mode="aspectFill"
                />
                <view class="min-w-0 flex-1">
                  <view class="line-clamp-2 text-26rpx text-[#333]">
                    {{ item.title || '商品' }}
                  </view>
                  <view class="mt-8rpx text-26rpx text-[#ff3000]">
                    ￥{{ item.price }}
                  </view>
                </view>
              </view>
              <!-- 订单消息 -->
              <view
                v-else-if="item.kind === 'order'"
                class="inline-block max-w-460rpx rounded-12rpx bg-white p-20rpx shadow-sm"
              >
                <view class="text-26rpx text-[#333]">
                  订单号：{{ item.orderNo || '-' }}
                </view>
                <view class="mt-8rpx text-22rpx text-[#999]">
                  共 {{ item.productCount || 0 }} 件商品，总金额：
                  <text class="text-[#ff3000]">￥{{ item.payPrice }}</text>
                </view>
              </view>
              <!-- 文本消息 -->
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
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import {
  getPromotionKefuConversationList,
} from '@/api/mall/promotion/kefu/conversation'
import {
  getPromotionKefuMessageList,
  sendPromotionKefuMessage,
  updatePromotionKefuMessageReadStatus,
} from '@/api/mall/promotion/kefu/message'
import { navigateBackPlus } from '@/utils'
import { formatDateTime } from '@/utils/date'
import { fenToYuan } from '@/utils/format'
import { connectKefuWebSocket, disconnectKefuWebSocket } from './composables/useKefuWebSocket'

// 客服消息内容类型：1 文本、2 图片、3 语音、4 视频、5 系统、10 商品、11 订单
const CONTENT_TYPE = { TEXT: 1, IMAGE: 2, VOICE: 3, VIDEO: 4, SYSTEM: 5, PRODUCT: 10, ORDER: 11 }
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
// 历史消息分页：后端按 create_time 倒序返回最多 10 条，使用最早一条的 createTime 作为下一页游标（lt create_time）
const historyCursor = ref<string>() // 历史消息游标（最早一条的 createTime）
const noMoreHistory = ref(false) // 是否已无更多历史消息
const loadingHistory = ref(false) // 历史消息加载中（防并发）
const scrollIntoId = ref('') // 锚点：滚动到指定消息（用于回到底部）

/** 渲染用消息结构（统一形状，避免联合类型在模板取值报错） */
interface ParsedMessage {
  id?: number
  createTime?: string
  senderLabel: string
  kind: 'system' | 'image' | 'text' | 'product' | 'order'
  text: string
  picUrl?: string
  title?: string
  price?: number
  orderNo?: string
  payPrice?: number
  productCount?: number
}

/** 解析消息内容，按类型区分文本/图片/系统/商品/订单消息（按 createTime 升序渲染，最新在底部） */
const parsedMessages = computed<ParsedMessage[]>(() => {
  return [...messages.value]
    .sort((a, b) => new Date(a.createTime || 0).getTime() - new Date(b.createTime || 0).getTime())
    .map((item): ParsedMessage => {
      const payload = parseContent(item.content)
      const isSystem = item.contentType === CONTENT_TYPE.SYSTEM
      const isImage = item.contentType === CONTENT_TYPE.IMAGE || (!isSystem && !!payload.picUrl)
      const base = {
        id: item.id,
        createTime: item.createTime,
        senderLabel: item.senderType === SENDER_ADMIN ? '客服' : '用户',
        text: '',
        picUrl: payload.picUrl,
      }
      // 商品消息（10）：spuName/picUrl/price(分)
      if (item.contentType === CONTENT_TYPE.PRODUCT) {
        return { ...base, kind: 'product', title: payload.spuName, price: fenToYuan(payload.price) }
      }
      // 订单消息（11）：no/payPrice(分)/productCount
      if (item.contentType === CONTENT_TYPE.ORDER) {
        return {
          ...base,
          kind: 'order',
          orderNo: payload.no,
          payPrice: fenToYuan(payload.payPrice),
          productCount: payload.productCount,
        }
      }
      return {
        ...base,
        kind: isSystem ? 'system' : (isImage ? 'image' : 'text'),
        text: payload.text || (typeof item.content === 'string' ? item.content : ''),
      }
    })
})

/** 解析消息 content（文本/图片/商品/订单均为 JSON 结构） */
function parseContent(content: any): Record<string, any> {
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

/** 选择会话：重置消息与历史分页状态 */
async function handleSelectConversation(item: PromotionKefuConversation) {
  currentConversation.value = item
  messages.value = []
  historyCursor.value = undefined
  noMoreHistory.value = false
  await updatePromotionKefuMessageReadStatus(Number(item.id))
  await loadMessages()
}

/** 去重合并消息（按 id 去重） */
function mergeMessages(list: PromotionKefuMessage[]) {
  for (const item of list) {
    if (!messages.value.some(exist => exist.id === item.id)) {
      messages.value.push(item)
    }
  }
}

/** 滚动到最新消息（升序渲染，最新在底部） */
function scrollToLatest() {
  const last = parsedMessages.value.at(-1)
  scrollIntoId.value = last?.id ? `msg-${last.id}` : ''
}

/** 加载最新消息（首屏/发送/收到新消息后刷新） */
async function loadMessages() {
  if (!currentConversation.value?.id) {
    messages.value = []
    return
  }
  // 后端按 create_time 倒序返回最多 10 条
  const res = await getPromotionKefuMessageList({
    conversationId: currentConversation.value.id,
  })
  mergeMessages(res || [])
  // 以本批最早一条（倒序的最后一条）的 createTime 作为历史游标
  if (res?.length) {
    historyCursor.value = formatDateTime(res.at(-1)!.createTime)
  }
  await nextTick()
  scrollToLatest()
}

/** 加载更早的历史消息（下拉/触顶分页，使用 createTime 游标 lt create_time） */
async function loadEarlier() {
  if (!currentConversation.value?.id || noMoreHistory.value || loadingHistory.value) {
    return
  }
  loadingHistory.value = true
  try {
    const res = await getPromotionKefuMessageList({
      conversationId: currentConversation.value.id,
      createTime: historyCursor.value,
    })
    // 空列表说明历史消息已加载完
    if (!res?.length) {
      noMoreHistory.value = true
      return
    }
    mergeMessages(res)
    historyCursor.value = formatDateTime(res.at(-1)!.createTime)
  } finally {
    loadingHistory.value = false
  }
}

/** 发送消息：文本消息封装为 { text } */
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

/** 收到新消息：属于当前会话则追加（升序渲染最新在底部）并标记已读，同时刷新会话列表 */
function handleWsMessage(message: PromotionKefuMessage) {
  if (message?.conversationId && currentConversation.value?.id === message.conversationId) {
    if (!messages.value.some(item => item.id === message.id)) {
      messages.value.push(message)
      nextTick(scrollToLatest)
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
