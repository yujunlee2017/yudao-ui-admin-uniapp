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
        <wd-input v-model="formData.userNickname" placeholder="请输入用户昵称" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          商品名称
        </view>
        <wd-input v-model="formData.spuName" placeholder="请输入商品名称" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          是否显示
        </view>
        <wd-radio-group v-model="formData.visible" type="button">
          <wd-radio :value="-1">
            全部
          </wd-radio>
          <wd-radio :value="1">
            显示
          </wd-radio>
          <wd-radio :value="0">
            隐藏
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
  userNickname: undefined as string | undefined,
  spuName: undefined as string | undefined,
  visible: -1, // -1=全部 1=显示 0=隐藏
}) // 搜索表单数据

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.userNickname) {
    conditions.push(`昵称:${formData.userNickname}`)
  }
  if (formData.spuName) {
    conditions.push(`商品:${formData.spuName}`)
  }
  if (formData.visible !== -1) {
    conditions.push(`显示:${formData.visible === 1 ? '显示' : '隐藏'}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索评论'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    userNickname: formData.userNickname || undefined,
    spuName: formData.spuName || undefined,
    visible: formData.visible === -1 ? undefined : formData.visible === 1,
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.userNickname = undefined
  formData.spuName = undefined
  formData.visible = -1
  visible.value = false
  emit('reset')
}
</script>
