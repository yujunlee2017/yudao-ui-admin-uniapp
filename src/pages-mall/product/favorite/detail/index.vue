<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="收藏详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <wd-cell-group border>
      <wd-cell title="用户编号" :value="props.userId != null ? String(props.userId) : '-'" />
      <wd-cell title="商品编号" :value="props.spuId != null ? String(props.spuId) : '-'" />
      <wd-cell title="商品名称" :value="name || '-'" />
      <wd-cell title="商品图片">
        <image
          v-if="picUrl"
          :src="picUrl"
          class="h-112rpx w-112rpx rounded-8rpx bg-[#f5f5f5]"
          mode="aspectFill"
        />
        <text v-else>-</text>
      </wd-cell>
      <wd-cell title="销售价" :value="formatMallMoney(props.price)" />
      <wd-cell title="商品状态">
        <dict-tag v-if="props.status != null && props.status !== ''" :type="DICT_TYPE.PRODUCT_SPU_STATUS" :value="Number(props.status)" />
        <text v-else>-</text>
      </wd-cell>
      <wd-cell title="收藏时间" :value="formatDateTime(createTime) || '-'" />
    </wd-cell-group>
  </view>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { formatMallMoney } from '@/pages-mall/utils'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'

// 详情字段经列表页路由参数透传，避免收藏接口无 get 时“取前 100 条再 find”
const props = defineProps<{
  id?: number | any
  userId?: number | any
  spuId?: number | any
  name?: string
  picUrl?: string
  price?: number | any
  status?: number | any
  createTime?: string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const name = computed(() => props.name ? decodeURIComponent(props.name) : '') // 商品名称
const picUrl = computed(() => props.picUrl ? decodeURIComponent(props.picUrl) : '') // 商品图片
const createTime = computed(() => props.createTime ? decodeURIComponent(props.createTime) : '') // 收藏时间

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mall/product/favorite/index')
}
</script>
