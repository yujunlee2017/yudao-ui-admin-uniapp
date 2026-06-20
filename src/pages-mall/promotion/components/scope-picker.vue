<template>
  <view>
    <!-- 已选项 + 打开按钮 -->
    <view class="flex flex-wrap items-center gap-12rpx">
      <wd-tag
        v-for="item in selectedOptions"
        :key="item.value"
        plain
        closable
        @close="handleRemove(item.value)"
      >
        {{ item.label }}
      </wd-tag>
      <wd-button size="small" variant="plain" @click="handleOpen">
        选择{{ scopeLabel }}
      </wd-button>
    </view>

    <!-- 多选弹窗 -->
    <wd-popup
      v-model="visible"
      position="bottom"
      closable
      custom-style="border-radius: 24rpx 24rpx 0 0; height: 70vh;"
      @close="visible = false"
    >
      <view class="flex h-70vh flex-col p-24rpx">
        <view class="mb-16rpx text-32rpx text-[#333] font-semibold">
          选择{{ scopeLabel }}
        </view>
        <wd-search v-model="keyword" :placeholder="`搜索${scopeLabel}名称`" hide-cancel @search="() => {}" />
        <scroll-view class="mt-16rpx min-h-0 flex-1" scroll-y>
          <wd-checkbox-group v-model="tempSelected">
            <wd-checkbox
              v-for="item in filteredOptions"
              :key="item.value"
              :model-value="item.value"
              class="border-b border-[#f5f5f5] py-16rpx"
            >
              {{ item.label }}
            </wd-checkbox>
          </wd-checkbox-group>
          <view v-if="!filteredOptions.length" class="py-48rpx text-center text-26rpx text-[#999]">
            暂无{{ scopeLabel }}
          </view>
        </scroll-view>
        <view class="mt-16rpx flex gap-20rpx">
          <wd-button class="flex-1" variant="plain" @click="visible = false">
            取消
          </wd-button>
          <wd-button class="flex-1" type="primary" @click="handleConfirm">
            确定（{{ tempSelected.length }}）
          </wd-button>
        </view>
      </view>
    </wd-popup>
  </view>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { getProductCategoryList } from '@/api/mall/product/category'
import { getSimpleProductSpuList } from '@/api/mall/product/spu'

interface ScopeOption { label: string, value: number }

const props = defineProps<{
  modelValue?: number[] // 已选编号
  scope: number // 商品范围：2 指定商品、3 指定分类
}>()

const emit = defineEmits<{
  'update:modelValue': [values: number[]]
}>()

const visible = ref(false) // 弹窗显示状态
const keyword = ref('') // 搜索关键字
const options = ref<ScopeOption[]>([]) // 全部可选项
const tempSelected = ref<number[]>([]) // 弹窗内临时选中

const scopeLabel = computed(() => props.scope === 3 ? '分类' : '商品') // 范围文案
const selectedOptions = computed(() => { // 已选项（用于标签展示）
  return (props.modelValue || []).map(value => ({
    value,
    label: options.value.find(item => item.value === value)?.label || String(value),
  }))
})
const filteredOptions = computed(() => { // 按关键字过滤
  const word = keyword.value.trim()
  if (!word) {
    return options.value
  }
  return options.value.filter(item => item.label.includes(word))
})

/** 加载范围选项（商品或分类） */
async function loadOptions() {
  if (props.scope === 3) {
    const list = await getProductCategoryList()
    options.value = list.filter(item => item.id != null).map(item => ({ value: item.id as number, label: item.name }))
  } else {
    const list = await getSimpleProductSpuList()
    options.value = list.filter(item => item.id != null).map(item => ({ value: item.id as number, label: item.name || `商品 #${item.id}` }))
  }
}

/** 打开弹窗 */
async function handleOpen() {
  if (!options.value.length) {
    await loadOptions()
  }
  tempSelected.value = [...(props.modelValue || [])]
  visible.value = true
}

/** 确认选择 */
function handleConfirm() {
  emit('update:modelValue', [...tempSelected.value])
  visible.value = false
}

/** 移除单个已选项 */
function handleRemove(value: number) {
  emit('update:modelValue', (props.modelValue || []).filter(item => item !== value))
}

// 范围切换时重置选项缓存（商品↔分类编号语义不同）
watch(() => props.scope, () => {
  options.value = []
  keyword.value = ''
})
</script>
