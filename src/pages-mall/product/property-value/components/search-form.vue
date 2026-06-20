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
          所属属性
        </view>
        <view class="w-full" @click="propertyPickerVisible = true">
          <wd-input
            :model-value="getOptionText(propertyOptions, formData.propertyId)"
            readonly
            placeholder="请选择所属属性"
          />
        </view>
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          属性值
        </view>
        <wd-input v-model="formData.name" placeholder="请输入属性值" clearable />
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

  <!-- 所属属性选择器 -->
  <wd-picker
    v-model:visible="propertyPickerVisible"
    :model-value="formData.propertyId"
    :columns="propertyOptions"
    @confirm="({ value }) => formData.propertyId = Number(value[0])"
  />
</template>

<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { getSimpleProductPropertyList } from '@/api/mall/product/property'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const propertyPickerVisible = ref(false) // 属性选择器状态
const propertyOptions = ref<{ label: string, value: number }[]>([]) // 属性选项
const formData = reactive({
  propertyId: undefined as number | undefined,
  name: undefined as string | undefined,
}) // 搜索表单数据

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.propertyId != null) {
    conditions.push(`属性:${getOptionText(propertyOptions.value, formData.propertyId)}`)
  }
  if (formData.name) {
    conditions.push(`属性值:${formData.name}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索属性值'
})

/** 获取选项文本 */
function getOptionText(options: { label: string, value: number }[], value?: number) {
  if (value == null) {
    return ''
  }
  return options.find(item => Number(item.value) === Number(value))?.label || String(value)
}

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    propertyId: formData.propertyId ?? undefined,
    name: formData.name || undefined,
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.propertyId = undefined
  formData.name = undefined
  visible.value = false
  emit('reset')
}

/** 初始化 */
onMounted(async () => {
  const list = await getSimpleProductPropertyList()
  propertyOptions.value = list.map(item => ({ label: item.name || String(item.id), value: Number(item.id) }))
})
</script>
