<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏：标题为会员昵称，右侧进入会员资料 -->
    <wd-navbar
      :title="nickname || '会话'"
      left-arrow placeholder safe-area-inset-top fixed
      right-text="会员资料"
      @click-left="handleBack"
      @click-right="handleMember"
    />

    <!-- 消息区域 -->
    <!-- TODO @AI：高度不对 -->
    <!-- TODO @AI：可以使用 z-page 么？ -->
    <scroll-view
      class="min-h-0 flex-1 bg-[#f7f8fa]"
      scroll-y
      scroll-with-animation
      :scroll-into-view="scrollIntoId"
      :upper-threshold="50"
      @scrolltoupper="loadEarlier"
    >
      <view class="p-24rpx">
        <!-- 历史消息加载提示 -->
        <view v-if="renderMessages.length" class="pb-12rpx text-center text-22rpx text-[#bbb]">
          <text v-if="loadingHistory">加载中…</text>
          <text v-else-if="noMoreHistory">没有更多消息了</text>
          <text v-else>下拉加载更早消息</text>
        </view>

        <view
          v-for="item in renderMessages"
          :id="`msg-${item.id}`"
          :key="item.id"
          class="mb-24rpx"
        >
          <!-- 时间分隔（间隔较大时展示） -->
          <view v-if="item.showTime" class="mb-16rpx text-center text-22rpx text-[#bbb]">
            {{ formatKefuDateTime(item.createTime) }}
          </view>

          <!-- 系统消息：居中 -->
          <view v-if="item.kind === 'system'" class="text-center text-22rpx text-[#999]">
            {{ item.text }}
          </view>

          <!-- 用户 / 客服消息：客服(管理员)靠右，用户靠左 -->
          <view v-else class="flex" :class="item.fromAdmin ? 'justify-end' : 'justify-start'">
            <!-- 图片消息 -->
            <image
              v-if="item.kind === 'image'"
              :src="item.picUrl"
              class="max-w-360rpx rounded-12rpx bg-[#eee]"
              mode="widthFix"
            />
            <!-- 商品消息 -->
            <view
              v-else-if="item.kind === 'product'"
              class="max-w-460rpx flex items-center rounded-12rpx bg-white p-16rpx shadow-sm"
            >
              <view v-if="item.picUrl" class="mr-16rpx shrink-0">
                <wd-img :src="item.picUrl" width="96rpx" height="96rpx" radius="8rpx" mode="aspectFill" />
              </view>
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
              class="max-w-460rpx rounded-12rpx bg-white p-20rpx shadow-sm"
            >
              <view class="text-26rpx text-[#333]">
                订单号：{{ item.orderNo || '-' }}
              </view>
              <view class="mt-8rpx text-22rpx text-[#999]">
                共 {{ item.productCount || 0 }} 件，总金额：<text class="text-[#ff3000]">￥{{ item.payPrice }}</text>
              </view>
            </view>
            <!-- 文本消息：客服蓝底白字，用户白底深字 -->
            <view
              v-else
              class="max-w-[70%] whitespace-pre-wrap break-all rounded-12rpx p-20rpx text-28rpx"
              :class="item.fromAdmin ? 'bg-[#1677ff] text-white' : 'bg-white text-[#333] shadow-sm'"
            >
              {{ item.text }}
            </view>
          </view>
        </view>

        <view v-if="!renderMessages.length" class="pt-120rpx text-center text-26rpx text-[#999]">
          暂无消息
        </view>
      </view>
    </scroll-view>

    <!-- 输入区域 -->
    <!-- TODO @AI：表情发送 -->
    <!-- TODO @AI：图片发送 -->
    <view class="safe-area-inset-bottom flex items-end gap-16rpx border-t border-[#eee] bg-white p-16rpx">
      <wd-textarea
        v-model="messageContent"
        class="min-w-0 flex-1"
        :maxlength="1000"
        :auto-height="true"
        placeholder="输入回复内容"
      />
      <wd-button type="primary" :loading="sending" :disabled="!messageContent.trim()" @click="handleSend">
        发送
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { PromotionKefuMessage } from '@/api/mall/promotion/kefu/message'
import { onUnload } from '@dcloudio/uni-app'
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import {
  getPromotionKefuMessageList,
  sendPromotionKefuMessage,
  updatePromotionKefuMessageReadStatus,
} from '@/api/mall/promotion/kefu/message'
import { navigateBackPlus } from '@/utils'
import { formatKefuDateTime, KefuContentType, parseKefuMessage } from '../composables/message'
import { connectKefuWebSocket } from '../composables/useKefuWebSocket'

const props = defineProps<{
  id?: number | any // 会话编号
  userId?: number | any // 会员编号
  nickname?: string // 会员昵称（导航标题）
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const conversationId = computed(() => props.id != null && props.id !== '' ? Number(props.id) : undefined) // 会话编号
const nickname = computed(() => props.nickname ? decodeURIComponent(String(props.nickname)) : '') // 会员昵称

const messages = ref<PromotionKefuMessage[]>([]) // 消息列表
const messageContent = ref('') // 输入内容
const sending = ref(false) // 发送状态
const historyCursor = ref<string>() // 历史游标（最早一条 createTime）
const noMoreHistory = ref(false) // 是否已无更多历史
const loadingHistory = ref(false) // 历史加载中（防并发）
const scrollIntoId = ref('') // 滚动锚点

/** 毫秒时间戳容错：兼容数字、纯数字字符串、日期字符串 */
function toMs(time?: string | number) {
  if (time == null || time === '') {
    return 0
  }
  const ms = typeof time === 'number' ? time : (/^\d+$/.test(String(time)) ? Number(time) : Date.parse(String(time)))
  return Number.isNaN(ms) ? 0 : ms
}

/** 渲染用消息：升序 + 间隔超 5 分钟展示时间分隔 */
const renderMessages = computed(() => {
  const sorted = [...messages.value].sort((a, b) => toMs(a.createTime) - toMs(b.createTime))
  let lastMs = 0
  return sorted.map((item) => {
    const ms = toMs(item.createTime)
    const showTime = ms - lastMs > 5 * 60 * 1000
    lastMs = ms
    return { ...parseKefuMessage(item), showTime }
  })
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mall/kefu/index')
}

/** 进入会员资料 */
function handleMember() {
  if (props.userId == null || props.userId === '') {
    return
  }
  uni.navigateTo({ url: `/pages-mall/kefu/member/index?userId=${props.userId}` })
}

/** 去重合并消息（按 id） */
function mergeMessages(list: PromotionKefuMessage[]) {
  for (const item of list) {
    if (!messages.value.some(exist => exist.id === item.id)) {
      messages.value.push(item)
    }
  }
}

/** 滚动到最新（升序渲染，最新在底部） */
function scrollToLatest() {
  const last = renderMessages.value.at(-1)
  scrollIntoId.value = last?.id ? `msg-${last.id}` : ''
}

/** 标记会话已读，并通知会话列表刷新未读数 */
async function markRead() {
  if (!conversationId.value) {
    return
  }
  await updatePromotionKefuMessageReadStatus(conversationId.value)
  uni.$emit('mall:kefu:read')
}

/** 加载最新消息（首屏）：后端按 create_time 倒序返回最多 10 条 */
async function loadMessages() {
  if (!conversationId.value) {
    return
  }
  const res = await getPromotionKefuMessageList({ conversationId: conversationId.value })
  mergeMessages(res || [])
  if (res?.length) {
    historyCursor.value = formatKefuDateTime(res.at(-1)!.createTime)
  }
  await nextTick()
  scrollToLatest()
}

/** 加载更早历史（触顶分页，createTime 游标 lt） */
async function loadEarlier() {
  if (!conversationId.value || noMoreHistory.value || loadingHistory.value) {
    return
  }
  loadingHistory.value = true
  try {
    const res = await getPromotionKefuMessageList({ conversationId: conversationId.value, createTime: historyCursor.value })
    if (!res?.length) {
      noMoreHistory.value = true
      return
    }
    mergeMessages(res)
    historyCursor.value = formatKefuDateTime(res.at(-1)!.createTime)
  } finally {
    loadingHistory.value = false
  }
}

/** 发送文本消息 */
async function handleSend() {
  if (!conversationId.value || !messageContent.value.trim()) {
    return
  }
  sending.value = true
  try {
    await sendPromotionKefuMessage({
      conversationId: conversationId.value,
      receiverId: props.userId != null && props.userId !== '' ? Number(props.userId) : undefined,
      receiverType: 1,
      contentType: KefuContentType.TEXT,
      content: JSON.stringify({ text: messageContent.value.trim() }),
    })
    messageContent.value = ''
    await loadMessages()
  } finally {
    sending.value = false
  }
}

/** 收到新消息：属于当前会话则追加并标记已读 */
function handleWsMessage(message: PromotionKefuMessage) {
  if (!message || message.conversationId !== conversationId.value) {
    return
  }
  if (!messages.value.some(item => item.id === message.id)) {
    messages.value.push(message)
    nextTick(scrollToLatest)
  }
  markRead()
}

/** 初始化：标记已读 + 加载消息 + 监听 WebSocket（连接由会话列表维持） */
onMounted(() => {
  connectKefuWebSocket()
  markRead()
  loadMessages()
  uni.$on('mall:kefu:message', handleWsMessage)
})

/** 卸载：仅移除本页监听，不断开 WebSocket（会话列表统一管理） */
function cleanup() {
  uni.$off('mall:kefu:message', handleWsMessage)
}

onUnmounted(cleanup)
onUnload(cleanup)
</script>
