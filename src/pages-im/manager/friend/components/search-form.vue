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
      <!-- TODO @AI：userselect 组件 -->
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          用户编号
        </view>
        <wd-input v-model="formData.userId" type="number" placeholder="请输入用户编号" clearable />
      </view>
      <!-- TODO @AI：userselect 组件 -->
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          好友编号
        </view>
        <wd-input v-model="formData.friendUserId" type="number" placeholder="请输入好友编号" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          状态
        </view>
        <wd-radio-group v-model="formData.status" type="button">
          <wd-radio :value="-1">
            全部
          </wd-radio>
          <wd-radio
            v-for="dict in getIntDictOptions(DICT_TYPE.IM_FRIEND_STATUS)"
            :key="dict.value"
            :value="dict.value"
          >
            {{ dict.label }}
          </wd-radio>
        </wd-radio-group>
      </view>
      <!-- TODO @AI：免打扰筛选 -->
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          添加时间
        </view>
        <view class="yd-search-form-date-range-container">
          <view class="flex-1" @click="visibleAddTime[0] = true">
            <view class="yd-search-form-date-range-picker">
              {{ formatDate(formData.addTime?.[0]) || '开始日期' }}
            </view>
          </view>
          -
          <view class="flex-1" @click="visibleAddTime[1] = true">
            <view class="yd-search-form-date-range-picker">
              {{ formatDate(formData.addTime?.[1]) || '结束日期' }}
            </view>
          </view>
        </view>
        <wd-datetime-picker-view v-if="visibleAddTime[0]" v-model="tempAddTime[0]" type="date" />
        <view v-if="visibleAddTime[0]" class="yd-search-form-date-range-actions">
          <wd-button size="small" variant="plain" @click="visibleAddTime[0] = false">
            取消
          </wd-button>
          <wd-button size="small" type="primary" @click="handleAddTime0Confirm">
            确定
          </wd-button>
        </view>
        <wd-datetime-picker-view v-if="visibleAddTime[1]" v-model="tempAddTime[1]" type="date" />
        <view v-if="visibleAddTime[1]" class="yd-search-form-date-range-actions">
          <wd-button size="small" variant="plain" @click="visibleAddTime[1] = false">
            取消
          </wd-button>
          <wd-button size="small" type="primary" @click="handleAddTime1Confirm">
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
  userId: undefined as string | undefined,
  friendUserId: undefined as string | undefined,
  status: -1, // -1 表示全部
  addTime: [undefined, undefined] as [number | undefined, number | undefined],
}) // 搜索表单数据

const visibleAddTime = ref<[boolean, boolean]>([false, false]) // 添加时间选择器状态
const tempAddTime = ref<[number, number]>([Date.now(), Date.now()]) // 添加时间临时值

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.userId) {
    conditions.push(`用户:${formData.userId}`)
  }
  if (formData.friendUserId) {
    conditions.push(`好友:${formData.friendUserId}`)
  }
  if (formData.status !== -1) {
    conditions.push(`状态:${getDictLabel(DICT_TYPE.IM_FRIEND_STATUS, formData.status)}`)
  }
  if (formData.addTime?.[0] && formData.addTime?.[1]) {
    conditions.push(`添加时间:${formatDate(formData.addTime[0])}~${formatDate(formData.addTime[1])}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索好友关系'
})

/** 确认添加时间开始日期 */
function handleAddTime0Confirm() {
  formData.addTime = [tempAddTime.value[0], formData.addTime?.[1]]
  visibleAddTime.value[0] = false
}

/** 确认添加时间结束日期 */
function handleAddTime1Confirm() {
  formData.addTime = [formData.addTime?.[0], tempAddTime.value[1]]
  visibleAddTime.value[1] = false
}

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    ...formData,
    status: formData.status === -1 ? undefined : formData.status,
    addTime: formatDateRange(formData.addTime),
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.userId = undefined
  formData.friendUserId = undefined
  formData.status = -1
  formData.addTime = [undefined, undefined]
  visible.value = false
  emit('reset')
}
</script>
