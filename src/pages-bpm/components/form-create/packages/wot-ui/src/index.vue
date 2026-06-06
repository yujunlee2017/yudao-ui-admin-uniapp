<template>
  <view class="fc-wot">
    <wd-form
      ref="formRef"
      :model="formData"
      :schema="formSchema"
      :border="formOption.form?.border"
      :error-type="formOption.form?.errorType || 'toast'"
      :layout="formOption.form?.layout"
      :title-width="titleWidth"
      :value-align="formOption.form?.valueAlign"
    >
      <wd-cell-group :border="formOption.form?.border !== false">
        <template v-for="rule in visibleRules" :key="rule.__fcId">
          <view v-if="isHiddenFieldType(rule)" style="display: none" />

          <view v-else-if="isLayoutTitleType(rule)" class="fc-wot__layout-title">
            {{ rule.title }}
          </view>

          <view
            v-else-if="isLayoutGapType(rule)"
            class="fc-wot__layout-gap"
            :style="{ height: getLayoutGapHeight(rule) }"
          />

          <FcAlert
            v-else-if="isAlertType(rule)"
            :rule="rule"
          />

          <FcTitle
            v-else-if="isTitleType(rule)"
            :rule="rule"
          />

          <FcHtml
            v-else-if="isHtmlType(rule)"
            :rule="rule"
          />

          <FcDivider
            v-else-if="isDividerType(rule)"
            :rule="rule"
          />

          <FcTag
            v-else-if="isTagType(rule)"
            :rule="rule"
          />

          <FcImage
            v-else-if="isImageType(rule)"
            :rule="rule"
          />

          <FcIframe
            v-else-if="isIframeType(rule)"
            :rule="rule"
            :title-width="titleWidth"
          />

          <FcRichText
            v-else-if="isRichTextType(rule)"
            :model-value="getValue(rule)"
            :rule="rule"
            :title-width="titleWidth"
            :disabled="isDisabled(rule)"
            @update:model-value="handleUpdate(rule, $event)"
          />

          <FcSignature
            v-else-if="isSignatureType(rule)"
            :model-value="getValue(rule)"
            :rule="rule"
            :title-width="titleWidth"
            :disabled="isDisabled(rule)"
            @update:model-value="handleUpdate(rule, $event)"
          />

          <FcButton
            v-else-if="isButtonType(rule)"
            :rule="rule"
            :disabled="isDisabled(rule)"
          />

          <wd-form-item
            v-else-if="isInputType(rule)"
            :title="rule.title"
            :title-width="titleWidth"
            :prop="rule.field"
          >
            <wd-input
              :model-value="getValue(rule)"
              :type="getInputType(rule)"
              :placeholder="getPlaceholder(rule)"
              :disabled="isDisabled(rule)"
              clearable
              v-bind="getRuleProps(rule)"
              @update:model-value="handleUpdate(rule, $event)"
            />
          </wd-form-item>

          <wd-form-item
            v-else-if="isTextareaType(rule)"
            :title="rule.title"
            :title-width="titleWidth"
            :prop="rule.field"
            layout="vertical"
          >
            <wd-textarea
              :model-value="getValue(rule)"
              :placeholder="getPlaceholder(rule)"
              :disabled="isDisabled(rule)"
              clearable
              v-bind="getRuleProps(rule)"
              @update:model-value="handleUpdate(rule, $event)"
            />
          </wd-form-item>

          <wd-form-item
            v-else-if="isInputNumberType(rule)"
            :title="rule.title"
            :title-width="titleWidth"
            :prop="rule.field"
            center
          >
            <wd-input-number
              v-bind="getRuleProps(rule)"
              :model-value="getInputNumberValue(rule)"
              :min="rule.props?.min"
              :max="rule.props?.max"
              :step="rule.props?.step || 1"
              :allow-null="rule.props?.allowNull ?? true"
              :update-on-init="rule.props?.updateOnInit ?? false"
              :disabled="isDisabled(rule)"
              @update:model-value="handleUpdate(rule, $event)"
            />
          </wd-form-item>

          <FcUserSelect
            v-else-if="isUserSelectType(rule)"
            :model-value="getValue(rule)"
            :rule="rule"
            :title-width="titleWidth"
            :disabled="isDisabled(rule)"
            @update:model-value="handleUpdate(rule, $event)"
          />

          <FcDeptSelect
            v-else-if="isDeptSelectType(rule)"
            :model-value="getValue(rule)"
            :rule="rule"
            :title-width="titleWidth"
            :disabled="isDisabled(rule)"
            @update:model-value="handleUpdate(rule, $event)"
          />

          <FcDictSelect
            v-else-if="isDictSelectType(rule)"
            :model-value="getValue(rule)"
            :rule="rule"
            :title-width="titleWidth"
            :disabled="isDisabled(rule)"
            @update:model-value="handleUpdate(rule, $event)"
          />

          <FcApiSelect
            v-else-if="isApiSelectType(rule)"
            :model-value="getValue(rule)"
            :rule="rule"
            :title-width="titleWidth"
            :disabled="isDisabled(rule)"
            @update:model-value="handleUpdate(rule, $event)"
          />

          <FcAreaSelect
            v-else-if="isAreaSelectType(rule)"
            :model-value="getValue(rule)"
            :rule="rule"
            :title-width="titleWidth"
            :disabled="isDisabled(rule)"
            @update:model-value="handleUpdate(rule, $event)"
          />

          <FcCascader
            v-else-if="isCascaderType(rule)"
            :model-value="getValue(rule)"
            :rule="rule"
            :title-width="titleWidth"
            :disabled="isDisabled(rule)"
            @update:model-value="handleUpdate(rule, $event)"
          />

          <FcCalendar
            v-else-if="isCalendarType(rule)"
            :model-value="getValue(rule)"
            :rule="rule"
            :title-width="titleWidth"
            :disabled="isDisabled(rule)"
            @update:model-value="handleUpdate(rule, $event)"
          />

          <FcTreeSelect
            v-else-if="isTreeSelectType(rule)"
            :model-value="getValue(rule)"
            :rule="rule"
            :title-width="titleWidth"
            :disabled="isDisabled(rule)"
            @update:model-value="handleUpdate(rule, $event)"
          />

          <FcTransfer
            v-else-if="isTransferType(rule)"
            :model-value="getValue(rule)"
            :rule="rule"
            :title-width="titleWidth"
            :disabled="isDisabled(rule)"
            @update:model-value="handleUpdate(rule, $event)"
          />

          <FcSelect
            v-else-if="isSelectType(rule)"
            :model-value="getValue(rule)"
            :rule="rule"
            :title-width="titleWidth"
            :disabled="isDisabled(rule)"
            @update:model-value="handleUpdate(rule, $event)"
          />

          <FcColorPicker
            v-else-if="isColorPickerType(rule)"
            :model-value="getValue(rule)"
            :rule="rule"
            :title-width="titleWidth"
            :disabled="isDisabled(rule)"
            @update:model-value="handleUpdate(rule, $event)"
          />

          <FcRadio
            v-else-if="rule.type === 'radio'"
            :model-value="getValue(rule)"
            :rule="rule"
            :title-width="titleWidth"
            :disabled="isDisabled(rule)"
            @update:model-value="handleUpdate(rule, $event)"
          />

          <FcCheckbox
            v-else-if="rule.type === 'checkbox'"
            :model-value="getValue(rule)"
            :rule="rule"
            :title-width="titleWidth"
            :disabled="isDisabled(rule)"
            @update:model-value="handleUpdate(rule, $event)"
          />

          <wd-form-item
            v-else-if="rule.type === 'switch'"
            :title="rule.title"
            :title-width="titleWidth"
            :prop="rule.field"
            center
          >
            <wd-switch
              :model-value="getValue(rule)"
              :disabled="isDisabled(rule)"
              v-bind="getRuleProps(rule)"
              @update:model-value="handleUpdate(rule, $event)"
            />
          </wd-form-item>

          <FcDatePicker
            v-else-if="isDatePickerType(rule)"
            :model-value="getValue(rule)"
            :rule="rule"
            :title-width="titleWidth"
            :disabled="isDisabled(rule)"
            @update:model-value="handleUpdate(rule, $event)"
          />

          <FcTimePicker
            v-else-if="isTimePickerType(rule)"
            :model-value="getValue(rule)"
            :rule="rule"
            :title-width="titleWidth"
            :disabled="isDisabled(rule)"
            @update:model-value="handleUpdate(rule, $event)"
          />

          <wd-form-item
            v-else-if="rule.type === 'rate'"
            :title="rule.title"
            :title-width="titleWidth"
            :prop="rule.field"
            center
          >
            <wd-rate
              :model-value="getValue(rule)"
              :disabled="isDisabled(rule)"
              v-bind="getRuleProps(rule)"
              @update:model-value="handleUpdate(rule, $event)"
            />
          </wd-form-item>

          <wd-form-item
            v-else-if="isSliderType(rule)"
            :title="rule.title"
            :title-width="titleWidth"
            :prop="rule.field"
            layout="vertical"
          >
            <wd-slider
              :model-value="getValue(rule)"
              :disabled="isDisabled(rule)"
              v-bind="getRuleProps(rule)"
              :range="isSliderRangeType(rule)"
              @change="handleUpdate(rule, $event)"
            />
          </wd-form-item>

          <FcUploader
            v-else-if="isUploadType(rule)"
            :model-value="getValue(rule)"
            :rule="rule"
            :title-width="titleWidth"
            :disabled="isDisabled(rule)"
            @update:model-value="handleUpdate(rule, $event)"
          />

          <FcSubForm
            v-else-if="isSubFormType(rule)"
            :model-value="getValue(rule)"
            :rule="rule"
            :api="api"
            :option="formOption"
            :title-width="titleWidth"
            :disabled="isDisabled(rule)"
            @update:model-value="handleUpdate(rule, $event)"
          />

          <wd-form-item
            v-else-if="rule.type === 'span'"
            :title="rule.title"
            :title-width="titleWidth"
            :prop="rule.field"
          >
            <view class="fc-wot__text">
              {{ formatDisplayValue(getValue(rule)) }}
            </view>
          </wd-form-item>

          <wd-form-item
            v-else
            :title="rule.title || rule.type"
            :title-width="titleWidth"
            :prop="rule.field"
            layout="vertical"
          >
            <view class="fc-wot__unsupported">
              暂不支持「{{ rule.title || rule.type }}」组件
            </view>
          </wd-form-item>
        </template>

        <view v-if="visibleRules.length === 0" class="fc-wot__empty">
          暂无表单字段
        </view>
      </wd-cell-group>
    </wd-form>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type {
  FormCreateApi,
  FormCreateFieldState,
  FormCreateOption,
  FormCreateRule,
  NormalizedFormCreateRule,
} from '../../../types/typing'
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import {
  applyControlRules,
  applyRuleProviders,
  createApi,
  createFormSchema,
  createInitialFormData,
  getDefaultValue,
  isRuleDisabled,
  isRuleHidden,
  normalizeRules,
  resolveRuleFetchEffects,
} from '../../core/src'
import type { FormCreateProviderContext, FormCreateProviderState } from '../../core/src/provider'
import { deepMerge, hasOwn } from '../../utils/src'
import {
  FcAlert,
  FcApiSelect,
  FcAreaSelect,
  FcButton,
  FcCalendar,
  FcCascader,
  FcCheckbox,
  FcColorPicker,
  FcDatePicker,
  FcDeptSelect,
  FcDictSelect,
  FcDivider,
  FcHtml,
  FcIframe,
  FcImage,
  FcRadio,
  FcRichText,
  FcSelect,
  FcSignature,
  FcSubForm,
  FcTag,
  FcTimePicker,
  FcTitle,
  FcTransfer,
  FcTreeSelect,
  FcUploader,
  FcUserSelect,
} from './components'
import getConfig from './core/config'
import {
  getInputType,
  getPlaceholder,
  getRuleProps,
  getTitleWidth,
  isAlertType,
  isApiSelectType,
  isAreaSelectType,
  isButtonType,
  isCalendarType,
  isCascaderType,
  isColorPickerType,
  isDatePickerType,
  isDeptSelectType,
  isDictSelectType,
  isDividerType,
  isHiddenFieldType,
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
  isSliderRangeType,
  isSliderType,
  isSubFormType,
  isTagType,
  isTextareaType,
  isTimePickerType,
  isTitleType,
  isTransferType,
  isTreeSelectType,
  isUploadType,
  isUserSelectType,
} from './core/utils'
import { parseRules } from './parsers'

const props = withDefaults(defineProps<{
  api?: FormCreateApi
  disabled?: boolean
  modelValue?: Record<string, any>
  option?: FormCreateOption
  preview?: boolean
  readonly?: boolean
  rule?: FormCreateRule[]
}>(), {
  disabled: false,
  modelValue: () => ({}),
  option: () => ({}),
  preview: false,
  readonly: false,
  rule: () => [],
})

const emit = defineEmits<{
  'update:api': [api: FormCreateApi]
  'update:modelValue': [data: Record<string, any>]
  'change': [data: Record<string, any>, field?: string, value?: any]
  'mounted': [api: FormCreateApi]
}>()

const formRef = ref<FormInstance>()
const formData = ref<Record<string, any>>({})
const initialFormValues = ref<Record<string, any>>({})
const fieldStates = reactive<Record<string, FormCreateFieldState>>({})
const providerStates = reactive<Record<string, FormCreateProviderState>>({})
const apiRulePatches = reactive<Record<string, Partial<NormalizedFormCreateRule>>>({})
let api: FormCreateApi

const formOption = computed(() => getConfig(props.option))
const globalDisabled = computed(() => props.disabled || props.readonly || props.preview)
const titleWidth = computed(() => getTitleWidth(formOption.value))
const parsedRules = computed(() => parseRules(props.rule))
const baseRules = computed(() => normalizeRules(parsedRules.value))
const patchedBaseRules = computed(() => applyApiRulePatches(baseRules.value))
const controlResult = computed(() => applyControlRules(patchedBaseRules.value, formData.value))
const providerSourceRules = computed(() => applyApiRulePatches(controlResult.value.rules))
const providerContext: FormCreateProviderContext = {
  get api() {
    return api
  },
  get formData() {
    return formData.value
  },
  get option() {
    return formOption.value
  },
  states: providerStates,
}
const rules = computed(() => applyRuleProviders(providerSourceRules.value, providerContext))
const visibleRules = computed(() => rules.value.filter(rule => !isRuleHidden(rule, fieldStates[rule.field || ''])))
const formSchema = computed(() => createFormSchema(() => rules.value, fieldStates, parseRules, providerContext))

function getValue(rule: NormalizedFormCreateRule) {
  return rule.field ? formData.value[rule.field] : undefined
}

function getInputNumberValue(rule: NormalizedFormCreateRule) {
  const value = getValue(rule)
  return value === undefined || value === null ? '' : value
}

function handleUpdate(rule: NormalizedFormCreateRule, value: any) {
  if (!rule.field) {
    return
  }
  formData.value[rule.field] = value
  emitChange(rule.field, value)
}

function emitChange(field?: string, value?: any) {
  const data = { ...formData.value }
  emit('update:modelValue', data)
  emit('change', data, field, value)
}

function isDisabled(rule: NormalizedFormCreateRule) {
  return isRuleDisabled(globalDisabled.value || !!rule.props?.disabled, fieldStates[rule.field || ''], rule)
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

function applyApiRulePatches(nextRules: NormalizedFormCreateRule[]) {
  return nextRules.map((rule) => {
    const patch = apiRulePatches[rule.__fcId]
    return patch ? deepMerge<NormalizedFormCreateRule>(rule, patch) : rule
  })
}

api = createApi({
  disabled: globalDisabled,
  emitChange: () => emitChange(),
  fieldStates,
  formData,
  formRef,
  initialFormData: initialFormValues,
  option: formOption,
  refresh: () => scheduleProviderFetchEffects(),
  rulePatches: apiRulePatches,
  rules,
})

let providerFetchVersion = 0
let providerFetchTimer: ReturnType<typeof setTimeout> | undefined

watch(
  () => [props.modelValue, props.option?.formData, props.rule],
  () => {
    const initialValues = deepMerge<Record<string, any>>(formOption.value.formData || {}, props.modelValue || {})
    initialFormValues.value = initialValues
    formData.value = createInitialFormData(baseRules.value, initialValues)
  },
  { deep: true, immediate: true },
)

watch(
  rules,
  (nextRules) => {
    nextRules.forEach((rule) => {
      if (rule.field && !fieldStates[rule.field]) {
        fieldStates[rule.field] = {}
      }
      if (rule.field && !hasOwn(formData.value, rule.field)) {
        formData.value[rule.field] = hasOwn(initialFormValues.value, rule.field)
          ? initialFormValues.value[rule.field]
          : rule.value !== undefined ? rule.value : getDefaultValue(rule)
      }
    })
  },
  { immediate: true },
)

watch(
  () => controlResult.value.fieldStates,
  (nextStates) => {
    const fields = new Set([
      ...Object.keys(fieldStates),
      ...Object.keys(nextStates),
    ])
    fields.forEach((field) => {
      if (!fieldStates[field]) {
        fieldStates[field] = {}
      }
      fieldStates[field].controlHidden = nextStates[field]?.controlHidden
      fieldStates[field].controlDisabled = nextStates[field]?.controlDisabled
      fieldStates[field].controlRequired = nextStates[field]?.controlRequired
    })
  },
  { deep: true, immediate: true },
)

watch(
  () => [controlResult.value.rules, formData.value, formOption.value.globalData],
  () => {
    scheduleProviderFetchEffects()
  },
  { deep: true, immediate: true },
)

function scheduleProviderFetchEffects() {
  if (providerFetchTimer) {
    clearTimeout(providerFetchTimer)
  }
  providerFetchTimer = setTimeout(() => {
    providerFetchTimer = undefined
    void refreshProviderFetchEffects()
  }, 300)
}

async function refreshProviderFetchEffects() {
  const version = ++providerFetchVersion
  const results = await resolveRuleFetchEffects(providerSourceRules.value, providerContext)
  if (version !== providerFetchVersion) {
    return
  }
  results.forEach((result) => {
    if (!providerStates[result.fieldId]) {
      providerStates[result.fieldId] = {}
    }
    providerStates[result.fieldId].fetchLoaded = true
    providerStates[result.fieldId].fetchPatch = result.patch
  })
}

onBeforeUnmount(() => {
  if (providerFetchTimer) {
    clearTimeout(providerFetchTimer)
    providerFetchTimer = undefined
  }
})

onMounted(() => {
  emit('update:api', api)
  emit('mounted', api)
})

defineExpose({
  ...api,
  api,
})
</script>

<style lang="scss" scoped>
@import './style/index.scss';
</style>
