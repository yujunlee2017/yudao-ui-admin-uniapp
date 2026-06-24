<!-- TODO @AI：可以去掉哈，不重要； -->
<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="公众号管理"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 功能入口 -->
    <view class="p-24rpx">
      <wd-grid :column="3" clickable :border="false">
        <wd-grid-item
          v-for="item in menuList"
          :key="item.path"
          :text="item.name"
          @click="handleNavigate(item.path)"
        >
          <template #icon>
            <view class="h-72rpx w-72rpx flex items-center justify-center rounded-12rpx bg-[#e6f4ff]">
              <wd-icon :name="item.icon" size="42rpx" color="#1677ff" />
            </view>
          </template>
        </wd-grid-item>
      </wd-grid>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { navigateBackPlus } from '@/utils'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const menuList = [
  { name: '账号', icon: 'user-group', path: '/pages-mp/account/index' },
  { name: '标签', icon: 'tag', path: '/pages-mp/tag/index' },
  { name: '粉丝', icon: 'user', path: '/pages-mp/user/index' },
  { name: '菜单', icon: 'settings', path: '/pages-mp/menu/index' },
  { name: '自动回复', icon: 'reply', path: '/pages-mp/auto-reply/index' },
  { name: '消息', icon: 'email', path: '/pages-mp/message/index' },
  { name: '模板', icon: 'notification', path: '/pages-mp/message-template/index' },
  { name: '素材', icon: 'image', path: '/pages-mp/material/index' },
  { name: '草稿', icon: 'edit', path: '/pages-mp/draft/index' },
  { name: '发表', icon: 'share-alt', path: '/pages-mp/free-publish/index' },
  { name: '统计', icon: 'dashboard', path: '/pages-mp/statistics/index' },
]

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 页面跳转 */
function handleNavigate(path: string) {
  uni.navigateTo({ url: path })
}
</script>

<style lang="scss" scoped>
</style>
