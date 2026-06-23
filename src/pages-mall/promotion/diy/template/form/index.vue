<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      :title="getTitle"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 表单区域 -->
    <scroll-view class="min-h-0 flex-1" scroll-y>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="模板名称" title-width="200rpx" prop="name">
            <wd-input v-model="formData.name" clearable placeholder="请输入模板名称" />
          </wd-form-item>
          <wd-form-item title="预览图 URL" title-width="200rpx" prop="previewPicUrlsText">
            <wd-textarea
              v-model="formData.previewPicUrlsText"
              clearable
              :maxlength="2000"
              placeholder="多个 URL 用逗号或换行分隔"
            />
          </wd-form-item>
          <wd-form-item title="备注" title-width="200rpx" prop="remark">
            <wd-textarea v-model="formData.remark" clearable :maxlength="500" placeholder="请输入备注" />
          </wd-form-item>
          <wd-form-item v-if="isEdit" title="装修属性" title-width="200rpx" prop="propertyText">
            <wd-textarea
              v-model="formData.propertyText"
              clearable
              :maxlength="20000"
              placeholder="请输入装修属性 JSON"
            />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>

      <!-- 装修属性说明 -->
      <view class="px-24rpx py-18rpx text-24rpx text-[#999]">
        移动端仅维护模板基础信息与 JSON 装修属性，可视化拖拽装修请前往 PC 端。
      </view>

      <!-- 预览图预览 -->
      <view v-if="previewUrls.length" class="flex flex-wrap gap-12rpx px-24rpx pb-24rpx">
        <image
          v-for="url in previewUrls"
          :key="url"
          :src="url"
          class="h-120rpx w-120rpx rounded-8rpx bg-[#eee]"
          mode="aspectFill"
        />
      </view>
    </scroll-view>

    <!-- 底部保存按钮 -->
    <view class="yd-detail-footer">
      <wd-button
        type="primary"
        block
        :loading="formLoading"
        @click="handleSubmit"
      >
        保存
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import {
  createPromotionDiyTemplate,
  getPromotionDiyTemplate,
  getPromotionDiyTemplateProperty,
  updatePromotionDiyTemplate,
  updatePromotionDiyTemplateProperty,
} from '@/api/mall/promotion/diy/template'
import { navigateBackPlus } from '@/utils'
import { createFormSchema } from '@/utils/wot'

interface DiyTemplateFormData {
  id?: number
  name?: string
  remark?: string
  previewPicUrlsText?: string
  propertyText?: string
}

const props = defineProps<{
  id?: number | any
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const isEdit = computed(() => !!props.id)
const getTitle = computed(() => props.id ? '编辑装修模板' : '新增装修模板')
const formLoading = ref(false) // 表单提交状态
const formData = ref<DiyTemplateFormData>({
  id: undefined,
  name: '',
  remark: '',
  previewPicUrlsText: '',
  propertyText: '{}',
}) // 表单数据
const previewUrls = computed(() => parseUrls(formData.value.previewPicUrlsText || ''))
const formSchema = createFormSchema({
  name: [{ required: true, message: '模板名称不能为空' }],
  // 装修属性仅编辑时显示，需为合法 JSON
  propertyText: [{ validator: validateProperty }],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 校验装修属性 JSON */
function validateProperty(value: string) {
  if (!isEdit.value || !value?.trim()) {
    return Promise.resolve()
  }
  try {
    JSON.parse(value)
    return Promise.resolve()
  } catch {
    return Promise.reject(new Error('装修属性需为合法 JSON'))
  }
}

/** 解析多 URL 文本为数组 */
function parseUrls(text: string) {
  return text
    .split(/[,，\n]/)
    .map(item => item.trim())
    .filter(Boolean)
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mall/promotion/diy/template/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  const detail = await getPromotionDiyTemplate(Number(props.id))
  const property = await getPromotionDiyTemplateProperty(Number(props.id))
  formData.value = {
    id: Number(props.id),
    name: detail.name,
    remark: detail.remark,
    previewPicUrlsText: (detail.previewPicUrls || []).join('\n'),
    propertyText: formatProperty(property.property ?? detail.property),
  }
}

/** 格式化装修属性为文本 */
function formatProperty(value: any) {
  if (value == null || value === '') {
    return '{}'
  }
  if (typeof value === 'string') {
    return value
  }
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return '{}'
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
    const baseData = {
      id: formData.value.id,
      name: formData.value.name,
      remark: formData.value.remark,
      previewPicUrls: previewUrls.value,
    }
    if (props.id) {
      await updatePromotionDiyTemplate(baseData)
      // 装修属性走独立接口更新
      await updatePromotionDiyTemplateProperty({
        id: formData.value.id,
        property: formData.value.propertyText?.trim() || '{}',
      })
      toast.success('修改成功')
    } else {
      await createPromotionDiyTemplate(baseData)
      toast.success('新增成功')
    }
    uni.$emit('mall:promotion-diy-template:reload')
    setTimeout(() => {
      handleBack()
    }, 500)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
})
</script>

<style lang="scss" scoped>
</style>
