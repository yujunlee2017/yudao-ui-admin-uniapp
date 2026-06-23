<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="核销订单详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <view class="p-24rpx">
        <view class="mb-24rpx overflow-hidden rounded-12rpx bg-white p-24rpx shadow-sm">
          <wd-cell-group border>
            <!-- 订单号 -->
            <wd-cell v-if="formData.no != null" title="订单号" :value="formData.no" />
            <!-- 订单状态 -->
            <wd-cell v-if="formData.status != null" title="订单状态">
              <dict-tag :type="DICT_TYPE.TRADE_ORDER_STATUS" :value="formData.status" />
            </wd-cell>
            <!-- 实付金额 -->
            <wd-cell v-if="formData.payPrice != null" title="实付金额" :value="formatDisplayMoney(formData.payPrice)" />
            <!-- 自提门店 -->
            <wd-cell v-if="formData.pickUpStoreId != null" title="自提门店" :value="String(formData.pickUpStoreId)" />
            <!-- 核销码 -->
            <wd-cell v-if="formData.pickUpVerifyCode != null" title="核销码" :value="formData.pickUpVerifyCode" />
            <!-- 创建时间 -->
            <wd-cell v-if="formData.createTime != null" title="创建时间" :value="formatDateTime(formData.createTime)" />
          </wd-cell-group>
        </view>
      </view>
    </scroll-view>

    <!-- 底部操作按钮 -->
    <view v-if="hasAccessByCodes(['trade:order:pick-up'])" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button class="flex-1" type="primary" :loading="submitting" @click="handlePickUp">
          订单核销
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { TradeOrder } from '@/api/mall/trade/order'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref } from 'vue'
import { pickUpTradeOrder } from '@/api/mall/trade/order'
import { formatDisplayMoney } from '@/utils/format'
import { currRoute, navigateBackPlus } from '@/utils'
import { useAccess } from '@/hooks/useAccess'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const dialog = useDialog()
const { hasAccessByCodes } = useAccess()

const detailId = ref<number>() // 订单编号
const formData = ref<TradeOrder>({}) // 订单详情（来自列表透传的标量字段）
const submitting = ref(false) // 核销提交状态

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mall/trade/delivery/pick-up-order/index')
}

/** 订单核销 */
async function handlePickUp() {
  if (detailId.value == null) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: '确定要核销该订单吗？' })
  } catch {
    return
  }
  submitting.value = true
  try {
    await pickUpTradeOrder(Number(detailId.value))
    toast.success('核销成功')
    uni.$emit('mall:delivery-pick-up-order:reload')
    // 详情数据来自列表透传，核销成功后直接返回列表
    setTimeout(handleBack, 500)
  } finally {
    submitting.value = false
  }
}

/** 初始化：解析列表透传的标量字段 */
onMounted(() => {
  const query = currRoute().query
  // H5 下优先从 hash 上解析参数，兜底取 query
  let getParam = (key: string): string | undefined => query[key]
  // #ifdef H5
  const hashQuery = new URLSearchParams(window.location.hash.split('?')[1] || '')
  getParam = (key: string) => hashQuery.get(key) ?? query[key]
  // #endif

  detailId.value = Number(getParam('id') || 0) || undefined
  const no = getParam('no')
  const status = getParam('status')
  const payPrice = getParam('payPrice')
  const pickUpVerifyCode = getParam('pickUpVerifyCode')
  const pickUpStoreId = getParam('pickUpStoreId')
  const createTime = getParam('createTime')
  formData.value = {
    id: detailId.value,
    no: no != null ? decodeURIComponent(String(no)) : undefined,
    status: status != null && status !== '' ? Number(status) : undefined,
    payPrice: payPrice != null && payPrice !== '' ? Number(payPrice) : undefined,
    pickUpVerifyCode: pickUpVerifyCode != null ? decodeURIComponent(String(pickUpVerifyCode)) : undefined,
    pickUpStoreId: pickUpStoreId != null && pickUpStoreId !== '' ? Number(pickUpStoreId) : undefined,
    createTime: createTime != null ? decodeURIComponent(String(createTime)) : undefined,
  }
})
</script>

<style lang="scss" scoped>
</style>
