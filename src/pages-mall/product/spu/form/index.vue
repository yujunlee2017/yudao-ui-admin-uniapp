<!-- TODO @AI：看看整体，能不能在优化下？！ -->
<!-- TODO @AI：可以手动添加规格么？ -->
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
        <view class="p-24rpx">
          <view class="mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm">
            <view class="border-b border-[#f0f0f0] px-24rpx py-18rpx text-30rpx text-[#333] font-semibold">
              基础信息
            </view>
            <wd-cell-group border>
              <wd-form-item title="商品名称" title-width="200rpx" prop="name">
                <wd-input v-model="formData.name" clearable placeholder="请输入商品名称" />
              </wd-form-item>
              <wd-form-item
                title="商品分类"
                title-width="200rpx"
                prop="categoryId"
                is-link
                :value="getOptionText(categoryOptions, formData.categoryId)"
                placeholder="请选择商品分类"
                @click="pickerVisible.category = true"
              />
              <wd-form-item
                title="商品品牌"
                title-width="200rpx"
                prop="brandId"
                is-link
                :value="getOptionText(brandOptions, formData.brandId)"
                placeholder="请选择商品品牌"
                @click="pickerVisible.brand = true"
              />
              <wd-form-item title="关键字" title-width="200rpx" prop="keyword">
                <wd-input v-model="formData.keyword" clearable placeholder="请输入关键字" />
              </wd-form-item>
              <wd-form-item title="商品简介" title-width="200rpx" prop="introduction">
                <wd-textarea v-model="formData.introduction" clearable :maxlength="500" placeholder="请输入商品简介" />
              </wd-form-item>
            </wd-cell-group>
          </view>

          <view class="mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm">
            <view class="border-b border-[#f0f0f0] px-24rpx py-18rpx text-30rpx text-[#333] font-semibold">
              图片与配送
            </view>
            <wd-cell-group border>
              <wd-form-item title="商品封面" title-width="200rpx" prop="picUrl">
                <yd-upload-img v-model="formData.picUrl" directory="mall/spu" />
              </wd-form-item>
              <wd-form-item title="轮播图" title-width="200rpx" prop="sliderPicUrls">
                <yd-upload-imgs v-model="formData.sliderPicUrls" directory="mall/spu" :limit="9" />
              </wd-form-item>
              <wd-form-item title="配送方式" title-width="200rpx" prop="deliveryTypesText">
                <wd-textarea v-model="formData.deliveryTypesText" clearable :maxlength="100" placeholder="配送方式编号，多个用逗号分隔，例如 1,2" />
              </wd-form-item>
              <wd-form-item
                title="运费模板"
                title-width="200rpx"
                is-link
                :value="getOptionText(templateOptions, formData.deliveryTemplateId)"
                placeholder="请选择运费模板"
                @click="pickerVisible.template = true"
              />
            </wd-cell-group>
          </view>

          <view class="mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm">
            <view class="border-b border-[#f0f0f0] px-24rpx py-18rpx text-30rpx text-[#333] font-semibold">
              SKU 与价格
            </view>
            <wd-cell-group border>
              <wd-form-item title="多规格" title-width="200rpx" prop="specType" center>
                <wd-radio-group v-model="formData.specType" type="button">
                  <wd-radio :value="false">
                    单规格
                  </wd-radio>
                  <wd-radio :value="true">
                    多规格
                  </wd-radio>
                </wd-radio-group>
              </wd-form-item>
              <wd-form-item title="单独分佣" title-width="200rpx" prop="subCommissionType" center>
                <wd-radio-group v-model="formData.subCommissionType" type="button">
                  <wd-radio :value="false">
                    否
                  </wd-radio>
                  <wd-radio :value="true">
                    是
                  </wd-radio>
                </wd-radio-group>
              </wd-form-item>
            </wd-cell-group>
            <view class="px-24rpx py-20rpx">
              <view class="mb-16rpx text-28rpx text-[#333] font-medium">
                SKU 规格与价格
              </view>
              <SkuEditor
                v-model="skus"
                :spec-type="formData.specType"
                :sub-commission-type="formData.subCommissionType"
              />
            </view>
          </view>

          <view class="mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm">
            <view class="border-b border-[#f0f0f0] px-24rpx py-18rpx text-30rpx text-[#333] font-semibold">
              营销与状态
            </view>
            <wd-cell-group border>
              <wd-form-item title="排序" title-width="200rpx" prop="sort">
                <wd-input-number v-model="formData.sort" :min="0" />
              </wd-form-item>
              <wd-form-item title="赠送积分" title-width="200rpx">
                <wd-input-number v-model="formData.giveIntegral" :min="0" />
              </wd-form-item>
              <wd-form-item title="虚拟销量" title-width="200rpx">
                <wd-input-number v-model="formData.virtualSalesCount" :min="0" />
              </wd-form-item>
              <wd-form-item title="商品状态" title-width="200rpx" prop="status" center>
                <wd-radio-group v-model="formData.status" type="button">
                  <wd-radio
                    v-for="item in statusOptions"
                    :key="item.value"
                    :value="item.value"
                  >
                    {{ item.label }}
                  </wd-radio>
                </wd-radio-group>
              </wd-form-item>
            </wd-cell-group>
          </view>

          <view class="mb-160rpx overflow-hidden rounded-12rpx bg-white shadow-sm">
            <view class="border-b border-[#f0f0f0] px-24rpx py-18rpx text-30rpx text-[#333] font-semibold">
              商品详情
            </view>
            <wd-cell-group border>
              <wd-form-item title="详情内容" title-width="200rpx" prop="description">
                <wd-textarea v-model="formData.description" clearable :maxlength="10000" placeholder="请输入商品详情 HTML 或文本" />
              </wd-form-item>
            </wd-cell-group>
          </view>
        </view>
      </wd-form>
    </scroll-view>

    <!-- 选择器 -->
    <wd-picker
      v-model:visible="pickerVisible.category"
      :model-value="formData.categoryId"
      :columns="categoryOptions"
      @confirm="({ value }) => formData.categoryId = Number(value[0])"
    />
    <wd-picker
      v-model:visible="pickerVisible.brand"
      :model-value="formData.brandId"
      :columns="brandOptions"
      @confirm="({ value }) => formData.brandId = Number(value[0])"
    />
    <wd-picker
      v-model:visible="pickerVisible.template"
      :model-value="formData.deliveryTemplateId"
      :columns="templateOptions"
      @confirm="({ value }) => formData.deliveryTemplateId = Number(value[0])"
    />

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
import type { ProductSku, ProductSpu } from '@/api/mall/product/spu'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { createProductSpu, getProductSpu, updateProductSpu } from '@/api/mall/product/spu'
import { getSimpleProductBrandList } from '@/api/mall/product/brand'
import { getProductCategoryList } from '@/api/mall/product/category'
import { getSimpleDeliveryExpressTemplateList } from '@/api/mall/trade/delivery/express-template'
import { currRoute, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import SkuEditor from '@/pages-mall/product/spu/components/sku-editor.vue'
import { parseMallArray } from '@/pages-mall/utils'
import { getIntDictOptions } from '@/hooks/useDict'
import { createFormSchema } from '@/utils/wot'

interface SpuFormData extends ProductSpu {
  deliveryTypesText?: string
}

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const formRef = ref<FormInstance>() // 表单组件引用
const formLoading = ref(false) // 表单提交状态
const formId = ref<number>() // 商品编号
const pickerVisible = ref({ category: false, brand: false, template: false }) // 选择器状态
const categoryOptions = ref<{ label: string, value: number }[]>([]) // 分类选项
const brandOptions = ref<{ label: string, value: number }[]>([]) // 品牌选项
const templateOptions = ref<{ label: string, value: number }[]>([]) // 运费模板选项
const statusOptions = getIntDictOptions(DICT_TYPE.PRODUCT_SPU_STATUS)
const getTitle = computed(() => `${formId.value ? '编辑' : '新增'}商品`)
const formData = ref<SpuFormData>({
  name: '',
  categoryId: undefined,
  keyword: '',
  picUrl: '',
  sliderPicUrls: [],
  introduction: '',
  deliveryTypesText: '1',
  deliveryTemplateId: undefined,
  brandId: undefined,
  specType: false,
  subCommissionType: false,
  description: '',
  sort: 0,
  giveIntegral: 0,
  virtualSalesCount: 0,
  status: 0,
})
const skus = ref<ProductSku[]>([]) // SKU 列表（金额单位元）
const formSchema = createFormSchema({
  name: [{ required: true, message: '商品名称不能为空' }],
  categoryId: [{ required: true, message: '商品分类不能为空' }],
  brandId: [{ required: true, message: '商品品牌不能为空' }],
  keyword: [{ required: true, message: '商品关键字不能为空' }],
  introduction: [{ required: true, message: '商品简介不能为空' }],
  picUrl: [{ required: true, message: '商品封面不能为空' }],
  sliderPicUrls: [{ required: true, message: '轮播图不能为空' }],
  deliveryTypesText: [{ required: true, message: '配送方式不能为空' }],
  specType: [{ required: true, message: '多规格不能为空' }],
  subCommissionType: [{ required: true, message: '单独分佣不能为空' }],
  description: [{ required: true, message: '商品详情不能为空' }],
  sort: [{ required: true, message: '排序不能为空' }],
  status: [{ required: true, message: '商品状态不能为空' }],
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mall/product/spu/index')
}

/** 获取选项文本 */
function getOptionText(options: { label: string, value: number }[], value?: number) {
  if (value === undefined || value === null) {
    return ''
  }
  return options.find(item => Number(item.value) === Number(value))?.label || String(value)
}

/** 分转元 */
function centToYuan(value: any) {
  if (value === undefined || value === null || value === '') {
    return undefined
  }
  return Number((Number(value) / 100).toFixed(2))
}

/** 元转分 */
function yuanToCent(value: any) {
  if (value === undefined || value === null || value === '') {
    return undefined
  }
  return Math.round(Number(value) * 100)
}

/** SKU 分→元 */
function toYuanSku(sku: ProductSku): ProductSku {
  return {
    ...sku,
    price: centToYuan(sku.price),
    marketPrice: centToYuan(sku.marketPrice),
    costPrice: centToYuan(sku.costPrice),
    firstBrokeragePrice: centToYuan(sku.firstBrokeragePrice),
    secondBrokeragePrice: centToYuan(sku.secondBrokeragePrice),
  }
}

/** SKU 元→分 */
function toCentSku(sku: ProductSku): ProductSku {
  return {
    ...sku,
    name: sku.name || formData.value.name, // SKU 名称取商品名称（对齐 PC，后端 @NotEmpty）
    picUrl: sku.picUrl || formData.value.picUrl || '', // SKU 图片默认取商品封面（后端 @NotNull）
    price: yuanToCent(sku.price),
    marketPrice: yuanToCent(sku.marketPrice),
    costPrice: yuanToCent(sku.costPrice),
    firstBrokeragePrice: yuanToCent(sku.firstBrokeragePrice),
    secondBrokeragePrice: yuanToCent(sku.secondBrokeragePrice),
  }
}

/** 默认单规格 SKU（元） */
function createDefaultSku(): ProductSku {
  return { price: 0, marketPrice: 0, costPrice: 0, stock: 0, barCode: '', weight: 0, volume: 0, picUrl: '', properties: [] }
}

/** 加载选项 */
async function loadOptions() {
  const [categories, brands, templates] = await Promise.all([
    getProductCategoryList({}),
    getSimpleProductBrandList(),
    getSimpleDeliveryExpressTemplateList(),
  ])
  categoryOptions.value = categories.map(item => ({ label: item.name || String(item.id), value: Number(item.id) }))
  brandOptions.value = brands.map(item => ({ label: item.name || String(item.id), value: Number(item.id) }))
  templateOptions.value = templates.map(item => ({ label: item.name || String(item.id), value: Number(item.id) }))
}

/** 加载详情 */
async function loadDetail() {
  if (!formId.value) {
    skus.value = [createDefaultSku()]
    return
  }
  const data = await getProductSpu(formId.value)
  formData.value = {
    ...data,
    sliderPicUrls: data.sliderPicUrls || [],
    deliveryTypesText: (data.deliveryTypes || []).join(','),
  }
  skus.value = (data.skus || []).map(toYuanSku)
}

/** 构造提交数据 */
function buildSubmitData(): ProductSpu {
  const data = formData.value
  return {
    ...data,
    id: formId.value,
    sliderPicUrls: data.sliderPicUrls || [],
    deliveryTypes: parseMallArray(data.deliveryTypesText || '', 'number') as number[],
    skus: skus.value.map(toCentSku),
  }
}

/** 提交表单 */
async function handleSubmit() {
  const result = await formRef.value?.validate()
  if (!result?.valid) {
    return
  }
  const data = buildSubmitData()
  if (!data.skus?.length) {
    toast.warning(formData.value.specType ? '请添加规格并生成 SKU' : '请完善 SKU 价格库存')
    return
  }
  formLoading.value = true
  try {
    if (formId.value) {
      await updateProductSpu(data)
      toast.success('修改成功')
    } else {
      await createProductSpu(data)
      toast.success('新增成功')
    }
    uni.$emit('mall:product-spu:reload')
    setTimeout(() => handleBack(), 500)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(async () => {
  const query = currRoute().query
  // #ifdef H5
  const hashQuery = new URLSearchParams(window.location.hash.split('?')[1] || '')
  formId.value = Number(hashQuery.get('id') || query.id || 0) || undefined
  // #endif
  // #ifndef H5
  formId.value = Number(query.id || 0) || undefined
  // #endif
  await loadOptions()
  await loadDetail()
})
</script>

<style lang="scss" scoped>
</style>
