<template>
  <view @click="visible = true">
    <wd-search :placeholder="placeholder" hide-cancel disabled />
  </view>

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
          入库单号
        </view>
        <wd-input v-model="formData.no" placeholder="请输入入库单号" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          产品
        </view>
        <!-- TODO @Yunai：搜索业务下拉对齐 yd-search-picker，删除 ErpPicker + selectedNames 的重复样板。 -->
        <ErpPicker
          v-model="formData.productId"
          source="product"
          form-item
          placeholder="请选择产品"
          @confirm="option => selectedNames.product = option?.name || ''"
        />
      </view>
      <yd-search-date-range v-model="formData.inTime" label="入库时间" />
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          供应商
        </view>
        <ErpPicker
          v-model="formData.supplierId"
          source="supplier"
          form-item
          placeholder="请选择供应商"
          @confirm="option => selectedNames.supplier = option?.name || ''"
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
          关联订单
        </view>
        <wd-input v-model="formData.orderNo" placeholder="请输入关联订单" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          结算账户
        </view>
        <ErpPicker
          v-model="formData.accountId"
          source="account"
          form-item
          placeholder="请选择结算账户"
          @confirm="option => selectedNames.account = option?.name || ''"
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
          付款状态
        </view>
        <!-- TODO @Yunai：字典/状态筛选对齐 yd-search-picker（columns/dict-type + all-option），不要手写 wd-radio-group + -1「全部」。 -->
        <wd-radio-group v-model="formData.paymentStatus" type="button">
          <wd-radio :value="-1">
            全部
          </wd-radio>
          <wd-radio :value="0">
            未付款
          </wd-radio>
          <wd-radio :value="1">
            部分付款
          </wd-radio>
          <wd-radio :value="2">
            全部付款
          </wd-radio>
        </wd-radio-group>
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

const visible = ref(false)
const selectedNames = reactive({
  account: '',
  creator: '',
  product: '',
  supplier: '',
  warehouse: '',
})
const formData = reactive({
  no: undefined as string | undefined,
  productId: undefined as number | undefined,
  inTime: ['', ''] as [any, any],
  supplierId: undefined as number | undefined,
  warehouseId: undefined as number | undefined,
  orderNo: undefined as string | undefined,
  accountId: undefined as number | undefined,
  creator: undefined as number | undefined,
  paymentStatus: -1,
  status: -1,
  remark: undefined as string | undefined,
})

const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.no) {
    conditions.push(`单号:${formData.no}`)
  }
  if (formData.productId) {
    conditions.push(`产品:${selectedNames.product || formData.productId}`)
  }
  if (formData.inTime[0] && formData.inTime[1]) {
    conditions.push(`入库时间:${formatDate(formData.inTime[0])}~${formatDate(formData.inTime[1])}`)
  }
  if (formData.supplierId) {
    conditions.push(`供应商:${selectedNames.supplier || formData.supplierId}`)
  }
  if (formData.warehouseId) {
    conditions.push(`仓库:${selectedNames.warehouse || formData.warehouseId}`)
  }
  if (formData.status !== -1) {
    conditions.push(`状态:${getDictLabel(DICT_TYPE.ERP_AUDIT_STATUS, formData.status)}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索采购入库'
})

function handleSearch() {
  visible.value = false
  emit('search', {
    no: formData.no || undefined,
    productId: formData.productId,
    inTime: formatDateRange(formData.inTime),
    supplierId: formData.supplierId,
    warehouseId: formData.warehouseId,
    orderNo: formData.orderNo || undefined,
    accountId: formData.accountId,
    creator: formData.creator,
    paymentStatus: formData.paymentStatus === -1 ? undefined : formData.paymentStatus,
    status: formData.status === -1 ? undefined : formData.status,
    remark: formData.remark || undefined,
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.no = undefined
  formData.productId = undefined
  formData.inTime = ['', '']
  formData.supplierId = undefined
  formData.warehouseId = undefined
  formData.orderNo = undefined
  formData.accountId = undefined
  formData.creator = undefined
  selectedNames.product = ''
  selectedNames.supplier = ''
  selectedNames.warehouse = ''
  selectedNames.account = ''
  selectedNames.creator = ''
  formData.paymentStatus = -1
  formData.status = -1
  formData.remark = undefined
  visible.value = false
  emit('reset')
}
</script>
