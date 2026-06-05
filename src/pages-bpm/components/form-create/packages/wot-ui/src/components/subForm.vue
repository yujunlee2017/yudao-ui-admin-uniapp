<template>
  <wd-form-item :title="rule.title" :title-width="titleWidth" :prop="rule.field" layout="vertical">
    <view class="fc-sub-form">
      <view
        v-for="(item, itemIndex) in rows"
        :key="itemIndex"
        class="fc-sub-form__item"
      >
        <view class="fc-sub-form__header">
          <text class="fc-sub-form__title">{{ getItemTitle(itemIndex) }}</text>
          <wd-button
            v-if="canRemove"
            size="small"
            type="error"
            variant="plain"
            :disabled="disabled"
            @click="removeItem(itemIndex)"
          >
            删除
          </wd-button>
        </view>

        <template v-for="childRule in childRules" :key="`${itemIndex}_${childRule.__fcId}`">
          <view v-if="isLayoutTitleType(childRule)" class="fc-sub-form__layout-title">
            {{ childRule.title }}
          </view>

          <view
            v-else-if="isLayoutGapType(childRule)"
            class="fc-sub-form__layout-gap"
            :style="{ height: getLayoutGapHeight(childRule) }"
          />

          <FcAlert v-else-if="isAlertType(childRule)" :rule="getRenderRule(childRule, itemIndex)" />

          <FcTitle v-else-if="isTitleType(childRule)" :rule="getRenderRule(childRule, itemIndex)" />

          <FcHtml v-else-if="isHtmlType(childRule)" :rule="getRenderRule(childRule, itemIndex)" />

          <FcDivider v-else-if="isDividerType(childRule)" :rule="getRenderRule(childRule, itemIndex)" />

          <FcTag v-else-if="isTagType(childRule)" :rule="getRenderRule(childRule, itemIndex)" />

          <FcImage v-else-if="isImageType(childRule)" :rule="getRenderRule(childRule, itemIndex)" />

          <FcIframe
            v-else-if="isIframeType(childRule)"
            :rule="getRenderRule(childRule, itemIndex)"
            :title-width="childTitleWidth"
          />

          <FcRichText
            v-else-if="isRichTextType(childRule)"
            :model-value="getItemValue(itemIndex, childRule.field)"
            :rule="getRenderRule(childRule, itemIndex)"
            :title-width="childTitleWidth"
            :disabled="isChildDisabled(childRule)"
            @update:model-value="setItemValue(itemIndex, childRule.field, $event)"
          />

          <FcSignature
            v-else-if="isSignatureType(childRule)"
            :model-value="getItemValue(itemIndex, childRule.field)"
            :rule="getRenderRule(childRule, itemIndex)"
            :title-width="childTitleWidth"
            :disabled="isChildDisabled(childRule)"
            @update:model-value="setItemValue(itemIndex, childRule.field, $event)"
          />

          <wd-form-item
            v-else-if="isInputType(childRule)"
            :title="childRule.title"
            :title-width="childTitleWidth"
            :prop="getChildProp(itemIndex, childRule.field)"
          >
            <wd-input
              :model-value="getItemValue(itemIndex, childRule.field)"
              :type="getInputType(childRule)"
              :placeholder="getPlaceholder(childRule)"
              :disabled="isChildDisabled(childRule)"
              clearable
              v-bind="getRuleProps(childRule)"
              @update:model-value="setItemValue(itemIndex, childRule.field, $event)"
            />
          </wd-form-item>

          <wd-form-item
            v-else-if="isTextareaType(childRule)"
            :title="childRule.title"
            :title-width="childTitleWidth"
            :prop="getChildProp(itemIndex, childRule.field)"
            layout="vertical"
          >
            <wd-textarea
              :model-value="getItemValue(itemIndex, childRule.field)"
              :placeholder="getPlaceholder(childRule)"
              :disabled="isChildDisabled(childRule)"
              clearable
              v-bind="getRuleProps(childRule)"
              @update:model-value="setItemValue(itemIndex, childRule.field, $event)"
            />
          </wd-form-item>

          <wd-form-item
            v-else-if="isInputNumberType(childRule)"
            :title="childRule.title"
            :title-width="childTitleWidth"
            :prop="getChildProp(itemIndex, childRule.field)"
            center
          >
            <wd-input-number
              v-bind="getRuleProps(childRule)"
              :model-value="getInputNumberValue(itemIndex, childRule.field)"
              :min="childRule.props?.min ?? 0"
              :max="childRule.props?.max"
              :step="childRule.props?.step || 1"
              :allow-null="childRule.props?.allowNull ?? true"
              :update-on-init="childRule.props?.updateOnInit ?? false"
              :disabled="isChildDisabled(childRule)"
              @update:model-value="setItemValue(itemIndex, childRule.field, $event)"
            />
          </wd-form-item>

          <FcUserSelect
            v-else-if="isUserSelectType(childRule)"
            :model-value="getItemValue(itemIndex, childRule.field)"
            :rule="getRenderRule(childRule, itemIndex)"
            :title-width="childTitleWidth"
            :disabled="isChildDisabled(childRule)"
            @update:model-value="setItemValue(itemIndex, childRule.field, $event)"
          />

          <FcDeptSelect
            v-else-if="isDeptSelectType(childRule)"
            :model-value="getItemValue(itemIndex, childRule.field)"
            :rule="getRenderRule(childRule, itemIndex)"
            :title-width="childTitleWidth"
            :disabled="isChildDisabled(childRule)"
            @update:model-value="setItemValue(itemIndex, childRule.field, $event)"
          />

          <FcDictSelect
            v-else-if="isDictSelectType(childRule)"
            :model-value="getItemValue(itemIndex, childRule.field)"
            :rule="getRenderRule(childRule, itemIndex)"
            :title-width="childTitleWidth"
            :disabled="isChildDisabled(childRule)"
            @update:model-value="setItemValue(itemIndex, childRule.field, $event)"
          />

          <FcApiSelect
            v-else-if="isApiSelectType(childRule)"
            :model-value="getItemValue(itemIndex, childRule.field)"
            :rule="getRenderRule(childRule, itemIndex)"
            :title-width="childTitleWidth"
            :disabled="isChildDisabled(childRule)"
            @update:model-value="setItemValue(itemIndex, childRule.field, $event)"
          />

          <FcAreaSelect
            v-else-if="isAreaSelectType(childRule)"
            :model-value="getItemValue(itemIndex, childRule.field)"
            :rule="getRenderRule(childRule, itemIndex)"
            :title-width="childTitleWidth"
            :disabled="isChildDisabled(childRule)"
            @update:model-value="setItemValue(itemIndex, childRule.field, $event)"
          />

          <FcCascader
            v-else-if="isCascaderType(childRule)"
            :model-value="getItemValue(itemIndex, childRule.field)"
            :rule="getRenderRule(childRule, itemIndex)"
            :title-width="childTitleWidth"
            :disabled="isChildDisabled(childRule)"
            @update:model-value="setItemValue(itemIndex, childRule.field, $event)"
          />

          <FcCalendar
            v-else-if="isCalendarType(childRule)"
            :model-value="getItemValue(itemIndex, childRule.field)"
            :rule="getRenderRule(childRule, itemIndex)"
            :title-width="childTitleWidth"
            :disabled="isChildDisabled(childRule)"
            @update:model-value="setItemValue(itemIndex, childRule.field, $event)"
          />

          <FcTreeSelect
            v-else-if="isTreeSelectType(childRule)"
            :model-value="getItemValue(itemIndex, childRule.field)"
            :rule="getRenderRule(childRule, itemIndex)"
            :title-width="childTitleWidth"
            :disabled="isChildDisabled(childRule)"
            @update:model-value="setItemValue(itemIndex, childRule.field, $event)"
          />

          <FcSelect
            v-else-if="isSelectType(childRule)"
            :model-value="getItemValue(itemIndex, childRule.field)"
            :rule="getRenderRule(childRule, itemIndex)"
            :title-width="childTitleWidth"
            :disabled="isChildDisabled(childRule)"
            @update:model-value="setItemValue(itemIndex, childRule.field, $event)"
          />

          <FcRadio
            v-else-if="childRule.type === 'radio'"
            :model-value="getItemValue(itemIndex, childRule.field)"
            :rule="getRenderRule(childRule, itemIndex)"
            :title-width="childTitleWidth"
            :disabled="isChildDisabled(childRule)"
            @update:model-value="setItemValue(itemIndex, childRule.field, $event)"
          />

          <FcCheckbox
            v-else-if="childRule.type === 'checkbox'"
            :model-value="getItemValue(itemIndex, childRule.field)"
            :rule="getRenderRule(childRule, itemIndex)"
            :title-width="childTitleWidth"
            :disabled="isChildDisabled(childRule)"
            @update:model-value="setItemValue(itemIndex, childRule.field, $event)"
          />

          <wd-form-item
            v-else-if="childRule.type === 'switch'"
            :title="childRule.title"
            :title-width="childTitleWidth"
            :prop="getChildProp(itemIndex, childRule.field)"
            center
          >
            <wd-switch
              :model-value="getItemValue(itemIndex, childRule.field)"
              :disabled="isChildDisabled(childRule)"
              v-bind="getRuleProps(childRule)"
              @update:model-value="setItemValue(itemIndex, childRule.field, $event)"
            />
          </wd-form-item>

          <FcDatePicker
            v-else-if="isDatePickerType(childRule)"
            :model-value="getItemValue(itemIndex, childRule.field)"
            :rule="getRenderRule(childRule, itemIndex)"
            :title-width="childTitleWidth"
            :disabled="isChildDisabled(childRule)"
            @update:model-value="setItemValue(itemIndex, childRule.field, $event)"
          />

          <FcTimePicker
            v-else-if="isTimePickerType(childRule)"
            :model-value="getItemValue(itemIndex, childRule.field)"
            :rule="getRenderRule(childRule, itemIndex)"
            :title-width="childTitleWidth"
            :disabled="isChildDisabled(childRule)"
            @update:model-value="setItemValue(itemIndex, childRule.field, $event)"
          />

          <wd-form-item
            v-else-if="childRule.type === 'rate'"
            :title="childRule.title"
            :title-width="childTitleWidth"
            :prop="getChildProp(itemIndex, childRule.field)"
            center
          >
            <wd-rate
              :model-value="getItemValue(itemIndex, childRule.field)"
              :disabled="isChildDisabled(childRule)"
              v-bind="getRuleProps(childRule)"
              @update:model-value="setItemValue(itemIndex, childRule.field, $event)"
            />
          </wd-form-item>

          <wd-form-item
            v-else-if="childRule.type === 'slider'"
            :title="childRule.title"
            :title-width="childTitleWidth"
            :prop="getChildProp(itemIndex, childRule.field)"
            layout="vertical"
          >
            <wd-slider
              :model-value="getItemValue(itemIndex, childRule.field)"
              :disabled="isChildDisabled(childRule)"
              v-bind="getRuleProps(childRule)"
              @change="setItemValue(itemIndex, childRule.field, $event)"
            />
          </wd-form-item>

          <FcUploader
            v-else-if="isUploadType(childRule)"
            :model-value="getItemValue(itemIndex, childRule.field)"
            :rule="getRenderRule(childRule, itemIndex)"
            :title-width="childTitleWidth"
            :disabled="isChildDisabled(childRule)"
            @update:model-value="setItemValue(itemIndex, childRule.field, $event)"
          />

          <wd-form-item
            v-else-if="childRule.type === 'span'"
            :title="childRule.title"
            :title-width="childTitleWidth"
            :prop="getChildProp(itemIndex, childRule.field)"
          >
            <view class="fc-sub-form__text">
              {{ formatDisplayValue(getItemValue(itemIndex, childRule.field)) }}
            </view>
          </wd-form-item>

          <view v-else class="fc-sub-form__unsupported">
            暂不支持「{{ childRule.title || childRule.type }}」子字段
          </view>
        </template>
      </view>

      <wd-button
        v-if="canAdd"
        block
        plain
        type="primary"
        :disabled="disabled"
        @click="addItem"
      >
        添加{{ rule.title || '子表单' }}
      </wd-button>

      <view v-else-if="rows.length === 0" class="fc-sub-form__empty">
        暂无{{ rule.title || '子表单' }}数据
      </view>
    </view>
  </wd-form-item>
</template>

<script lang="ts" setup>
import type { FormCreateRule, NormalizedFormCreateRule } from '../../../../types/typing'
import { computed, watch } from 'vue'
import { getDefaultValueByType, isRuleHidden, normalizeRules } from '../../../core/src'
import { parseRules } from '../parsers'
import {
  getInputType,
  getPlaceholder,
  getRuleProps,
  isAlertType,
  isApiSelectType,
  isAreaSelectType,
  isCalendarType,
  isCascaderType,
  isDatePickerType,
  isDeptSelectType,
  isDictSelectType,
  isDividerType,
  isHtmlType,
  isIframeType,
  isImageType,
  isInputNumberType,
  isInputType,
  isLayoutGapType,
  isLayoutTitleType,
  isRichTextType,
  isSelectType,
  isSignatureType,
  isTagType,
  isTextareaType,
  isTimePickerType,
  isTitleType,
  isTreeSelectType,
  isUploadType,
  isUserSelectType,
} from '../core/utils'
import FcCheckbox from './checkbox.vue'
import FcCalendar from './calendar.vue'
import FcCascader from './cascader.vue'
import { FcApiSelect, FcAreaSelect, FcDeptSelect, FcDictSelect, FcUserSelect } from './custom'
import FcDatePicker from './datePicker.vue'
import { FcAlert, FcDivider, FcHtml, FcImage, FcTag, FcTitle } from './display'
import FcIframe from './iframe.vue'
import FcRadio from './radio.vue'
import FcRichText from './richText.vue'
import FcSelect from './select.vue'
import FcSignature from './signature.vue'
import FcTimePicker from './timePicker.vue'
import FcTreeSelect from './treeSelect.vue'
import FcUploader from './uploader.vue'

defineOptions({
  name: 'FcSubForm',
})

const props = defineProps<{
  disabled?: boolean
  modelValue?: any
  rule: NormalizedFormCreateRule
  titleWidth?: string | number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: any[]]
  'change': [value: any[]]
}>()

const childRules = computed(() => normalizeRules(parseRules(getSubFormRules())).filter(rule => !isRuleHidden(rule)))
const rows = computed(() => normalizeRows(props.modelValue))
const childTitleWidth = computed(() => props.rule.props?.childTitleWidth || props.rule.props?.labelWidth || props.titleWidth || '180rpx')
const min = computed(() => normalizeCount(props.rule.props?.min))
const max = computed(() => normalizeCount(props.rule.props?.max))
const expand = computed(() => normalizeCount(props.rule.props?.expand))
const canRemove = computed(() => !props.disabled && rows.value.length > min.value)
const canAdd = computed(() => !props.disabled && (!max.value || rows.value.length < max.value))

watch(
  () => [props.modelValue, childRules.value, min.value, expand.value],
  () => ensureRows(),
  { deep: true, immediate: true },
)

function getSubFormRules() {
  const rules = props.rule.props?.rule || props.rule.children
  if (Array.isArray(rules)) {
    return rules
  }
  return getTableFormRules()
}

function getTableFormRules() {
  if (!Array.isArray(props.rule.props?.columns)) {
    return []
  }
  return props.rule.props.columns.flatMap((column: Record<string, any>, index: number) => {
    const rules = Array.isArray(column.rule) ? column.rule : []
    if (!column.label) {
      return rules
    }
    return [
      {
        type: '__fcLayoutTitle',
        title: column.label,
        __fcId: `__fcLayoutTitle_${props.rule.__fcId}_${index}`,
        __originType: 'tableFormColumn',
      },
      ...rules,
    ] as FormCreateRule[]
  })
}

function ensureRows() {
  const minCount = Math.max(min.value, expand.value)
  if (rows.value.length >= minCount) {
    return
  }
  const nextRows = [...rows.value]
  while (nextRows.length < minCount) {
    nextRows.push(createDefaultRow())
  }
  emitValue(nextRows)
}

function normalizeRows(value: any): Record<string, any>[] {
  if (!Array.isArray(value)) {
    return []
  }
  return value.map(item => item && typeof item === 'object' && !Array.isArray(item) ? item : {})
}

function normalizeCount(value: any) {
  const count = Number(value)
  return Number.isFinite(count) && count > 0 ? count : 0
}

function createDefaultRow() {
  const defaultValue = props.rule.props?.defaultValue
  const row = defaultValue && typeof defaultValue === 'object' && !Array.isArray(defaultValue)
    ? { ...defaultValue }
    : {}
  childRules.value.forEach((childRule) => {
    if (!childRule.field || row[childRule.field] !== undefined) {
      return
    }
    row[childRule.field] = childRule.value !== undefined ? childRule.value : getDefaultValueByType(childRule.type)
  })
  return row
}

function getRenderRule(rule: NormalizedFormCreateRule, itemIndex: number): NormalizedFormCreateRule {
  return {
    ...rule,
    field: getChildProp(itemIndex, rule.field),
  }
}

function getChildProp(itemIndex: number, field?: string) {
  return field && props.rule.field ? `${props.rule.field}.${itemIndex}.${field}` : field
}

function getItemValue(itemIndex: number, field?: string) {
  if (!field) {
    return undefined
  }
  return rows.value[itemIndex]?.[field]
}

function getInputNumberValue(itemIndex: number, field?: string) {
  const value = getItemValue(itemIndex, field)
  return value === undefined || value === null ? '' : value
}

function setItemValue(itemIndex: number, field: string | undefined, value: any) {
  if (!field) {
    return
  }
  const nextRows = [...rows.value]
  nextRows[itemIndex] = {
    ...(nextRows[itemIndex] || {}),
    [field]: value,
  }
  emitValue(nextRows)
}

function addItem() {
  if (!canAdd.value) {
    return
  }
  emitValue([...rows.value, createDefaultRow()])
}

function removeItem(itemIndex: number) {
  if (!canRemove.value) {
    return
  }
  const nextRows = [...rows.value]
  nextRows.splice(itemIndex, 1)
  emitValue(nextRows)
}

function emitValue(value: Record<string, any>[]) {
  emit('update:modelValue', value)
  emit('change', value)
}

function isChildDisabled(rule: NormalizedFormCreateRule) {
  return !!props.disabled || !!rule.props?.disabled
}

function getItemTitle(itemIndex: number) {
  const title = props.rule.props?.title
  if (typeof title === 'string' && title.trim()) {
    return title.replace('{index}', String(itemIndex + 1))
  }
  return `${props.rule.title || '子表单'} ${itemIndex + 1}`
}

function formatDisplayValue(value: any) {
  if (Array.isArray(value)) {
    return value.join('，')
  }
  if (value === undefined || value === null || value === '') {
    return '-'
  }
  return String(value)
}

function getLayoutGapHeight(rule: NormalizedFormCreateRule) {
  const height = rule.props?.height
  if (typeof height === 'number') {
    return `${height}px`
  }
  if (typeof height === 'string' && height.trim()) {
    return height
  }
  return '24rpx'
}
</script>

<style lang="scss" scoped>
.fc-sub-form {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  width: 100%;
}

.fc-sub-form__item {
  overflow: hidden;
  background: #f8f9fb;
  border: 1rpx solid #eceff3;
  border-radius: 12rpx;
}

.fc-sub-form__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 80rpx;
  padding: 0 20rpx;
  background: #fff;
  border-bottom: 1rpx solid #eceff3;
}

.fc-sub-form__title {
  overflow: hidden;
  color: #1f2329;
  font-size: 28rpx;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fc-sub-form__layout-title {
  color: #1f2329;
  font-size: 28rpx;
  font-weight: 600;
  line-height: 40rpx;
  padding: 24rpx 24rpx 8rpx;
}

.fc-sub-form__layout-gap {
  background: transparent;
}

.fc-sub-form__text {
  color: #333;
  font-size: 28rpx;
  line-height: 1.6;
  word-break: break-all;
}

.fc-sub-form__unsupported,
.fc-sub-form__empty {
  color: #999;
  font-size: 26rpx;
  padding: 24rpx;
  text-align: center;
}
</style>
