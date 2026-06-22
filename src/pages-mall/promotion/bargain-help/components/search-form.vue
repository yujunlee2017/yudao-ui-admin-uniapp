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
          砍价记录编号
        </view>
        <wd-input v-model="formData.recordId" type="number" placeholder="请输入砍价记录编号" clearable />
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
import { computed, reactive, ref } from 'vue'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const formData = reactive({
  recordId: undefined as string | undefined,
}) // 搜索表单数据（后端 BargainHelpPageReqVO 仅支持 recordId）

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  if (formData.recordId) {
    return `记录:${formData.recordId}`
  }
  return '搜索砍价助力'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    recordId: formData.recordId ? Number(formData.recordId) : undefined,
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.recordId = undefined
  visible.value = false
  emit('reset')
}
</script>
