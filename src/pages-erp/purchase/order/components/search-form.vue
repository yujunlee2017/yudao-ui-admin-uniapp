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
          订单单号
        </view>
        <wd-input v-model="formData.no" placeholder="请输入订单单号" clearable />
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
      <yd-search-date-range v-model="formData.orderTime" label="订单时间" />
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
          状态
        </view>
        <!-- TODO @Yunai：字典/状态筛选对齐 yd-search-picker（columns/dict-type + all-option），不要手写 wd-radio-group + -1「全部」。 -->
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
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          入库数量
        </view>
        <wd-radio-group v-model="formData.inStatus" type="button">
          <wd-radio :value="-1">
            全部
          </wd-radio>
          <wd-radio :value="0">
            未入库
          </wd-radio>
          <wd-radio :value="1">
            部分入库
          </wd-radio>
          <wd-radio :value="2">
            全部入库
          </wd-radio>
        </wd-radio-group>
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          退货数量
        </view>
        <wd-radio-group v-model="formData.returnStatus" type="button">
          <wd-radio :value="-1">
            全部
          </wd-radio>
          <wd-radio :value="0">
            未退货
          </wd-radio>
          <wd-radio :value="1">
            部分退货
          </wd-radio>
          <wd-radio :value="2">
            全部退货
          </wd-radio>
        </wd-radio-group>
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
  creator: '',
  product: '',
  supplier: '',
})
const formData = reactive({
  no: undefined as string | undefined,
  productId: undefined as number | undefined,
  orderTime: ['', ''] as [any, any],
  supplierId: undefined as number | undefined,
  creator: undefined as number | undefined,
  status: -1,
  remark: undefined as string | undefined,
  inStatus: -1,
  returnStatus: -1,
})

const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.no) {
    conditions.push(`单号:${formData.no}`)
  }
  if (formData.productId) {
    conditions.push(`产品:${selectedNames.product || formData.productId}`)
  }
  if (formData.orderTime[0] && formData.orderTime[1]) {
    conditions.push(`订单时间:${formatDate(formData.orderTime[0])}~${formatDate(formData.orderTime[1])}`)
  }
  if (formData.supplierId) {
    conditions.push(`供应商:${selectedNames.supplier || formData.supplierId}`)
  }
  if (formData.status !== -1) {
    conditions.push(`状态:${getDictLabel(DICT_TYPE.ERP_AUDIT_STATUS, formData.status)}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索采购订单'
})

function handleSearch() {
  visible.value = false
  emit('search', {
    no: formData.no || undefined,
    productId: formData.productId,
    orderTime: formatDateRange(formData.orderTime),
    supplierId: formData.supplierId,
    creator: formData.creator,
    status: formData.status === -1 ? undefined : formData.status,
    remark: formData.remark || undefined,
    inStatus: formData.inStatus === -1 ? undefined : formData.inStatus,
    returnStatus: formData.returnStatus === -1 ? undefined : formData.returnStatus,
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.no = undefined
  formData.productId = undefined
  formData.orderTime = ['', '']
  formData.supplierId = undefined
  formData.creator = undefined
  selectedNames.product = ''
  selectedNames.supplier = ''
  selectedNames.creator = ''
  formData.status = -1
  formData.remark = undefined
  formData.inStatus = -1
  formData.returnStatus = -1
  visible.value = false
  emit('reset')
}
</script>
