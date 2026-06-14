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
          商机名称
        </view>
        <wd-input v-model="formData.name" placeholder="请输入商机名称" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          客户名称
        </view>
        <CrmPicker
          v-model="formData.customerId"
          source="customer"
          placeholder="请选择客户名称"
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
import CrmPicker from '@/pages-crm/components/crm-picker.vue'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'

const emit = defineEmits<{ search: [data: Record<string, any>], reset: [] }>()

const visible = ref(false) // 搜索弹窗显示状态
const formData = reactive<Record<string, any>>({
  name: undefined,
  customerId: undefined,
}) // 搜索表单数据
const placeholder = ref('搜索商机') // 搜索框占位

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    name: formData.name,
    customerId: formData.customerId,
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.name = undefined
  formData.customerId = undefined
  visible.value = false
  emit('reset')
}
</script>
