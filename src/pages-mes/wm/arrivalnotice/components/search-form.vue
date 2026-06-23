<template>
  <!-- 搜索框入口 -->
  <view @click="visible = true">
    <wd-search :placeholder="placeholder" hide-cancel disabled />
  </view>

  <!-- 搜索弹窗 -->
  <wd-popup
    v-model="visible"
    position="top"
    transition="fade"
    :duration="0"
    :custom-style="getTopPopupStyle()"
    :modal-style="getTopPopupModalStyle()"
    @close="visible = false"
  >
    <view class="yd-search-form-container">
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          通知单编号
        </view>
        <wd-input
          v-model="formData.code"
          placeholder="请输入通知单编号"
          clearable
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          通知单名称
        </view>
        <wd-input
          v-model="formData.name"
          placeholder="请输入通知单名称"
          clearable
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          采购订单编号
        </view>
        <wd-input
          v-model="formData.purchaseOrderCode"
          placeholder="请输入采购订单编号"
          clearable
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          供应商
        </view>
        <view class="yd-search-form-selector" @click="openVendorSelector">
          <text v-if="selectedVendorText" class="text-[#333]">
            {{ selectedVendorText }}
          </text>
          <text v-else class="text-[#999]">
            请选择供应商
          </text>
        </view>
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          到货日期
        </view>
        <wd-calendar
          v-model="arrivalDateRange"
          type="daterange"
          placeholder="请选择到货日期范围"
        />
      </view>
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

  <VendorSelector ref="vendorSelectorRef" @confirm="handleVendorConfirm" />
</template>

<script lang="ts" setup>
import type { MdVendorVO } from '@/api/mes/md/vendor'
import type { WmArrivalNoticeQueryParams } from '@/api/mes/wm/arrivalnotice'
import { computed, reactive, ref } from 'vue'
import { formatDateRange } from '@/utils/date'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import VendorSelector from '../../../md/vendor/components/vendor-selector.vue'

const emit = defineEmits<{
  search: [data: WmArrivalNoticeQueryParams]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const vendorSelectorRef = ref<InstanceType<typeof VendorSelector>>() // 供应商选择器
const selectedVendor = ref<MdVendorVO>() // 已选供应商
const arrivalDateRange = ref<[string, string]>() // 到货日期范围
const formData = reactive({
  code: '',
  name: '',
  purchaseOrderCode: '',
  vendorId: undefined as number | undefined,
}) // 搜索表单数据
const selectedVendorText = computed(() => {
  return selectedVendor.value
    ? `${selectedVendor.value.code || '-'} / ${selectedVendor.value.name || '-'}`
    : ''
})

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.code) {
    conditions.push(`编号:${formData.code}`)
  }
  if (formData.name) {
    conditions.push(`名称:${formData.name}`)
  }
  if (formData.purchaseOrderCode) {
    conditions.push(`采购订单:${formData.purchaseOrderCode}`)
  }
  if (selectedVendor.value) {
    conditions.push(`供应商:${selectedVendor.value.name || selectedVendor.value.code}`)
  }
  if (arrivalDateRange.value?.length === 2) {
    conditions.push('到货日期')
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索到货通知'
})

/** 打开供应商选择器 */
function openVendorSelector() {
  vendorSelectorRef.value?.open()
}

/** 选择供应商 */
function handleVendorConfirm(vendors: MdVendorVO[]) {
  selectedVendor.value = vendors[0]
  formData.vendorId = vendors[0]?.id
}

/** 构造搜索参数 */
function buildParams() {
  const params: WmArrivalNoticeQueryParams = {}
  if (formData.code) {
    params.code = formData.code
  }
  if (formData.name) {
    params.name = formData.name
  }
  if (formData.purchaseOrderCode) {
    params.purchaseOrderCode = formData.purchaseOrderCode
  }
  if (formData.vendorId != null) {
    params.vendorId = formData.vendorId
  }
  const range = formatDateRange(arrivalDateRange.value)
  if (range) {
    params.arrivalDate = range
  }
  return params
}

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', buildParams())
}

/** 重置字段 */
function resetFields() {
  formData.code = ''
  formData.name = ''
  formData.purchaseOrderCode = ''
  formData.vendorId = undefined
  selectedVendor.value = undefined
  arrivalDateRange.value = undefined
}

/** 重置按钮操作 */
function handleReset() {
  resetFields()
  visible.value = false
  emit('reset')
}

defineExpose({ resetFields })
</script>

<style lang="scss" scoped>
.yd-search-form-selector {
  min-height: 72rpx;
  display: flex;
  align-items: center;
  padding: 0 24rpx;
  border-radius: 8rpx;
  background: #f7f8fa;
  font-size: 28rpx;
}
</style>
