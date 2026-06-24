<template>
  <!-- 搜索框入口 -->
  <view @click="visible = true">
    <wd-search :placeholder="placeholder" hide-cancel disabled />
  </view>

  <!-- 搜索弹窗 -->
  <wd-popup
    v-model="visible"
    position="top"
    :custom-style="getTopPopupStyle()"
    :modal-style="getTopPopupModalStyle()"
    @close="visible = false"
  >
    <view class="yd-search-form-container">
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          应用编号
        </view>
        <wd-input v-model="formData.appId" type="number" placeholder="请输入应用编号" clearable />
      </view>
      <!-- TODO @AI：select 更好，太长了 -->
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          退款渠道
        </view>
        <wd-radio-group v-model="formData.channelCode" type="button">
          <wd-radio value="">
            全部
          </wd-radio>
          <wd-radio
            v-for="dict in getStrDictOptions(DICT_TYPE.PAY_CHANNEL_CODE)"
            :key="dict.value"
            :value="dict.value"
          >
            {{ dict.label }}
          </wd-radio>
        </wd-radio-group>
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          商户支付单号
        </view>
        <wd-input v-model="formData.merchantOrderId" placeholder="请输入商户支付单号" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          商户退款单号
        </view>
        <wd-input v-model="formData.merchantRefundId" placeholder="请输入商户退款单号" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          渠道支付单号
        </view>
        <wd-input v-model="formData.channelOrderNo" placeholder="请输入渠道支付单号" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          渠道退款单号
        </view>
        <wd-input v-model="formData.channelRefundNo" placeholder="请输入渠道退款单号" clearable />
      </view>
      <!-- TODO @AI：select 更好，太长了 -->
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          退款状态
        </view>
        <wd-radio-group v-model="formData.status" type="button">
          <wd-radio :value="-1">
            全部
          </wd-radio>
          <wd-radio
            v-for="dict in getIntDictOptions(DICT_TYPE.PAY_REFUND_STATUS)"
            :key="dict.value"
            :value="dict.value"
          >
            {{ dict.label }}
          </wd-radio>
        </wd-radio-group>
      </view>
      <yd-search-date-range v-model="formData.createTime" label="创建时间" />
      <view class="yd-search-form-actions">
        <wd-button class="flex-1" variant="plain" @click="handleReset">
          重置
        </wd-button>
        <wd-button class="flex-1" type="primary" @click="handleSearch">
          搜索
        </wd-button>
      </view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import { computed, reactive, ref } from 'vue'
import { getDictLabel, getIntDictOptions, getStrDictOptions } from '@/hooks/useDict'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate, formatDateRange } from '@/utils/date'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const formData = reactive({
  appId: undefined as string | undefined,
  channelCode: '',
  merchantOrderId: undefined as string | undefined,
  merchantRefundId: undefined as string | undefined,
  channelOrderNo: undefined as string | undefined,
  channelRefundNo: undefined as string | undefined,
  status: -1,
  createTime: [undefined, undefined] as [number | undefined, number | undefined],
}) // 搜索表单数据

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.appId) {
    conditions.push(`应用:${formData.appId}`)
  }
  if (formData.channelCode) {
    conditions.push(`渠道:${getDictLabel(DICT_TYPE.PAY_CHANNEL_CODE, formData.channelCode)}`)
  }
  if (formData.merchantOrderId) {
    conditions.push(`支付单号:${formData.merchantOrderId}`)
  }
  if (formData.merchantRefundId) {
    conditions.push(`退款单号:${formData.merchantRefundId}`)
  }
  if (formData.channelOrderNo) {
    conditions.push(`渠道支付单:${formData.channelOrderNo}`)
  }
  if (formData.channelRefundNo) {
    conditions.push(`渠道退款单:${formData.channelRefundNo}`)
  }
  if (formData.status !== -1) {
    conditions.push(`状态:${getDictLabel(DICT_TYPE.PAY_REFUND_STATUS, formData.status)}`)
  }
  if (formData.createTime?.[0] && formData.createTime?.[1]) {
    conditions.push(`时间:${formatDate(formData.createTime[0])}~${formatDate(formData.createTime[1])}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索退款订单'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    appId: formData.appId ? Number(formData.appId) : undefined,
    channelCode: formData.channelCode || undefined,
    merchantOrderId: formData.merchantOrderId || undefined,
    merchantRefundId: formData.merchantRefundId || undefined,
    channelOrderNo: formData.channelOrderNo || undefined,
    channelRefundNo: formData.channelRefundNo || undefined,
    status: formData.status === -1 ? undefined : formData.status,
    createTime: formatDateRange(formData.createTime),
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.appId = undefined
  formData.channelCode = ''
  formData.merchantOrderId = undefined
  formData.merchantRefundId = undefined
  formData.channelOrderNo = undefined
  formData.channelRefundNo = undefined
  formData.status = -1
  formData.createTime = [undefined, undefined]
  visible.value = false
  emit('reset')
}
</script>
