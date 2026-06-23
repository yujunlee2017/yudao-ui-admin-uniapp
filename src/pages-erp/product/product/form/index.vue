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
          <wd-form-item title="名称" title-width="220rpx" prop="name">
            <wd-input v-model="formData.name" placeholder="请输入名称" clearable />
          </wd-form-item>
          <wd-form-item title="条码" title-width="220rpx" prop="barCode">
            <wd-input v-model="formData.barCode" placeholder="请输入条码" clearable />
          </wd-form-item>
          <YdTreeSelect
            v-model="formData.categoryId"
            :data="categoryTree"
            label="分类"
            prop="categoryId"
            label-width="220rpx"
            placeholder="请选择分类"
          />
          <wd-form-item title="单位" title-width="220rpx" prop="unitId" is-link placeholder="请选择单位" :value="unitDisplayValue" @click="unitPickerVisible = true" />
          <wd-picker v-model:visible="unitPickerVisible" :model-value="formData.unitId" :columns="unitOptions" label-key="name" value-key="id" @confirm="({ value }) => formData.unitId = value[0]" />
          <wd-form-item title="状态" title-width="220rpx" prop="status" center>
            <wd-switch
              v-model="formData.status"
              :active-value="CommonStatusEnum.ENABLE"
              :inactive-value="CommonStatusEnum.DISABLE"
            />
          </wd-form-item>
          <wd-form-item title="规格" title-width="220rpx" prop="standard">
            <wd-input v-model="formData.standard" placeholder="请输入规格" clearable />
          </wd-form-item>
          <wd-form-item title="保质期天数" title-width="220rpx" prop="expiryDay" center>
            <wd-input-number v-model="formData.expiryDay" :min="0" />
          </wd-form-item>
          <wd-form-item title="重量(kg)" title-width="220rpx" prop="weight" center>
            <wd-input-number v-model="formData.weight" :min="0" :precision="2" />
          </wd-form-item>
          <wd-form-item title="采购价格" title-width="220rpx" prop="purchasePrice" center>
            <wd-input-number v-model="formData.purchasePrice" :min="0" :precision="2" />
          </wd-form-item>
          <wd-form-item title="销售价格" title-width="220rpx" prop="salePrice" center>
            <wd-input-number v-model="formData.salePrice" :min="0" :precision="2" />
          </wd-form-item>
          <wd-form-item title="最低价格" title-width="220rpx" prop="minPrice" center>
            <wd-input-number v-model="formData.minPrice" :min="0" :precision="2" />
          </wd-form-item>
          <wd-form-item title="备注" title-width="220rpx" prop="remark">
            <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="500" show-word-limit clearable />
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
import type { ProductCategory } from '@/api/erp/product/category'
import type { Product } from '@/api/erp/product/product'
import type { ProductUnit } from '@/api/erp/product/unit'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { getProductCategorySimpleList } from '@/api/erp/product/category'
import { createProduct, getProduct, updateProduct } from '@/api/erp/product/product'
import { getProductUnitSimpleList } from '@/api/erp/product/unit'
import YdTreeSelect from '@/components/yudao-ui/yd-tree-select/yd-tree-select.vue'
import { navigateBackPlus } from '@/utils'
import { CommonStatusEnum } from '@/utils/constants'
import { handleTree } from '@/utils/tree'
import { createFormSchema, getWotPickerFormValue } from '@/utils/wot'

const props = defineProps<{ id?: number | any }>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const getTitle = computed(() => props.id ? '编辑产品' : '新增产品')
const formLoading = ref(false) // 表单提交状态
const formData = ref<Product>({
  id: undefined,
  name: '',
  barCode: '',
  categoryId: undefined,
  unitId: undefined,
  status: CommonStatusEnum.ENABLE,
  standard: '',
  remark: '',
  expiryDay: undefined,
  weight: undefined,
  purchasePrice: undefined,
  salePrice: undefined,
  minPrice: undefined,
}) // 表单数据
const formRef = ref<FormInstance>() // 表单组件引用
const categoryTree = ref<ProductCategory[]>([]) // 产品分类树
const unitOptions = ref<ProductUnit[]>([]) // 产品单位选项
const unitPickerVisible = ref(false) // 单位选择器状态
const unitDisplayValue = computed(() => getWotPickerFormValue(unitOptions.value, formData.value.unitId, { valueKey: 'id', labelKey: 'name' }))
const formSchema = createFormSchema({
  name: [{ required: true, message: '产品名称不能为空' }],
  barCode: [{ required: true, message: '产品条码不能为空' }],
  categoryId: [{ required: true, message: '产品分类不能为空' }],
  unitId: [{ required: true, message: '单位不能为空' }],
  status: [{ required: true, message: '产品状态不能为空' }],
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-erp/product/product/index')
}

/** 加载基础选项 */
async function loadOptions() {
  const [categoryList, unitList] = await Promise.all([
    getProductCategorySimpleList(),
    getProductUnitSimpleList(),
  ])
  categoryTree.value = handleTree(categoryList)
  unitOptions.value = unitList || []
}

/** 加载产品详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = {
    ...formData.value,
    ...await getProduct(Number(props.id)),
  }
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  formLoading.value = true
  try {
    if (props.id) {
      await updateProduct(formData.value)
      toast.success('修改成功')
    } else {
      await createProduct(formData.value)
      toast.success('新增成功')
    }
    uni.$emit('erp:product:reload')
    setTimeout(() => handleBack(), 500)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(async () => {
  await loadOptions()
  await getDetail()
})
</script>
