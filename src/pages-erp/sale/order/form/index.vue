<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      :title="getTitle"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 表单区域 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-cell title="订单单号" :value="formData.no || '保存时自动生成'" />
          <wd-form-item
            title="订单时间"
            title-width="220rpx"
            prop="orderTime"
            is-link
            :value="formatDate(formData.orderTime) || ''"
            placeholder="请选择订单时间"
            @click="dateVisible.orderTime = true"
          />
          <wd-datetime-picker
            v-model="formData.orderTime"
            v-model:visible="dateVisible.orderTime"
            title="请选择订单时间"
            type="date"
          />
          <wd-form-item
            title="客户"
            title-width="220rpx"
            prop="customerId"
            is-link
            :value="customerDisplayValue"
            placeholder="请选择客户"
            @click="pickerVisible.customer = true"
          />
          <wd-picker
            v-model:visible="pickerVisible.customer"
            :model-value="formData.customerId"
            :columns="customerOptions"
            label-key="name"
            value-key="id"
            @confirm="({ value }) => formData.customerId = value[0]"
          />
          <wd-form-item
            title="销售人员"
            title-width="220rpx"
            is-link
            :value="saleUserDisplayValue"
            placeholder="请选择销售人员"
            @click="pickerVisible.saleUser = true"
          />
          <wd-picker
            v-model:visible="pickerVisible.saleUser"
            :model-value="formData.saleUserId"
            :columns="userOptions"
            label-key="name"
            value-key="id"
            @confirm="({ value }) => formData.saleUserId = value[0]"
          />
          <wd-form-item title="备注" title-width="220rpx" prop="remark">
            <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="500" show-word-limit clearable />
          </wd-form-item>
          <wd-form-item title="附件" title-width="220rpx" prop="fileUrl">
            <yd-upload-file v-model="formData.fileUrl" :limit="1" />
          </wd-form-item>
        </wd-cell-group>

        <!-- 产品明细 -->
        <view class="px-24rpx py-16rpx text-28rpx text-[#666]">
          订单产品清单
        </view>
        <wd-cell-group border>
          <wd-form-item title="产品明细" title-width="220rpx">
            <OrderItemEditor
              ref="itemEditorRef"
              v-model="formData.items"
              :product-options="productOptions"
            />
          </wd-form-item>
        </wd-cell-group>

        <!-- 结算信息 -->
        <view class="px-24rpx py-16rpx text-28rpx text-[#666]">
          结算信息
        </view>
        <wd-cell-group border>
          <wd-form-item title="优惠率(%)" title-width="220rpx" prop="discountPercent" center>
            <wd-input-number v-model="formData.discountPercent" :min="0" :precision="2" />
          </wd-form-item>
          <wd-cell title="收款优惠" :value="formatMoney(formData.discountPrice)" />
          <wd-cell title="优惠后金额" :value="formatMoney(formData.totalPrice)" />
          <wd-form-item
            title="结算账户"
            title-width="220rpx"
            is-link
            :value="accountDisplayValue"
            placeholder="请选择结算账户"
            @click="pickerVisible.account = true"
          />
          <wd-picker
            v-model:visible="pickerVisible.account"
            :model-value="formData.accountId"
            :columns="accountOptions"
            label-key="name"
            value-key="id"
            @confirm="({ value }) => formData.accountId = value[0]"
          />
          <wd-form-item title="收取订金" title-width="220rpx" prop="depositPrice" center>
            <wd-input-number v-model="formData.depositPrice" :min="0" :precision="2" />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>

      <!-- 底部安全区域 -->
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
import type { Customer } from '@/api/erp/sale/customer'
import type { SaleOrder } from '@/api/erp/sale/order'
import type { User } from '@/api/system/user'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { getAccountSimpleList } from '@/api/erp/finance/account'
import { getProductSimpleList } from '@/api/erp/product/product'
import { getCustomerSimpleList } from '@/api/erp/sale/customer'
import { createSaleOrder, getSaleOrder, updateSaleOrder } from '@/api/erp/sale/order'
import { getSimpleUserList } from '@/api/system/user'
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
const getTitle = computed(() => props.id ? '编辑销售订单' : '新增销售订单')
const formLoading = ref(false) // 表单提交状态
const formData = ref<SaleOrder>({
  id: undefined,
  no: undefined,
  customerId: undefined,
  accountId: undefined,
  saleUserId: undefined,
  orderTime: Date.now(),
  remark: undefined,
  fileUrl: '',
  discountPercent: 0,
  discountPrice: 0,
  totalPrice: 0,
  depositPrice: 0,
  items: [],
}) // 表单数据
const formRef = ref<FormInstance>() // 表单组件引用
const itemEditorRef = ref<InstanceType<typeof OrderItemEditor>>() // 明细组件引用
const customerOptions = ref<Customer[]>([]) // 客户选项
const accountOptions = ref<Account[]>([]) // 账户选项
const productOptions = ref<Product[]>([]) // 产品选项
const userOptions = ref<Array<User & { name: string }>>([]) // 用户选项
const pickerVisible = reactive({
  account: false,
  customer: false,
  saleUser: false,
}) // 选择器状态
const dateVisible = reactive({
  orderTime: false,
}) // 日期选择器状态
const formSchema = createFormSchema({
  customerId: [{ required: true, message: '客户不能为空' }],
  orderTime: [{ required: true, message: '订单时间不能为空' }],
})
const customerDisplayValue = computed(() => getWotPickerFormValue(customerOptions.value, formData.value.customerId, { valueKey: 'id', labelKey: 'name' }))
const saleUserDisplayValue = computed(() => getWotPickerFormValue(userOptions.value, formData.value.saleUserId, { valueKey: 'id', labelKey: 'name' }))
const accountDisplayValue = computed(() => getWotPickerFormValue(accountOptions.value, formData.value.accountId, { valueKey: 'id', labelKey: 'name' }))

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-erp/sale/order/index')
}

/** 刷新订单金额 */
function refreshOrderAmount() {
  const items = Array.isArray(formData.value.items) ? formData.value.items : []
  const totalCount = items.reduce((sum, item) => sum + toNumber(item.count), 0)
  const totalPrice = items.reduce((sum, item) => sum + toNumber(item.totalPrice), 0)
  const discountPrice = roundPrice(totalPrice * toNumber(formData.value.discountPercent) / 100)
  formData.value.totalCount = Number(totalCount.toFixed(3))
  formData.value.discountPrice = discountPrice
  formData.value.totalPrice = roundPrice(totalPrice - discountPrice)
}

/** 加载基础选项 */
async function loadOptions() {
  const [customers, accounts, products, users] = await Promise.all([
    getCustomerSimpleList(),
    getAccountSimpleList(),
    getProductSimpleList(),
    getSimpleUserList(),
  ])
  customerOptions.value = customers || []
  accountOptions.value = accounts || []
  productOptions.value = products || []
  userOptions.value = (users || []).map(item => ({ ...item, name: item.nickname || item.username }))
  const defaultAccount = accountOptions.value.find(item => item.defaultStatus)
  if (!formData.value.accountId && defaultAccount?.id) {
    formData.value.accountId = defaultAccount.id
  }
}

/** 加载销售订单详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = {
    ...formData.value,
    ...await getSaleOrder(Number(props.id)),
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
      await updateSaleOrder(formData.value)
      toast.success('修改成功')
    } else {
      await createSaleOrder(formData.value)
      toast.success('新增成功')
    }
    uni.$emit('erp:sale-order:reload')
    setTimeout(() => handleBack(), 500)
  } finally {
    formLoading.value = false
  }
}

watch(() => [formData.value.items, formData.value.discountPercent], refreshOrderAmount, { deep: true })

/** 初始化 */
onMounted(async () => {
  await loadOptions()
  await getDetail()
})
</script>
