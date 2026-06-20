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
          用户昵称
        </view>
        <wd-input v-model="formData.nickname" placeholder="请输入用户昵称" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          推广资格
        </view>
        <wd-radio-group v-model="formData.brokerageEnabled" type="button">
          <wd-radio :value="-1">
            全部
          </wd-radio>
          <wd-radio :value="true">
            有资格
          </wd-radio>
          <wd-radio :value="false">
            无资格
          </wd-radio>
        </wd-radio-group>
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
  nickname: undefined as string | undefined,
  brokerageEnabled: -1 as boolean | number,
}) // 搜索表单数据

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.nickname) {
    conditions.push(`昵称:${formData.nickname}`)
  }
  if (formData.brokerageEnabled !== -1) {
    conditions.push(`资格:${formData.brokerageEnabled ? '有' : '无'}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索分销用户'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    nickname: formData.nickname || undefined,
    brokerageEnabled: formData.brokerageEnabled === -1 ? undefined : formData.brokerageEnabled,
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.nickname = undefined
  formData.brokerageEnabled = -1
  visible.value = false
  emit('reset')
}
</script>
