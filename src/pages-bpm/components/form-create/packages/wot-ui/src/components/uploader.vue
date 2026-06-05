<template>
  <wd-form-item :title="rule.title" :title-width="titleWidth" :prop="rule.field" layout="vertical">
    <wd-upload
      :file-list="fileList"
      :accept="accept"
      :disabled="disabled"
      :extension="extension"
      :limit="limit"
      :multiple="multiple"
      :max-size="maxSize"
      :action="action"
      :auto-upload="true"
      :upload-method="uploadMethod"
      @change="handleFileChange"
      @remove="handleFileChange"
    />
  </wd-form-item>
</template>

<script lang="ts" setup>
import type { UploadFileItem, UploadFileType } from '@wot-ui/ui/components/wd-upload/types'
import type { NormalizedFormCreateRule } from '../../../../types/typing'
import { computed } from 'vue'

const props = defineProps<{
  disabled?: boolean
  modelValue?: any
  rule: NormalizedFormCreateRule
  titleWidth?: string | number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: any]
  'change': [value: any]
}>()

const IMAGE_UPLOAD_TYPES = new Set(['ImageUpload', 'ImagesUpload', 'UploadImg', 'UploadImgs', 'uploadImage', 'uploadImages'])
const SINGLE_UPLOAD_TYPES = new Set(['ImageUpload', 'UploadImg', 'UploadFile', 'uploadImage'])
const WOT_ACCEPT_TYPES = new Set<UploadFileType>(['image', 'video', 'media', 'all', 'file'])
const MIME_EXTENSION_MAP: Record<string, string[]> = {
  'application/msword': ['.doc'],
  'application/pdf': ['.pdf'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.ms-powerpoint': ['.ppt'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'image/apng': ['.apng'],
  'image/bmp': ['.bmp'],
  'image/gif': ['.gif'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/pjpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/svg+xml': ['.svg'],
  'image/tiff': ['.tif', '.tiff'],
  'image/webp': ['.webp'],
  'image/x-icon': ['.ico'],
  'text/plain': ['.txt'],
}

const configuredLimit = computed(() => normalizeLimit(props.rule.props?.maxNumber ?? props.rule.props?.maxCount ?? props.rule.props?.limit))
const limit = computed(() => configuredLimit.value || (isSingle() ? 1 : undefined))
const multiple = computed(() => !!props.rule.props?.multiple || (limit.value ? limit.value > 1 : false))
const accept = computed<UploadFileType>(() => {
  if (isImageUpload()) {
    return 'image'
  }
  return normalizeAccept(props.rule.props?.acceptType || props.rule.props?.accept) || 'all'
})
const extension = computed(() => normalizeExtensions(props.rule.props?.extension || props.rule.props?.fileType || props.rule.props?.accept))
const maxSize = computed(() => {
  const max = props.rule.props?.maxSize ?? props.rule.props?.fileSize
  const size = Number(max)
  return Number.isFinite(size) && size > 0 ? size * 1024 * 1024 : Number.MAX_VALUE
})
const action = computed(() => props.rule.props?.action || '/infra/file/upload')
const fileList = computed(() => normalizeFileList(props.modelValue))
const uploadMethod = computed(() => props.rule.props?.uploadMethod)

function normalizeFileList(value: any): UploadFileItem[] {
  const list = Array.isArray(value)
    ? value
    : typeof value === 'string' && value.includes(',')
      ? value.split(',').filter(Boolean)
      : value
        ? [value]
        : []
  return list.map((item, index) => {
    if (typeof item === 'string') {
      return {
        uid: index,
        name: item.slice(Math.max(0, item.lastIndexOf('/') + 1)),
        status: 'success',
        url: item,
      }
    }
    return {
      uid: item.uid ?? index,
      status: item.status || 'success',
      url: item.url || item.path || item.response?.url || '',
      ...item,
    }
  })
}

function handleFileChange(event: { fileList?: UploadFileItem[] }) {
  emitValue(event.fileList || fileList.value)
}

function emitValue(nextFileList: UploadFileItem[]) {
  const valueList = nextFileList
    .filter(item => item.status === 'success')
    .map((item: any) => getUploadedUrl(item))
    .filter(Boolean)
  const value = isSingle() ? (valueList[0] || '') : valueList
  emit('update:modelValue', value)
  emit('change', value)
}

function isSingle() {
  if (props.rule.props?.multiple || (configuredLimit.value && configuredLimit.value > 1)) {
    return false
  }
  return SINGLE_UPLOAD_TYPES.has(props.rule.type) || configuredLimit.value === 1
}

function isImageUpload() {
  return IMAGE_UPLOAD_TYPES.has(props.rule.type)
}

function normalizeLimit(value: any) {
  const limit = Number(value)
  return Number.isFinite(limit) && limit > 0 ? limit : undefined
}

function normalizeAccept(value: any): UploadFileType | undefined {
  if (typeof value !== 'string') {
    return undefined
  }
  const accept = value.toLowerCase() as UploadFileType
  return WOT_ACCEPT_TYPES.has(accept) ? accept : undefined
}

function normalizeExtensions(value: any) {
  const values = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(',')
      : []
  const extensions = values.flatMap(item => normalizeExtension(item)).filter(Boolean)
  const uniqueExtensions = Array.from(new Set(extensions))
  return uniqueExtensions.length > 0 ? uniqueExtensions : undefined
}

function normalizeExtension(value: any): string[] {
  const item = String(value || '').trim()
  if (!item || WOT_ACCEPT_TYPES.has(item.toLowerCase() as UploadFileType)) {
    return []
  }
  const mimeExtensions = MIME_EXTENSION_MAP[item.toLowerCase()]
  if (mimeExtensions) {
    return mimeExtensions
  }
  if (item.startsWith('.')) {
    return [item]
  }
  if (item.includes('/')) {
    return []
  }
  return [`.${item}`]
}

function getUploadedUrl(item: UploadFileItem) {
  const response = parseResponse(item.response)
  if (typeof response === 'string') {
    return response
  }
  const data = response?.data
  if (typeof data === 'string') {
    return data
  }
  if (data && typeof data === 'object') {
    return data.url || data.fileUrl || data.path
  }
  return response?.url || item.url
}

function parseResponse(response?: string | Record<string, any>) {
  if (!response) {
    return undefined
  }
  if (typeof response !== 'string') {
    return response
  }
  try {
    return JSON.parse(response)
  } catch {
    return response
  }
}
</script>
