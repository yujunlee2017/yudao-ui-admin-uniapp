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
          所属频道
        </view>
        <view
          class="flex items-center justify-between rounded-12rpx bg-[#f7f8fa] p-24rpx"
          @click="channelVisible = true"
        >
          <text class="text-28rpx text-[#333]">
            {{ getWotPickerDisplay(channelColumns, formData.channelId, { valueKey: 'value', labelKey: 'label', placeholder: '全部' }) }}
          </text>
          <wd-icon name="arrow-down" size="32rpx" color="#666" />
        </view>
        <wd-picker
          v-model:visible="channelVisible"
          :model-value="formData.channelId"
          :columns="channelColumns"
          label-key="label"
          value-key="value"
          @confirm="({ value }) => formData.channelId = Number(value[0])"
        />
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
import { computed, onMounted, reactive, ref } from 'vue'
import { getSimpleChannelList } from '@/api/im/manager/channel'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { formatDate, formatDateRange } from '@/utils/date'
import { getWotPickerDisplay } from '@/utils/wot'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const channelVisible = ref(false) // 频道选择器显示状态
const channelColumns = ref<{ label: string, value: number }[]>([{ label: '全部', value: 0 }]) // 频道选项（0 表示全部）
const formData = reactive({
  channelId: 0, // 0 表示全部
  sendTime: [undefined, undefined] as [number | undefined, number | undefined],
}) // 搜索表单数据

const visibleSendTime = ref<[boolean, boolean]>([false, false]) // 发送时间选择器状态
const tempSendTime = ref<[number, number]>([Date.now(), Date.now()]) // 发送时间临时值

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.channelId) {
    conditions.push(`频道:${getWotPickerDisplay(channelColumns.value, formData.channelId, { valueKey: 'value', labelKey: 'label', placeholder: '' })}`)
  }
  if (formData.sendTime?.[0] && formData.sendTime?.[1]) {
    conditions.push(`发送时间:${formatDate(formData.sendTime[0])}~${formatDate(formData.sendTime[1])}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索频道消息'
})

/** 加载频道选项 */
async function loadChannelOptions() {
  const list = await getSimpleChannelList()
  channelColumns.value = [
    { label: '全部', value: 0 },
    ...list.map(item => ({ label: item.name, value: item.id })),
  ]
}

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
    channelId: formData.channelId || undefined,
    sendTime: formatDateRange(formData.sendTime),
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.channelId = 0
  formData.sendTime = [undefined, undefined]
  visible.value = false
  emit('reset')
}

/** 初始化 */
onMounted(() => {
  loadChannelOptions()
})
</script>
