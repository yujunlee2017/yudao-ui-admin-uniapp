<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="粉丝消息"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 粉丝信息 -->
    <view class="bg-white px-24rpx py-20rpx">
      <view class="flex items-center gap-16rpx">
        <image
          v-if="userInfo.headImageUrl"
          :src="userInfo.headImageUrl"
          class="h-72rpx w-72rpx rounded-full"
          mode="aspectFill"
        />
        <view
          v-else
          class="h-72rpx w-72rpx flex items-center justify-center rounded-full bg-[#07c160] text-28rpx text-white"
        >
          {{ (userInfo.nickname || '粉')?.charAt(0) }}
        </view>
        <view class="min-w-0 flex-1">
          <view class="truncate text-30rpx text-[#333] font-semibold">
            {{ userInfo.nickname || '微信用户' }}
          </view>
          <view class="truncate text-24rpx text-[#999]">
            {{ userInfo.openid || routeOpenid || '-' }}
          </view>
        </view>
      </view>
    </view>

    <!-- 消息会话 -->
    <scroll-view
      scroll-y
      class="min-h-0 flex-1 bg-[#f3f5f7]"
      :scroll-into-view="scrollIntoView"
    >
      <view class="px-24rpx py-20rpx">
        <view class="mb-20rpx text-center">
          <wd-button
            v-if="hasMore"
            size="small"
            variant="plain"
            :loading="loading"
            @click="loadMore"
          >
            加载更多
          </wd-button>
          <text v-else class="text-24rpx text-[#999]">
            没有更多了
          </text>
        </view>

        <view
          v-for="(item, index) in list"
          :id="getMessageDomId(item, index)"
          :key="item.id || index"
          class="mb-24rpx"
        >
          <view class="mb-8rpx text-center text-22rpx text-[#999]">
            {{ formatDateTime(item.createTime) || '-' }}
          </view>
          <view
            class="flex gap-12rpx"
            :class="item.sendFrom === 2 ? 'flex-row-reverse' : 'flex-row'"
          >
            <view
              class="h-64rpx w-64rpx shrink-0 flex items-center justify-center rounded-full text-24rpx text-white"
              :class="item.sendFrom === 2 ? 'bg-[#1677ff]' : 'bg-[#07c160]'"
            >
              {{ item.sendFrom === 2 ? '号' : '粉' }}
            </view>
            <view
              class="max-w-[560rpx] rounded-12rpx px-20rpx py-16rpx text-28rpx shadow-sm"
              :class="item.sendFrom === 2 ? 'bg-[#dff5d8] text-[#1f1f1f]' : 'bg-white text-[#333]'"
            >
              <ReplyContent
                :type="item.type"
                :content="item.content"
                :media-url="item.mediaUrl"
                :recognition="item.recognition"
                :title="item.title"
                :description="item.description"
                :url="item.url"
                :event="item.event"
                :event-key="item.eventKey"
                :articles="item.articles"
                :thumb-media-url="item.thumbMediaUrl"
                :music-url="item.musicUrl"
                :hq-music-url="item.hqMusicUrl"
                :location-x="item.locationX"
                :location-y="item.locationY"
                :label="item.label"
              />
            </view>
          </view>
        </view>
        <view id="message-bottom" class="h-1rpx" />
      </view>
    </scroll-view>

    <!-- 发送区域 -->
    <view class="border-t border-[#eee] bg-white px-24rpx py-20rpx">
      <view class="mb-16rpx flex items-center gap-16rpx">
        <wd-button size="small" variant="plain" @click="sendTypePickerVisible = true">
          {{ sendTypeLabel }}
        </wd-button>
        <wd-button
          v-if="canPickMaterial"
          size="small"
          variant="plain"
          @click="materialPickerVisible = true"
        >
          素材库
        </wd-button>
      </view>
      <wd-picker
        v-model:visible="sendTypePickerVisible"
        :model-value="sendForm.type"
        :columns="sendTypeOptions"
        @confirm="handleSendTypeConfirm"
      />

      <template v-if="sendForm.type === 'text'">
        <wd-textarea
          v-model="sendForm.content"
          placeholder="请输入消息内容"
          :maxlength="600"
          show-word-limit
          clearable
        />
      </template>
      <template v-else>
        <wd-input v-model="sendForm.mediaId" clearable placeholder="请输入素材 MediaID" />
        <view class="h-12rpx" />
        <wd-input v-model="sendForm.url" clearable placeholder="请输入素材 URL" />
        <view class="h-12rpx" />
        <wd-input v-model="sendForm.title" clearable placeholder="请输入标题" />
        <view class="h-12rpx" />
        <wd-textarea v-model="sendForm.description" clearable placeholder="请输入描述" />
        <template v-if="sendForm.type === 'news'">
          <view class="h-12rpx" />
          <wd-textarea v-model="sendForm.articlesText" clearable placeholder="请输入图文数组 JSON" />
        </template>
        <template v-if="sendForm.type === 'music'">
          <view class="h-12rpx" />
          <wd-input v-model="sendForm.thumbMediaId" clearable placeholder="缩略图 MediaID（选图片素材回填）" />
          <view class="h-12rpx" />
          <wd-input v-model="sendForm.musicUrl" clearable placeholder="请输入音乐链接" />
          <view class="h-12rpx" />
          <wd-input v-model="sendForm.hqMusicUrl" clearable placeholder="请输入高质量音乐链接" />
        </template>
      </template>

      <wd-button class="mt-16rpx" type="primary" block :loading="sending" @click="handleSend">
        发送
      </wd-button>
    </view>

    <!-- 素材选择 -->
    <MaterialPicker
      v-model:visible="materialPickerVisible"
      :account-id="accountId"
      :type="materialPickerType"
      @select="handleMaterialSelect"
    />
  </view>
</template>

<script lang="ts" setup>
import type { MpMessage } from '@/api/mp/message'
import type { MpUser } from '@/api/mp/user'
import { onLoad } from '@dcloudio/uni-app'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, nextTick, reactive, ref } from 'vue'
import { getMessagePage, sendMessage } from '@/api/mp/message'
import { getUser } from '@/api/mp/user'
import { navigateBackPlus } from '@/utils'
import { formatDateTime } from '@/utils/date'
import MaterialPicker from '../../components/material-picker.vue'
import ReplyContent from '../../components/reply-content.vue'
import { getMpRouteNumber, getMpRouteString, useMpRouteParams } from '../../utils/route'

const props = defineProps<{
  userId?: number | any
  accountId?: number | any
  openid?: string
}>()
const { routeParams, syncRouteParams } = useMpRouteParams(props)

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const userId = computed(() => getMpRouteNumber(routeParams.userId))
const routeAccountId = computed(() => getMpRouteNumber(routeParams.accountId))
const routeOpenid = computed(() => getMpRouteString(routeParams.openid))
const accountId = ref<number>() // 当前公众号编号
const userInfo = reactive<MpUser>({
  id: undefined,
  nickname: '',
  openid: '',
  headImageUrl: '',
}) // 粉丝信息
const list = ref<MpMessage[]>([]) // 消息列表
const pageNo = ref(1) // 当前页码
const pageSize = 14 // 每页条数
const loading = ref(false) // 加载状态
const hasMore = ref(true) // 是否还有更多
const scrollIntoView = ref('message-bottom') // 滚动锚点
const sending = ref(false) // 发送状态
const sendTypePickerVisible = ref(false) // 类型选择器
const materialPickerVisible = ref(false) // 素材选择弹窗
const sendForm = reactive({
  type: 'text',
  content: '',
  mediaId: '',
  url: '',
  title: '',
  description: '',
  articlesText: '',
  thumbMediaId: '',
  musicUrl: '',
  hqMusicUrl: '',
}) // 发送表单
const sendTypeOptions = [
  { value: 'text', label: '文本' },
  { value: 'image', label: '图片' },
  { value: 'voice', label: '语音' },
  { value: 'video', label: '视频' },
  { value: 'news', label: '图文' },
  { value: 'music', label: '音乐' },
]

const sendTypeLabel = computed(() => sendTypeOptions.find(item => item.value === sendForm.type)?.label || '')
const canPickMaterial = computed(() => ['image', 'voice', 'video', 'news', 'music'].includes(sendForm.type))
const materialPickerType = computed(() => {
  if (sendForm.type === 'news') {
    return 'news'
  }
  if (sendForm.type === 'voice') {
    return 'voice'
  }
  if (sendForm.type === 'video') {
    return 'video'
  }
  return 'image'
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mp/message/index')
}

/** 初始化粉丝信息 */
async function initUser() {
  accountId.value = routeAccountId.value
  userInfo.openid = routeOpenid.value
  if (!userId.value) {
    return
  }
  try {
    const data = await getUser(userId.value)
    Object.assign(userInfo, data)
    accountId.value = data.accountId || accountId.value
  } catch {
    // 请求层已提示错误，保留路由携带的基础信息
  }
}

/** 获取消息 DOM 编号 */
function getMessageDomId(item: MpMessage, index: number) {
  return `message-${item.id || index}`
}

/** 加载消息 */
async function getList(reset = false) {
  if (!userId.value) {
    return
  }
  if (loading.value) {
    return
  }
  if (reset) {
    pageNo.value = 1
    list.value = []
    hasMore.value = true
  }
  loading.value = true
  try {
    const data = await getMessagePage({
      pageNo: pageNo.value,
      pageSize,
      userId: userId.value,
      accountId: accountId.value,
    })
    const messages = (data.list || []).reverse()
    list.value = reset ? messages : [...messages, ...list.value]
    hasMore.value = messages.length >= pageSize
    await nextTick()
    if (reset) {
      scrollIntoView.value = 'message-bottom'
    } else if (messages.length > 0) {
      scrollIntoView.value = getMessageDomId(messages[messages.length - 1], messages.length - 1)
    }
  } catch {
    hasMore.value = false
  } finally {
    loading.value = false
  }
}

/** 加载更多 */
function loadMore() {
  if (!hasMore.value || loading.value) {
    return
  }
  pageNo.value += 1
  getList()
}

/** 消息类型选择 */
function handleSendTypeConfirm({ value }: { value: string[] }) {
  sendForm.type = value[0]
  // 切换消息类型时清空旧字段，避免跨类型残留
  clearSendForm()
}

/** 选择素材 */
function handleMaterialSelect(item: any) {
  if (sendForm.type === 'news') {
    const articles = item.content?.newsItem || item.articles || []
    sendForm.articlesText = JSON.stringify(articles)
    sendForm.title = articles[0]?.title || ''
    return
  }
  // 音乐：选图片素材作为缩略图
  if (sendForm.type === 'music') {
    sendForm.thumbMediaId = item.mediaId || ''
    return
  }
  sendForm.mediaId = item.mediaId || ''
  sendForm.url = item.url || ''
  sendForm.title = item.title || item.name || ''
  sendForm.description = item.introduction || item.description || ''
}

/** 清空发送内容 */
function clearSendForm() {
  sendForm.content = ''
  sendForm.mediaId = ''
  sendForm.url = ''
  sendForm.title = ''
  sendForm.description = ''
  sendForm.articlesText = ''
  sendForm.thumbMediaId = ''
  sendForm.musicUrl = ''
  sendForm.hqMusicUrl = ''
}

/** 发送消息 */
async function handleSend() {
  if (!userId.value) {
    toast.show('缺少粉丝编号')
    return
  }
  if (sendForm.type === 'text' && !sendForm.content) {
    toast.show('请输入消息内容')
    return
  }
  if (['image', 'voice', 'video'].includes(sendForm.type) && !sendForm.mediaId) {
    toast.show('请选择或输入素材 MediaID')
    return
  }
  if (sendForm.type === 'video' && (!sendForm.title || !sendForm.description)) {
    toast.show('请填写视频标题与描述')
    return
  }
  if (sendForm.type === 'music' && (!sendForm.thumbMediaId || !sendForm.musicUrl || !sendForm.hqMusicUrl)) {
    toast.show('请填写音乐缩略图、音乐链接与高质量链接')
    return
  }

  const data: any = {
    userId: userId.value,
    accountId: accountId.value,
    type: sendForm.type,
    content: sendForm.content,
    mediaId: sendForm.mediaId,
    url: sendForm.url,
    title: sendForm.title,
    description: sendForm.description,
    thumbMediaId: sendForm.thumbMediaId,
    musicUrl: sendForm.musicUrl,
    hqMusicUrl: sendForm.hqMusicUrl,
  }
  if (sendForm.type === 'news' && sendForm.articlesText) {
    try {
      data.articles = JSON.parse(sendForm.articlesText)
      if (data.articles.length > 1) {
        data.articles = [data.articles[0]]
        toast.show('客服图文消息最多发送 1 条，已保留第一条')
      }
    } catch {
      toast.show('图文 JSON 格式不正确')
      return
    }
  }

  sending.value = true
  try {
    const message = await sendMessage(data)
    list.value = [...list.value, message]
    clearSendForm()
    await nextTick()
    scrollIntoView.value = 'message-bottom'
    toast.success('发送成功')
  } finally {
    sending.value = false
  }
}

/** 初始化 */
onLoad(async (query) => {
  syncRouteParams(query)
  await initUser()
  await getList(true)
})
</script>

<style lang="scss" scoped>
</style>
