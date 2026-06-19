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
          群编号
        </view>
        <wd-input v-model="formData.groupId" type="number" placeholder="请输入群编号" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          申请人编号
        </view>
        <wd-input v-model="formData.userId" type="number" placeholder="请输入申请人编号" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          处理结果
        </view>
        <wd-radio-group v-model="formData.handleResult" type="button">
          <wd-radio :value="-1">
            全部
          </wd-radio>
          <wd-radio
            v-for="dict in getIntDictOptions(DICT_TYPE.IM_GROUP_REQUEST_HANDLE_RESULT)"
            :key="dict.value"
            :value="dict.value"
          >
            {{ dict.label }}
          </wd-radio>
        </wd-radio-group>
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          申请时间
        </view>
        <view class="yd-search-form-date-range-container">
          <view class="flex-1" @click="visibleCreateTime[0] = true">
            <view class="yd-search-form-date-range-picker">
              {{ formatDate(formData.createTime?.[0]) || '开始日期' }}
            </view>
          </view>
          -
          <view class="flex-1" @click="visibleCreateTime[1] = true">
            <view class="yd-search-form-date-range-picker">
              {{ formatDate(formData.createTime?.[1]) || '结束日期' }}
            </view>
          </view>
        </view>
        <wd-datetime-picker-view v-if="visibleCreateTime[0]" v-model="tempCreateTime[0]" type="date" />
        <view v-if="visibleCreateTime[0]" class="yd-search-form-date-range-actions">
          <wd-button size="small" variant="plain" @click="visibleCreateTime[0] = false">
            取消
          </wd-button>
          <wd-button size="small" type="primary" @click="handleCreateTime0Confirm">
            确定
          </wd-button>
        </view>
        <wd-datetime-picker-view v-if="visibleCreateTime[1]" v-model="tempCreateTime[1]" type="date" />
        <view v-if="visibleCreateTime[1]" class="yd-search-form-date-range-actions">
          <wd-button size="small" variant="plain" @click="visibleCreateTime[1] = false">
            取消
          </wd-button>
          <wd-button size="small" type="primary" @click="handleCreateTime1Confirm">
            确定
          </wd-button>
        </view>
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
import { getDictLabel, getIntDictOptions } from '@/hooks/useDict'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate, formatDateRange } from '@/utils/date'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const formData = reactive({
  groupId: undefined as string | undefined,
  userId: undefined as string | undefined,
  handleResult: -1, // -1 表示全部
  createTime: [undefined, undefined] as [number | undefined, number | undefined],
}) // 搜索表单数据

const visibleCreateTime = ref<[boolean, boolean]>([false, false]) // 申请时间选择器状态
const tempCreateTime = ref<[number, number]>([Date.now(), Date.now()]) // 申请时间临时值

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.groupId) {
    conditions.push(`群:${formData.groupId}`)
  }
  if (formData.userId) {
    conditions.push(`申请人:${formData.userId}`)
  }
  if (formData.handleResult !== -1) {
    conditions.push(`结果:${getDictLabel(DICT_TYPE.IM_GROUP_REQUEST_HANDLE_RESULT, formData.handleResult)}`)
  }
  if (formData.createTime?.[0] && formData.createTime?.[1]) {
    conditions.push(`申请时间:${formatDate(formData.createTime[0])}~${formatDate(formData.createTime[1])}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索加群申请'
})

/** 确认申请时间开始日期 */
function handleCreateTime0Confirm() {
  formData.createTime = [tempCreateTime.value[0], formData.createTime?.[1]]
  visibleCreateTime.value[0] = false
}

/** 确认申请时间结束日期 */
function handleCreateTime1Confirm() {
  formData.createTime = [formData.createTime?.[0], tempCreateTime.value[1]]
  visibleCreateTime.value[1] = false
}

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    ...formData,
    handleResult: formData.handleResult === -1 ? undefined : formData.handleResult,
    createTime: formatDateRange(formData.createTime),
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.groupId = undefined
  formData.userId = undefined
  formData.handleResult = -1
  formData.createTime = [undefined, undefined]
  visible.value = false
  emit('reset')
}
</script>
