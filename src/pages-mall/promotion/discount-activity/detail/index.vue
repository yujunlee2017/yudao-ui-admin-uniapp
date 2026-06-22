<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="限时折扣详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <scroll-view class="min-h-0 flex-1" scroll-y>
      <view class="p-24rpx">
        <view class="mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm">
          <wd-cell-group border>
            <wd-cell title="活动编号" :value="formData.id != null ? String(formData.id) : '-'" />
            <wd-cell title="活动名称" :value="formData.name || '-'" />
            <wd-cell title="活动状态">
              <dict-tag v-if="formData.status != null" :type="DICT_TYPE.COMMON_STATUS" :value="formData.status" />
              <text v-else>-</text>
            </wd-cell>
            <wd-cell title="开始时间" :value="formatDateTime(formData.startTime) || '-'" />
            <wd-cell title="结束时间" :value="formatDateTime(formData.endTime) || '-'" />
            <wd-cell title="备注" :value="formData.remark || '-'" />
            <wd-cell title="创建时间" :value="formatDateTime(formData.createTime) || '-'" />
          </wd-cell-group>
        </view>

        <!-- 商品规则 -->
        <view v-if="formData.products?.length" class="mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm">
          <view class="border-b border-[#f0f0f0] px-24rpx py-18rpx text-30rpx text-[#333] font-semibold">
            优惠商品
          </view>
          <wd-cell-group border>
            <view v-for="(product, index) in formData.products" :key="index" class="px-24rpx py-16rpx">
              <view class="mb-8rpx text-28rpx text-[#333]">
                SKU 编号：{{ product.skuId }}
              </view>
              <view class="flex flex-wrap items-center gap-24rpx text-26rpx text-[#666]">
                <view class="flex items-center gap-8rpx">
                  <text>优惠类型：</text>
                  <dict-tag v-if="product.discountType != null" :type="DICT_TYPE.PROMOTION_DISCOUNT_TYPE" :value="product.discountType" />
                  <text v-else>-</text>
                </view>
                <text v-if="product.discountType === 1">优惠金额：{{ formatMallMoney(product.discountPrice) }}</text>
                <text v-if="product.discountType === 2">折扣：{{ product.discountPercent ?? '-' }}%</text>
              </view>
            </view>
          </wd-cell-group>
        </view>
      </view>
    </scroll-view>

    <!-- 底部操作按钮 -->
    <view v-if="canUpdate || canDelete || canClose" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button v-if="canUpdate" class="flex-1" type="warning" @click="handleEdit">
          编辑
        </wd-button>
        <wd-button v-if="canClose" class="flex-1" type="info" :loading="closing" @click="handleClose">
          关闭活动
        </wd-button>
        <wd-button v-if="canDelete" class="flex-1" type="danger" :loading="deleting" @click="handleDelete">
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { PromotionDiscountActivity } from '@/api/mall/promotion/discount'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import {
  closePromotionDiscountActivity,
  deletePromotionDiscountActivity,
  getPromotionDiscountActivity,
} from '@/api/mall/promotion/discount'
import { useAccess } from '@/hooks/useAccess'
import { formatMallMoney } from '@/pages-mall/utils'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
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
const formData = ref<PromotionDiscountActivity>({}) // 详情数据
const deleting = ref(false) // 删除状态
const closing = ref(false) // 关闭状态
const canUpdate = computed(() => hasAccessByCodes(['promotion:discount-activity:update']))
const canDelete = computed(() => hasAccessByCodes(['promotion:discount-activity:delete']))
const canClose = computed(() => hasAccessByCodes(['promotion:discount-activity:close']))

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mall/promotion/discount-activity/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getPromotionDiscountActivity(Number(props.id))
  } finally {
    toast.close()
  }
}

/** 编辑 */
function handleEdit() {
  uni.navigateTo({ url: `/pages-mall/promotion/discount-activity/form/index?id=${props.id}` })
}

/** 关闭活动 */
async function handleClose() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: '确定要关闭该活动吗？' })
  } catch {
    return
  }
  closing.value = true
  try {
    await closePromotionDiscountActivity(Number(props.id))
    toast.success('关闭成功')
    uni.$emit('mall:promotion-discount-activity:reload')
    await getDetail()
  } finally {
    closing.value = false
  }
}

/** 删除 */
async function handleDelete() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: '确定要删除该限时折扣活动吗？' })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deletePromotionDiscountActivity(Number(props.id))
    toast.success('删除成功')
    uni.$emit('mall:promotion-discount-activity:reload')
    setTimeout(() => handleBack(), 500)
  } finally {
    deleting.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
  uni.$on('mall:promotion-discount-activity:reload', getDetail)
})

/** 卸载 */
onUnload(() => {
  uni.$off('mall:promotion-discount-activity:reload', getDetail)
})
</script>
