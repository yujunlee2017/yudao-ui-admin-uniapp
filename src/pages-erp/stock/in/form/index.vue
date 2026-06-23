<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar :title="getTitle" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 表单区域 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-cell title="入库单号" :value="formData.no || '保存时自动生成'" />
          <wd-form-item title="入库时间" title-width="220rpx" prop="inTime" is-link :value="formatDate(formData.inTime) || ''" placeholder="请选择入库时间" @click="dateVisible.inTime = true" />
          <wd-datetime-picker v-model="formData.inTime" v-model:visible="dateVisible.inTime" title="请选择入库时间" type="date" />
          <wd-form-item title="供应商" title-width="220rpx" is-link :value="supplierDisplayValue" placeholder="请选择供应商" @click="pickerVisible.supplier = true" />
          <wd-picker v-model:visible="pickerVisible.supplier" :model-value="formData.supplierId" :columns="supplierOptions" label-key="name" value-key="id" @confirm="({ value }) => formData.supplierId = value[0]" />
          <wd-form-item title="备注" title-width="220rpx" prop="remark">
            <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="500" show-word-limit clearable />
          </wd-form-item>
          <wd-form-item title="附件" title-width="220rpx" prop="fileUrl">
            <yd-upload-file v-model="formData.fileUrl" :limit="1" />
          </wd-form-item>
        </wd-cell-group>

        <!-- 入库明细 -->
        <view class="px-24rpx py-16rpx text-28rpx text-[#666]">
          入库产品清单
        </view>
        <wd-cell-group border>
          <wd-form-item title="入库明细" title-width="220rpx">
            <InItemEditor ref="itemEditorRef" v-model="formData.items" :product-options="productOptions" :warehouse-options="warehouseOptions" />
          </wd-form-item>
        </wd-cell-group>

        <!-- 合计信息 -->
        <view class="px-24rpx py-16rpx text-28rpx text-[#666]">
          合计信息
        </view>
        <wd-cell-group border>
          <wd-cell title="合计数量" :value="formatCount(formData.totalCount)" />
          <wd-cell title="合计金额" :value="formatMoney(formData.totalPrice)" />
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
import type { Product } from '@/api/erp/product/product'
import type { Supplier } from '@/api/erp/purchase/supplier'
import type { StockIn } from '@/api/erp/stock/in'
import type { Warehouse } from '@/api/erp/stock/warehouse'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { getProductSimpleList } from '@/api/erp/product/product'
import { getSupplierSimpleList } from '@/api/erp/purchase/supplier'
import { createStockIn, getStockIn, updateStockIn } from '@/api/erp/stock/in'
import { getWarehouseSimpleList } from '@/api/erp/stock/warehouse'
import { navigateBackPlus } from '@/utils'
import { formatDate } from '@/utils/date'
import { createFormSchema, getWotPickerFormValue } from '@/utils/wot'
import InItemEditor from '../components/in-item-editor.vue'
import { formatCount, formatMoney, roundPrice, toNumber } from '@/pages-erp/utils'

const props = defineProps<{ id?: number | any }>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const getTitle = computed(() => props.id ? '编辑其它入库' : '新增其它入库')
const formLoading = ref(false) // 表单提交状态
const formData = ref<StockIn>({
  id: undefined,
  no: undefined,
  supplierId: undefined,
  inTime: Date.now(),
  remark: undefined,
  fileUrl: '',
  totalCount: 0,
  totalPrice: 0,
  items: [],
}) // 表单数据
const formRef = ref<FormInstance>() // 表单组件引用
const itemEditorRef = ref<InstanceType<typeof InItemEditor>>() // 明细组件引用
const supplierOptions = ref<Supplier[]>([]) // 供应商选项
const productOptions = ref<Product[]>([]) // 产品选项
const warehouseOptions = ref<Warehouse[]>([]) // 仓库选项
const pickerVisible = reactive({
  supplier: false,
}) // 选择器状态
const dateVisible = reactive({
  inTime: false,
}) // 日期选择器状态
const formSchema = createFormSchema({
  supplierId: [{ required: true, message: '供应商不能为空' }],
  inTime: [{ required: true, message: '入库时间不能为空' }],
})
const supplierDisplayValue = computed(() => getWotPickerFormValue(supplierOptions.value, formData.value.supplierId, { valueKey: 'id', labelKey: 'name' }))

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-erp/stock/in/index')
}

/** 刷新入库金额 */
function refreshAmount() {
  const items = Array.isArray(formData.value.items) ? formData.value.items : []
  const totalCount = items.reduce((sum, item) => sum + toNumber(item.count), 0)
  const totalPrice = items.reduce((sum, item) => sum + toNumber(item.totalPrice), 0)
  formData.value.totalCount = Number(totalCount.toFixed(3))
  formData.value.totalPrice = roundPrice(totalPrice)
}

/** 加载基础选项 */
async function loadOptions() {
  const [suppliers, products, warehouses] = await Promise.all([
    getSupplierSimpleList(),
    getProductSimpleList(),
    getWarehouseSimpleList(),
  ])
  supplierOptions.value = suppliers || []
  productOptions.value = products || []
  warehouseOptions.value = warehouses || []
}

/** 加载其它入库详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = {
    ...formData.value,
    ...await getStockIn(Number(props.id)),
  }
  refreshAmount()
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid || !itemEditorRef.value?.validate()) {
    return
  }
  refreshAmount()
  formLoading.value = true
  try {
    if (props.id) {
      await updateStockIn(formData.value)
      toast.success('修改成功')
    } else {
      await createStockIn(formData.value)
      toast.success('新增成功')
    }
    uni.$emit('erp:stock-in:reload')
    setTimeout(() => handleBack(), 500)
  } finally {
    formLoading.value = false
  }
}

watch(() => formData.value.items, refreshAmount, { deep: true })

/** 初始化 */
onMounted(async () => {
  await loadOptions()
  await getDetail()
})
</script>
