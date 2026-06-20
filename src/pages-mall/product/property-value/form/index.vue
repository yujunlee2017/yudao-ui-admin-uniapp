<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      :title="getTitle"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 表单区域 -->
    <view>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item
            title="所属属性"
            title-width="220rpx"
            prop="propertyId"
            is-link
            :value="getOptionText(propertyOptions, formData.propertyId)"
            placeholder="请选择所属属性"
            @click="pickerVisible = true"
          />
          <wd-form-item title="属性值" title-width="220rpx" prop="name">
            <wd-input v-model="formData.name" clearable placeholder="请输入属性值" />
          </wd-form-item>
          <wd-form-item title="备注" title-width="220rpx" prop="remark">
            <wd-textarea v-model="formData.remark" clearable :maxlength="500" placeholder="请输入备注" />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
    </view>

    <!-- 所属属性选择器 -->
    <wd-picker
      v-model:visible="pickerVisible"
      :model-value="formData.propertyId"
      :columns="propertyOptions"
      @confirm="({ value }) => formData.propertyId = Number(value[0])"
    />

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
import type { ProductPropertyValue } from '@/api/mall/product/property'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import {
  createProductPropertyValue,
  getProductPropertyValue,
  getSimpleProductPropertyList,
  updateProductPropertyValue,
} from '@/api/mall/product/property'
import { navigateBackPlus } from '@/utils'
import { createFormSchema } from '@/utils/wot'

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
const getTitle = computed(() => props.id ? '编辑属性值' : '新增属性值')
const formLoading = ref(false) // 表单提交状态
const pickerVisible = ref(false) // 所属属性选择器状态
const propertyOptions = ref<{ label: string, value: number }[]>([]) // 属性选项
const formData = ref<ProductPropertyValue>({
  id: undefined,
  propertyId: undefined,
  name: '',
  remark: '',
}) // 表单数据
const formSchema = createFormSchema({
  propertyId: [{ required: true, message: '所属属性不能为空' }],
  name: [{ required: true, message: '属性值不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mall/product/property-value/index')
}

/** 获取选项文本 */
function getOptionText(options: { label: string, value: number }[], value?: number) {
  if (value == null) {
    return ''
  }
  return options.find(item => Number(item.value) === Number(value))?.label || String(value)
}

/** 加载属性选项 */
async function loadOptions() {
  const list = await getSimpleProductPropertyList()
  propertyOptions.value = list.map(item => ({ label: item.name || String(item.id), value: Number(item.id) }))
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getProductPropertyValue(Number(props.id))
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }

  formLoading.value = true
  try {
    const data = { ...formData.value }
    if (props.id) {
      await updateProductPropertyValue(data)
      toast.success('修改成功')
    } else {
      await createProductPropertyValue(data)
      toast.success('新增成功')
    }
    uni.$emit('mall:product-property-value:reload')
    setTimeout(() => {
      handleBack()
    }, 500)
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
