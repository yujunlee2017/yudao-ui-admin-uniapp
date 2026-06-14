<template>
  <!-- 搜索框入口 -->
  <view @click="visible = true">
    <wd-search :placeholder="placeholder" hide-cancel disabled />
  </view>

  <!-- 搜索弹窗 -->
  <wd-popup v-model="visible" position="top" :custom-style="getTopPopupStyle()" :modal-style="getTopPopupModalStyle()" @close="visible = false">
    <view class="yd-search-form-container">
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          客户名称
        </view>
        <wd-input v-model="formData.name" placeholder="请输入客户名称" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          手机
        </view>
        <wd-input v-model="formData.mobile" placeholder="请输入手机" clearable />
      </view>
      <view
        v-for="dict in dictFilters"
        :key="dict.prop"
        class="yd-search-form-item"
      >
        <view class="yd-search-form-label">
          {{ dict.label }}
        </view>
        <view class="flex items-center justify-between rounded-12rpx bg-[#f7f8fa] p-24rpx" @click="pickerVisible[dict.prop] = true">
          <text class="text-28rpx" :class="formData[dict.prop] === -1 ? 'text-[#999]' : 'text-[#333]'">
            {{ getDictDisplay(dict.dictType, formData[dict.prop]) }}
          </text>
          <wd-icon name="arrow-down" size="32rpx" color="#666" />
        </view>
        <wd-picker
          v-model:visible="pickerVisible[dict.prop]"
          :model-value="formData[dict.prop]"
          :columns="getDictColumns(dict.dictType)"
          label-key="label"
          value-key="value"
          @confirm="({ value }) => formData[dict.prop] = value[0]"
        />
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
import { reactive, ref } from 'vue'
import { getIntDictOptions } from '@/hooks/useDict'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { getWotPickerDisplay } from '@/utils/wot'

const emit = defineEmits<{ search: [data: Record<string, any>], reset: [] }>()

const dictFilters = [
  { prop: 'source', label: '客户来源', dictType: DICT_TYPE.CRM_CUSTOMER_SOURCE },
  { prop: 'industryId', label: '客户行业', dictType: DICT_TYPE.CRM_CUSTOMER_INDUSTRY },
  { prop: 'level', label: '客户级别', dictType: DICT_TYPE.CRM_CUSTOMER_LEVEL },
] // 字典筛选项（来源/行业/级别用 picker，选项较多）

const visible = ref(false) // 搜索弹窗显示状态
const pickerVisible = reactive<Record<string, boolean>>({}) // 字典选择器显示状态
// TODO @AI：这个下面是不是要换行？name、mobile、source、industryId 这种？可以写到 agents.md 里
const formData = reactive<Record<string, any>>({ name: undefined, mobile: undefined, source: -1, industryId: -1, level: -1 }) // 搜索表单数据
const placeholder = ref('搜索客户') // 搜索框占位

/** 字典选项（含「全部」） */
// TODO @AI：这个换行，是不是也要搞下？参考下别的 search 组件；
function getDictColumns(dictType: string) {
  return [{ label: '全部', value: -1 }, ...getIntDictOptions(dictType)]
}

/** 字典当前展示文案 */
function getDictDisplay(dictType: string, value: number) {
  return getWotPickerDisplay(getDictColumns(dictType), value, { placeholder: '全部' })
}

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    name: formData.name,
    mobile: formData.mobile,
    source: formData.source === -1 ? undefined : formData.source,
    industryId: formData.industryId === -1 ? undefined : formData.industryId,
    level: formData.level === -1 ? undefined : formData.level,
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.name = undefined
  formData.mobile = undefined
  formData.source = -1
  formData.industryId = -1
  formData.level = -1
  visible.value = false
  emit('reset')
}
</script>
