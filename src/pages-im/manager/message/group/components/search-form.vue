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
          发送人编号
        </view>
        <wd-input v-model="formData.senderId" type="number" placeholder="请输入发送人编号" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          消息内容
        </view>
        <wd-input v-model="formData.content" placeholder="请输入消息内容" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          发送时间
        </view>
        <view class="yd-search-form-date-range-container">
          <view class="flex-1" @click="visibleSendTime[0] = true">
            <view class="yd-search-form-date-range-picker">
              {{ formatDate(formData.sendTime?.[0]) || '开始日期' }}
            </view>
          </view>
          -
          <view class="flex-1" @click="visibleSendTime[1] = true">
            <view class="yd-search-form-date-range-picker">
              {{ formatDate(formData.sendTime?.[1]) || '结束日期' }}
            </view>
          </view>
        </view>
        <wd-datetime-picker-view v-if="visibleSendTime[0]" v-model="tempSendTime[0]" type="date" />
        <view v-if="visibleSendTime[0]" class="yd-search-form-date-range-actions">
          <wd-button size="small" variant="plain" @click="visibleSendTime[0] = false">
            取消
          </wd-button>
          <wd-button size="small" type="primary" @click="handleSendTime0Confirm">
            确定
          </wd-button>
        </view>
        <wd-datetime-picker-view v-if="visibleSendTime[1]" v-model="tempSendTime[1]" type="date" />
        <view v-if="visibleSendTime[1]" class="yd-search-form-date-range-actions">
          <wd-button size="small" variant="plain" @click="visibleSendTime[1] = false">
            取消
          </wd-button>
          <wd-button size="small" type="primary" @click="handleSendTime1Confirm">
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
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { formatDate, formatDateRange } from '@/utils/date'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const formData = reactive({
  groupId: undefined as string | undefined,
  senderId: undefined as string | undefined,
  content: undefined as string | undefined,
  sendTime: [undefined, undefined] as [number | undefined, number | undefined],
}) // 搜索表单数据

const visibleSendTime = ref<[boolean, boolean]>([false, false]) // 发送时间选择器状态
const tempSendTime = ref<[number, number]>([Date.now(), Date.now()]) // 发送时间临时值

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.groupId) {
    conditions.push(`群:${formData.groupId}`)
  }
  if (formData.senderId) {
    conditions.push(`发送人:${formData.senderId}`)
  }
  if (formData.content) {
    conditions.push(`内容:${formData.content}`)
  }
  if (formData.sendTime?.[0] && formData.sendTime?.[1]) {
    conditions.push(`发送时间:${formatDate(formData.sendTime[0])}~${formatDate(formData.sendTime[1])}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索群聊消息'
})

/** 确认发送时间开始日期 */
function handleSendTime0Confirm() {
  formData.sendTime = [tempSendTime.value[0], formData.sendTime?.[1]]
  visibleSendTime.value[0] = false
}

/** 确认发送时间结束日期 */
function handleSendTime1Confirm() {
  formData.sendTime = [formData.sendTime?.[0], tempSendTime.value[1]]
  visibleSendTime.value[1] = false
}

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    ...formData,
    sendTime: formatDateRange(formData.sendTime),
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.groupId = undefined
  formData.senderId = undefined
  formData.content = undefined
  formData.sendTime = [undefined, undefined]
  visible.value = false
  emit('reset')
}
</script>
