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
          出库单号
        </view>
        <wd-input v-model="formData.no" placeholder="请输入出库单号" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          产品
        </view>
        <ErpPicker
          v-model="formData.productId"
          source="product"
          form-item
          placeholder="请选择产品"
          @confirm="option => selectedNames.product = option?.name || ''"
        />
      </view>
      <yd-search-date-range v-model="formData.outTime" label="出库时间" />
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          客户
        </view>
        <ErpPicker
          v-model="formData.customerId"
          source="customer"
          form-item
          placeholder="请选择客户"
          @confirm="option => selectedNames.customer = option?.name || ''"
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          仓库
        </view>
        <ErpPicker
          v-model="formData.warehouseId"
          source="warehouse"
          form-item
          placeholder="请选择仓库"
          @confirm="option => selectedNames.warehouse = option?.name || ''"
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          创建人
        </view>
        <ErpPicker
          v-model="formData.creator"
          source="user"
          form-item
          placeholder="请选择创建人"
          @confirm="option => selectedNames.creator = option?.name || ''"
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          审核状态
        </view>
        <wd-radio-group v-model="formData.status" type="button">
          <wd-radio :value="-1">
            全部
          </wd-radio>
          <wd-radio v-for="dict in getIntDictOptions(DICT_TYPE.ERP_AUDIT_STATUS)" :key="dict.value" :value="dict.value">
            {{ dict.label }}
          </wd-radio>
        </wd-radio-group>
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          备注
        </view>
        <wd-input v-model="formData.remark" placeholder="请输入备注" clearable />
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
</template>

<script lang="ts" setup>
import { computed, reactive, ref } from 'vue'
import { getDictLabel, getIntDictOptions } from '@/hooks/useDict'
import ErpPicker from '@/pages-erp/components/erp-picker.vue'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate, formatDateRange } from '@/utils/date'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const selectedNames = reactive({
  creator: '',
  customer: '',
  product: '',
  warehouse: '',
}) // 选择器展示名称
const formData = reactive({
  no: undefined as string | undefined,
  productId: undefined as number | undefined,
  outTime: ['', ''] as [any, any],
  customerId: undefined as number | undefined,
  warehouseId: undefined as number | undefined,
  creator: undefined as number | undefined,
  status: -1,
  remark: undefined as string | undefined,
}) // 搜索表单数据

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.no) {
    conditions.push(`单号:${formData.no}`)
  }
  if (formData.productId) {
    conditions.push(`产品:${selectedNames.product || formData.productId}`)
  }
  if (formData.outTime[0] && formData.outTime[1]) {
    conditions.push(`出库时间:${formatDate(formData.outTime[0])}~${formatDate(formData.outTime[1])}`)
  }
  if (formData.customerId) {
    conditions.push(`客户:${selectedNames.customer || formData.customerId}`)
  }
  if (formData.warehouseId) {
    conditions.push(`仓库:${selectedNames.warehouse || formData.warehouseId}`)
  }
  if (formData.status !== -1) {
    conditions.push(`状态:${getDictLabel(DICT_TYPE.ERP_AUDIT_STATUS, formData.status)}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索其它出库'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    no: formData.no || undefined,
    productId: formData.productId,
    outTime: formatDateRange(formData.outTime),
    customerId: formData.customerId,
    warehouseId: formData.warehouseId,
    creator: formData.creator,
    status: formData.status === -1 ? undefined : formData.status,
    remark: formData.remark || undefined,
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.no = undefined
  formData.productId = undefined
  formData.outTime = ['', '']
  formData.customerId = undefined
  formData.warehouseId = undefined
  formData.creator = undefined
  selectedNames.product = ''
  selectedNames.customer = ''
  selectedNames.warehouse = ''
  selectedNames.creator = ''
  formData.status = -1
  formData.remark = undefined
  visible.value = false
  emit('reset')
}
</script>
