<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="优惠券详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <wd-cell-group border>
      <wd-cell title="优惠券名称" :value="name || '-'" />
      <wd-cell title="模板编号" :value="props.templateId != null ? String(props.templateId) : '-'" />
      <wd-cell title="用户编号" :value="props.userId != null ? String(props.userId) : '-'" />
      <wd-cell title="优惠类型">
        <dict-tag v-if="props.discountType != null && props.discountType !== ''" :type="DICT_TYPE.PROMOTION_DISCOUNT_TYPE" :value="Number(props.discountType)" />
        <text v-else>-</text>
      </wd-cell>
      <wd-cell title="使用门槛" :value="formatMallMoney(props.usePrice)" />
      <wd-cell title="优惠金额" :value="formatMallMoney(props.discountPrice)" />
      <wd-cell title="状态">
        <dict-tag v-if="props.status != null && props.status !== ''" :type="DICT_TYPE.PROMOTION_COUPON_STATUS" :value="Number(props.status)" />
        <text v-else>-</text>
      </wd-cell>
      <wd-cell title="使用时间" :value="formatDateTime(useTime) || '-'" />
      <wd-cell title="领取时间" :value="formatDateTime(createTime) || '-'" />
    </wd-cell-group>

    <!-- 底部操作按钮 -->
    <view v-if="canDelete" class="yd-detail-footer">
      <wd-button type="danger" block :loading="deleting" @click="handleDelete">
        删除（回收）
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref } from 'vue'
import { deletePromotionCoupon } from '@/api/mall/promotion/coupon/coupon'
import { useAccess } from '@/hooks/useAccess'
import { formatMallMoney } from '@/pages-mall/utils'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'

// 详情字段经列表页路由参数透传（优惠券接口无 get）
const props = defineProps<{
  id?: number | any
  name?: string
  templateId?: number | any
  userId?: number | any
  discountType?: number | any
  status?: number | any
  usePrice?: number | any
  discountPrice?: number | any
  useTime?: string
  createTime?: string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const dialog = useDialog()
const toast = useToast()
const deleting = ref(false) // 删除状态
const name = computed(() => props.name ? decodeURIComponent(props.name) : '') // 优惠券名称
const useTime = computed(() => props.useTime ? decodeURIComponent(props.useTime) : '') // 使用时间
const createTime = computed(() => props.createTime ? decodeURIComponent(props.createTime) : '') // 领取时间
const canDelete = computed(() => hasAccessByCodes(['promotion:coupon:delete']))

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mall/promotion/coupon/index')
}

/** 删除（回收）优惠券 */
async function handleDelete() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: '确定要回收该优惠券吗？' })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deletePromotionCoupon(Number(props.id))
    toast.success('回收成功')
    uni.$emit('mall:promotion-coupon:reload')
    setTimeout(() => handleBack(), 500)
  } finally {
    deleting.value = false
  }
}
</script>
