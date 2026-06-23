<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar :title="getTitle" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 表单区域 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-cell title="订单单号" :value="formData.no || '保存时自动生成'" />
          <wd-form-item title="订单时间" title-width="220rpx" prop="orderTime" is-link :value="formatDate(formData.orderTime) || ''" placeholder="请选择订单时间" @click="dateVisible.orderTime = true" />
          <wd-datetime-picker v-model="formData.orderTime" v-model:visible="dateVisible.orderTime" title="请选择订单时间" type="date" />
          <wd-form-item title="供应商" title-width="220rpx" prop="supplierId" is-link :value="supplierDisplayValue" placeholder="请选择供应商" @click="pickerVisible.supplier = true" />
          <wd-picker v-model:visible="pickerVisible.supplier" :model-value="formData.supplierId" :columns="supplierOptions" label-key="name" value-key="id" @confirm="({ value }) => formData.supplierId = value[0]" />
          <wd-form-item title="备注" title-width="220rpx" prop="remark">
            <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="500" show-word-limit clearable />
          </wd-form-item>
          <wd-form-item title="附件" title-width="220rpx" prop="fileUrl">
            <yd-upload-file v-model="formData.fileUrl" :limit="1" />
          </wd-form-item>
        </wd-cell-group>

        <view class="px-24rpx py-16rpx text-28rpx text-[#666]">
          订单产品清单
        </view>
        <wd-cell-group border>
          <wd-form-item title="采购明细" title-width="220rpx">
            <OrderItemEditor ref="itemEditorRef" v-model="formData.items" :product-options="productOptions" />
          </wd-form-item>
        </wd-cell-group>

        <view class="px-24rpx py-16rpx text-28rpx text-[#666]">
          结算信息
        </view>
        <wd-cell-group border>
          <wd-form-item title="优惠率(%)" title-width="220rpx" prop="discountPercent" center>
            <wd-input-number v-model="formData.discountPercent" :min="0" :precision="2" />
          </wd-form-item>
          <wd-cell title="付款优惠" :value="formatMoney(formData.discountPrice)" />
          <wd-cell title="优惠后金额" :value="formatMoney(formData.totalPrice)" />
          <wd-form-item title="结算账户" title-width="220rpx" is-link :value="accountDisplayValue" placeholder="请选择结算账户" @click="pickerVisible.account = true" />
          <wd-picker v-model:visible="pickerVisible.account" :model-value="formData.accountId" :columns="accountOptions" label-key="name" value-key="id" @confirm="({ value }) => formData.accountId = value[0]" />
          <wd-form-item title="支付订金" title-width="220rpx" prop="depositPrice" center>
            <wd-input-number v-model="formData.depositPrice" :min="0" :precision="2" />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>

      <view class="h-160rpx" />
    </scroll-view>

    <!-- 底部保存按钮 -->
    <view class="yd-detail-footer">
      <wd-button type="primary" block :loading="formLoading" @click="handleSubmit">
        保存
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { Account } from '@/api/erp/finance/account'
import type { Product } from '@/api/erp/product/product'
import type { PurchaseOrder } from '@/api/erp/purchase/order'
import type { Supplier } from '@/api/erp/purchase/supplier'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { getAccountSimpleList } from '@/api/erp/finance/account'
import { getProductSimpleList } from '@/api/erp/product/product'
import { createPurchaseOrder, getPurchaseOrder, updatePurchaseOrder } from '@/api/erp/purchase/order'
import { getSupplierSimpleList } from '@/api/erp/purchase/supplier'
import { navigateBackPlus } from '@/utils'
import { formatDate } from '@/utils/date'
import { createFormSchema, getWotPickerFormValue } from '@/utils/wot'
import OrderItemEditor from '../components/order-item-editor.vue'
import { formatMoney, roundPrice, toNumber } from '@/pages-erp/utils'

const props = defineProps<{ id?: number | any }>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const getTitle = computed(() => props.id ? '编辑采购订单' : '新增采购订单')
const formLoading = ref(false)
const formData = ref<PurchaseOrder>({
  id: undefined,
  no: undefined,
  supplierId: undefined,
  accountId: undefined,
  orderTime: Date.now(),
  remark: undefined,
  fileUrl: '',
  discountPercent: 0,
  discountPrice: 0,
  totalPrice: 0,
  depositPrice: 0,
  items: [],
})
const formRef = ref<FormInstance>()
const itemEditorRef = ref<InstanceType<typeof OrderItemEditor>>()
const supplierOptions = ref<Supplier[]>([])
const accountOptions = ref<Account[]>([])
const productOptions = ref<Product[]>([])
const pickerVisible = reactive({
  account: false,
  supplier: false,
})
const dateVisible = reactive({
  orderTime: false,
})
const formSchema = createFormSchema({
  supplierId: [{ required: true, message: '供应商不能为空' }],
  orderTime: [{ required: true, message: '订单时间不能为空' }],
})
const supplierDisplayValue = computed(() => getWotPickerFormValue(supplierOptions.value, formData.value.supplierId, { valueKey: 'id', labelKey: 'name' }))
const accountDisplayValue = computed(() => getWotPickerFormValue(accountOptions.value, formData.value.accountId, { valueKey: 'id', labelKey: 'name' }))

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-erp/purchase/order/index')
}

function refreshOrderAmount() {
  const items = Array.isArray(formData.value.items) ? formData.value.items : []
  const totalCount = items.reduce((sum, item) => sum + toNumber(item.count), 0)
  const totalPrice = items.reduce((sum, item) => sum + toNumber(item.totalPrice), 0)
  const discountPrice = roundPrice(totalPrice * toNumber(formData.value.discountPercent) / 100)
  formData.value.totalCount = Number(totalCount.toFixed(3))
  formData.value.discountPrice = discountPrice
  formData.value.totalPrice = roundPrice(totalPrice - discountPrice)
}

async function loadOptions() {
  const [suppliers, accounts, products] = await Promise.all([
    getSupplierSimpleList(),
    getAccountSimpleList(),
    getProductSimpleList(),
  ])
  supplierOptions.value = suppliers || []
  accountOptions.value = accounts || []
  productOptions.value = products || []
  const defaultAccount = accountOptions.value.find(item => item.defaultStatus)
  if (!formData.value.accountId && defaultAccount?.id) {
    formData.value.accountId = defaultAccount.id
  }
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = {
    ...formData.value,
    ...await getPurchaseOrder(Number(props.id)),
  }
  refreshOrderAmount()
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid || !itemEditorRef.value?.validate()) {
    return
  }
  refreshOrderAmount()
  formLoading.value = true
  try {
    if (props.id) {
      await updatePurchaseOrder(formData.value)
      toast.success('修改成功')
    } else {
      await createPurchaseOrder(formData.value)
      toast.success('新增成功')
    }
    uni.$emit('erp:purchase-order:reload')
    setTimeout(() => handleBack(), 500)
  } finally {
    formLoading.value = false
  }
}

watch(() => [formData.value.items, formData.value.discountPercent], refreshOrderAmount, { deep: true })

onMounted(async () => {
  await loadOptions()
  await getDetail()
})
</script>
