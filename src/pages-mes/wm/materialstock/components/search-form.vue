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
          物料
        </view>
        <view
          class="min-h-72rpx flex items-center justify-between gap-16rpx rounded-8rpx bg-[#f7f8fa] px-20rpx text-28rpx"
          @click="openItemSelector"
        >
          <text class="min-w-0 flex-1 truncate" :class="selectedItemText ? 'text-[#333]' : 'text-[#999]'">
            {{ selectedItemText || '请选择物料' }}
          </text>
          <wd-icon v-if="formData.itemId" name="close" size="28rpx" @click.stop="clearItem" />
          <wd-icon v-else name="arrow-right" size="28rpx" />
        </view>
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          批次号
        </view>
        <wd-input
          v-model="formData.batchCode"
          placeholder="请输入批次号"
          clearable
        />
      </view>
      <yd-search-picker
        v-model="formData.warehouseId"
        label="仓库"
        :columns="warehouseOptions"
        label-key="name"
        value-key="id"
        placeholder="请选择仓库"
        all-option
        :all-value="undefined"
        @update:model-value="handleWarehouseChange"
      />
      <yd-search-picker
        v-model="formData.locationId"
        label="库区"
        :columns="locationOptions"
        label-key="name"
        value-key="id"
        :placeholder="formData.warehouseId ? '请选择库区' : '请先选择仓库'"
        all-option
        :all-value="undefined"
      />
      <yd-search-picker v-model="formData.frozen" label="是否冻结" :columns="frozenOptions" all-option :all-value="undefined" />
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

  <!-- 物料选择器 -->
  <ItemSelector
    ref="itemSelectorRef"
    :multiple="false"
    @confirm="handleItemConfirm"
  />
</template>

<script lang="ts" setup>
import type { MdItemVO } from '@/api/mes/md/item'
import type { WmMaterialStockQueryParams } from '@/api/mes/wm/materialstock'
import type { WmWarehouseVO } from '@/api/mes/wm/warehouse'
import type { WmWarehouseLocationVO } from '@/api/mes/wm/warehouse/location'
import { computed, onMounted, reactive, ref } from 'vue'
import { getWarehouseSimpleList } from '@/api/mes/wm/warehouse'
import { getWarehouseLocationSimpleList } from '@/api/mes/wm/warehouse/location'
import ItemSelector from '@/pages-mes/md/item/components/item-selector.vue'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'

interface MaterialStockSearchFormData {
  itemId?: number
  batchCode?: string
  warehouseId?: number
  locationId?: number
  frozen?: boolean
}

const emit = defineEmits<{
  search: [data: WmMaterialStockQueryParams]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const itemSelectorRef = ref<InstanceType<typeof ItemSelector>>() // 物料选择器引用
const selectedItem = ref<MdItemVO>() // 已选物料
const warehouseOptions = ref<WmWarehouseVO[]>([]) // 仓库选项
const locationOptions = ref<WmWarehouseLocationVO[]>([]) // 库区选项
const formData = reactive<MaterialStockSearchFormData>({}) // 搜索表单数据
const frozenOptions = [
  { label: '是', value: true },
  { label: '否', value: false },
]

const selectedItemText = computed(() => {
  return selectedItem.value
    ? `${selectedItem.value.code || '-'} ${selectedItem.value.name || ''}`.trim()
    : ''
})
const warehouseDisplayValue = computed(() => warehouseOptions.value.find(item => item.id === formData.warehouseId)?.name || '')
const locationDisplayValue = computed(() => locationOptions.value.find(item => item.id === formData.locationId)?.name || '')
const frozenDisplayValue = computed(() => {
  if (formData.frozen === true) {
    return '是'
  }
  if (formData.frozen === false) {
    return '否'
  }
  return ''
})

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (selectedItemText.value) {
    conditions.push(`物料:${selectedItemText.value}`)
  }
  if (formData.batchCode) {
    conditions.push(`批次号:${formData.batchCode}`)
  }
  if (warehouseDisplayValue.value) {
    conditions.push(`仓库:${warehouseDisplayValue.value}`)
  }
  if (locationDisplayValue.value) {
    conditions.push(`库区:${locationDisplayValue.value}`)
  }
  if (frozenDisplayValue.value) {
    conditions.push(`冻结:${frozenDisplayValue.value}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索库存台账'
})

/** 加载仓库选项 */
async function loadWarehouseOptions() {
  warehouseOptions.value = await getWarehouseSimpleList() || []
}

/** 打开物料选择 */
function openItemSelector() {
  itemSelectorRef.value?.open()
}

/** 确认物料选择 */
function handleItemConfirm(items: MdItemVO[]) {
  const item = items[0]
  if (!item) {
    return
  }
  formData.itemId = item.id
  selectedItem.value = item
}

/** 清空物料 */
function clearItem() {
  formData.itemId = undefined
  selectedItem.value = undefined
}

/** 选择仓库 */
async function handleWarehouseChange(value?: number) {
  formData.warehouseId = value
  formData.locationId = undefined
  if (!value) {
    locationOptions.value = []
    return
  }
  locationOptions.value = await getWarehouseLocationSimpleList(value) || []
}

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', { ...formData })
}

/** 重置按钮操作 */
function handleReset() {
  formData.itemId = undefined
  formData.batchCode = undefined
  formData.warehouseId = undefined
  formData.locationId = undefined
  formData.frozen = undefined
  selectedItem.value = undefined
  locationOptions.value = []
  visible.value = false
  emit('reset')
}

/** 初始化 */
onMounted(() => {
  loadWarehouseOptions()
})
</script>
