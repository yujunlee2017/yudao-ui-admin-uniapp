<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="拼团活动详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <scroll-view class="min-h-0 flex-1" scroll-y>
      <view class="p-24rpx">
        <view class="mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm">
          <wd-cell-group border>
            <wd-cell title="活动名称" :value="formData.name || '-'" />
            <wd-cell title="商品编号" :value="formData.spuId != null ? String(formData.spuId) : '-'" />
            <wd-cell title="成团人数" :value="formData.userSize != null ? String(formData.userSize) : '-'" />
            <wd-cell title="限制时长(时)" :value="formData.limitDuration != null ? String(formData.limitDuration) : '-'" />
            <wd-cell title="总限购" :value="formData.totalLimitCount != null ? String(formData.totalLimitCount) : '-'" />
            <wd-cell title="单次限购" :value="formData.singleLimitCount != null ? String(formData.singleLimitCount) : '-'" />
            <wd-cell title="虚拟成团" :value="formData.virtualGroup ? '是' : '否'" />
            <wd-cell title="开始时间" :value="formatDateTime(formData.startTime) || '-'" />
            <wd-cell title="结束时间" :value="formatDateTime(formData.endTime) || '-'" />
          </wd-cell-group>
        </view>

        <!-- 拼团商品 -->
        <!-- TODO @AI：有没更好的展示？类似 sku、spu 界面？注意：实现的时候联系下拼团、砍价、秒杀活动的处理； -->
        <view v-if="formData.products?.length" class="mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm">
          <view class="border-b border-[#f0f0f0] px-24rpx py-18rpx text-30rpx text-[#333] font-semibold">
            拼团商品
          </view>
          <view v-for="(product, index) in formData.products" :key="index" class="px-24rpx py-16rpx">
            <view class="mb-8rpx text-28rpx text-[#333]">
              SKU 编号：{{ product.skuId }}
            </view>
            <view class="text-26rpx text-[#666]">
              拼团价：{{ formatDisplayMoney(product.combinationPrice) }}
            </view>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 底部操作按钮 -->
    <view v-if="hasAccessByCodes(['promotion:combination-activity:update', 'promotion:combination-activity:delete', 'promotion:combination-activity:close'])" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button v-if="hasAccessByCodes(['promotion:combination-activity:update'])" class="flex-1" type="warning" @click="handleEdit">
          编辑
        </wd-button>
        <wd-button v-if="hasAccessByCodes(['promotion:combination-activity:close'])" class="flex-1" type="info" :loading="closing" @click="handleClose">
          关闭活动
        </wd-button>
        <wd-button v-if="hasAccessByCodes(['promotion:combination-activity:delete'])" class="flex-1" type="danger" :loading="deleting" @click="handleDelete">
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { PromotionCombinationActivity } from '@/api/mall/promotion/combination'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref } from 'vue'
import {
  closePromotionCombinationActivity,
  deletePromotionCombinationActivity,
  getPromotionCombinationActivity,
} from '@/api/mall/promotion/combination'
import { useAccess } from '@/hooks/useAccess'
import { formatDisplayMoney } from '@/utils/format'
import { navigateBackPlus } from '@/utils'
import { formatDateTime } from '@/utils/date'

const props = defineProps<{ id?: number | any }>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const dialog = useDialog()
const toast = useToast()
const formData = ref<PromotionCombinationActivity>({}) // 详情数据
const deleting = ref(false) // 删除状态
const closing = ref(false) // 关闭状态

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mall/promotion/combination/activity/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getPromotionCombinationActivity(Number(props.id))
  } finally {
    toast.close()
  }
}

/** 编辑 */
function handleEdit() {
  uni.navigateTo({ url: `/pages-mall/promotion/combination/activity/form/index?id=${props.id}` })
}

/** 关闭活动 */
async function handleClose() {
  try {
    await dialog.confirm({ title: '提示', msg: '确定要关闭该活动吗？' })
  } catch {
    return
  }
  closing.value = true
  try {
    await closePromotionCombinationActivity(Number(props.id))
    toast.success('关闭成功')
    uni.$emit('mall:promotion-combination-activity:reload')
    await getDetail()
  } finally {
    closing.value = false
  }
}

/** 删除 */
async function handleDelete() {
  try {
    await dialog.confirm({ title: '提示', msg: '确定要删除该拼团活动吗？' })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deletePromotionCombinationActivity(Number(props.id))
    toast.success('删除成功')
    uni.$emit('mall:promotion-combination-activity:reload')
    setTimeout(() => handleBack(), 500)
  } finally {
    deleting.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
  uni.$on('mall:promotion-combination-activity:reload', getDetail)
})

/** 卸载 */
onUnload(() => {
  uni.$off('mall:promotion-combination-activity:reload', getDetail)
})
</script>
