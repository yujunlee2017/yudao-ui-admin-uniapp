<template>
  <view v-if="canExport" class="bg-white px-24rpx py-16rpx">
    <view
      data-testid="erp-export-action"
      class="h-64rpx flex items-center justify-center border-2rpx border-[#1677ff] rounded-8rpx text-26rpx text-[#1677ff]"
      :class="loading ? 'opacity-60' : ''"
      @tap="handleExport"
    >
      {{ loading ? '导出中...' : '导出当前筛选数据' }}
    </view>
  </view>
</template>

<script lang="ts" setup>
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref } from 'vue'
import { useAccess } from '@/hooks/useAccess'
import { downloadApiFile } from '@/utils/download'
import { getErpModule } from '../config'

const props = defineProps<{
  moduleKey: string
  params?: Record<string, any>
}>()

const { hasAccessByCodes } = useAccess()
const toast = useToast()
const loading = ref(false)
const moduleConfig = computed(() => getErpModule(props.moduleKey))
const exportConfig = computed(() => moduleConfig.value?.exportConfig)
const canExport = computed(() => {
  return Boolean(exportConfig.value?.url && moduleConfig.value?.permission && hasAccessByCodes([`${moduleConfig.value.permission}:export`]))
})

function cleanParams(params?: Record<string, any>) {
  const result: Record<string, any> = {}
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '' || value === -1) {
      return
    }
    result[key] = value
  })
  return result
}

async function handleExport() {
  if (!exportConfig.value || loading.value) {
    return
  }
  const { confirm } = await uni.showModal({
    title: '导出确认',
    content: `确定要导出${moduleConfig.value?.title || '当前模块'}当前筛选数据吗？`,
  })
  if (!confirm) {
    return
  }
  loading.value = true
  try {
    await downloadApiFile(exportConfig.value.url, cleanParams(props.params), exportConfig.value.fileName)
    toast.success('导出成功')
  } finally {
    loading.value = false
  }
}
</script>
