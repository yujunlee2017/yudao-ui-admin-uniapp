<!-- 公众号消息内容展示：按消息 type 渲染文本 / 图片 / 语音 / 视频 / 图文 / 音乐 -->
<template>
  <view>
    <text v-if="type === 'text'">{{ content || '-' }}</text>
    <view v-else-if="type === 'image'">
      <wd-img v-if="mediaUrl" :src="mediaUrl" width="180rpx" height="180rpx" radius="8rpx" mode="aspectFill" enable-preview />
      <text v-else>-</text>
    </view>
    <view v-else-if="type === 'voice'">
      <text>{{ mediaUrl ? '语音素材' : '-' }}</text>
      <view v-if="recognition" class="mt-8rpx text-24rpx text-[#999]">
        {{ recognition }}
      </view>
    </view>
    <view v-else-if="type === 'video' || type === 'shortvideo'">
      <text>{{ title || mediaUrl || '视频素材' }}</text>
      <view v-if="description" class="mt-8rpx text-24rpx text-[#999]">
        {{ description }}
      </view>
    </view>
    <view v-else-if="type === 'news'">
      <NewsCard :articles="articles" />
    </view>
    <view v-else-if="type === 'music'">
      <wd-img
        v-if="thumbMediaUrl"
        :src="thumbMediaUrl"
        class="mb-12rpx"
        width="160rpx"
        height="160rpx"
        radius="8rpx"
        mode="aspectFill"
      />
      <view class="text-28rpx text-[#333]">
        {{ title || '音乐消息' }}
      </view>
      <view v-if="description" class="mt-8rpx text-24rpx text-[#999]">
        {{ description }}
      </view>
      <view v-if="musicUrl || hqMusicUrl" class="mt-8rpx break-all text-24rpx text-[#666]">
        {{ musicUrl || hqMusicUrl }}
      </view>
    </view>
    <view v-else-if="type === 'link'">
      <view class="text-28rpx text-[#333]">
        {{ title || url || '-' }}
      </view>
      <view v-if="description" class="mt-8rpx text-24rpx text-[#999]">
        {{ description }}
      </view>
      <view v-if="url" class="mt-8rpx break-all text-24rpx text-[#576b95]">
        {{ url }}
      </view>
    </view>
    <view v-else-if="type === 'location'">
      <text>{{ label || `${locationX || '-'}, ${locationY || '-'}` }}</text>
    </view>
    <view v-else-if="type === 'event'">
      <text>{{ getEventLabel(event) }}{{ eventKey ? `：${eventKey}` : '' }}</text>
    </view>
    <text v-else>{{ type || '-' }}</text>
  </view>
</template>

<script lang="ts" setup>
import NewsCard from './news-card.vue'

defineProps<{
  type?: string
  content?: string
  mediaUrl?: string
  recognition?: string
  title?: string
  description?: string
  url?: string
  event?: string
  eventKey?: string
  articles?: any[]
  thumbMediaUrl?: string
  musicUrl?: string
  hqMusicUrl?: string
  locationX?: string
  locationY?: string
  label?: string
}>()

/** 获取事件展示文案 */
function getEventLabel(event?: string) {
  const eventMap: Record<string, string> = {
    subscribe: '关注',
    unsubscribe: '取消关注',
    CLICK: '点击菜单',
    VIEW: '点击菜单链接',
    SCAN: '扫码',
    scancode_waitmsg: '扫码结果',
    scancode_push: '扫码结果',
    pic_sysphoto: '系统拍照发图',
    pic_photo_or_album: '拍照或者相册',
    pic_weixin: '微信相册',
    location_select: '选择地理位置',
  }
  return event ? eventMap[event] || event : '-'
}
</script>
