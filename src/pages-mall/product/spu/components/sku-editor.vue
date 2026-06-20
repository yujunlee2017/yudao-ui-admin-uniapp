<template>
  <view>
    <!-- 多规格：规格定义 -->
    <template v-if="specType">
      <view
        v-for="(spec, sIndex) in specs"
        :key="sIndex"
        class="mb-16rpx rounded-8rpx bg-[#f7f8fa] p-16rpx"
      >
        <view class="mb-12rpx flex items-center justify-between">
          <text class="text-28rpx text-[#333] font-medium">{{ spec.propertyName }}</text>
          <text class="text-26rpx text-[#fa4350]" @click="handleRemoveSpec(sIndex)">删除</text>
        </view>
        <view class="flex flex-wrap gap-12rpx">
          <view
            v-for="val in spec.allValues"
            :key="val.id"
            class="rounded-6rpx px-20rpx py-8rpx text-26rpx"
            :class="spec.selectedValueIds.includes(val.id) ? 'bg-[#1677ff] text-white' : 'bg-white text-[#666]'"
            @click="handleToggleValue(spec, val.id)"
          >
            {{ val.name }}
          </view>
          <view v-if="!spec.allValues.length" class="text-24rpx text-[#999]">
            该规格暂无属性值
          </view>
        </view>
      </view>
      <view class="mb-20rpx flex gap-16rpx">
        <wd-button size="small" variant="plain" @click="handleOpenSpecPicker">
          添加规格
        </wd-button>
        <wd-button size="small" type="primary" :disabled="!canGenerate" @click="handleGenerate">
          生成规格
        </wd-button>
      </view>
    </template>

    <!-- SKU 列表（单规格 1 条；多规格按组合生成） -->
    <view
      v-for="(sku, index) in rows"
      :key="index"
      class="mb-16rpx rounded-8rpx bg-[#f7f8fa] p-16rpx"
    >
      <view v-if="specType" class="mb-12rpx text-26rpx text-[#333] font-medium">
        {{ skuLabel(sku) }}
      </view>
      <view class="flex items-center gap-12rpx py-6rpx">
        <text class="w-160rpx shrink-0 text-26rpx text-[#666]">销售价(元)</text>
        <wd-input-number v-model="sku.price" :min="0" :step="0.01" @change="emitChange" />
      </view>
      <view class="flex items-center gap-12rpx py-6rpx">
        <text class="w-160rpx shrink-0 text-26rpx text-[#666]">市场价(元)</text>
        <wd-input-number v-model="sku.marketPrice" :min="0" :step="0.01" @change="emitChange" />
      </view>
      <view class="flex items-center gap-12rpx py-6rpx">
        <text class="w-160rpx shrink-0 text-26rpx text-[#666]">成本价(元)</text>
        <wd-input-number v-model="sku.costPrice" :min="0" :step="0.01" @change="emitChange" />
      </view>
      <view class="flex items-center gap-12rpx py-6rpx">
        <text class="w-160rpx shrink-0 text-26rpx text-[#666]">库存</text>
        <wd-input-number v-model="sku.stock" :min="0" @change="emitChange" />
      </view>
      <!-- 单独分佣时展示一二级佣金 -->
      <template v-if="subCommissionType">
        <view class="flex items-center gap-12rpx py-6rpx">
          <text class="w-160rpx shrink-0 text-26rpx text-[#666]">一级佣金(元)</text>
          <wd-input-number v-model="sku.firstBrokeragePrice" :min="0" :step="0.01" @change="emitChange" />
        </view>
        <view class="flex items-center gap-12rpx py-6rpx">
          <text class="w-160rpx shrink-0 text-26rpx text-[#666]">二级佣金(元)</text>
          <wd-input-number v-model="sku.secondBrokeragePrice" :min="0" :step="0.01" @change="emitChange" />
        </view>
      </template>
    </view>
    <view v-if="!rows.length" class="rounded-8rpx bg-[#f7f8fa] py-32rpx text-center text-26rpx text-[#999]">
      {{ specType ? '请添加规格并生成 SKU' : '加载中...' }}
    </view>

    <!-- 规格选择弹窗 -->
    <wd-popup
      v-model="specPickerVisible"
      position="bottom"
      closable
      custom-style="border-radius: 24rpx 24rpx 0 0;"
      @close="specPickerVisible = false"
    >
      <view class="p-24rpx">
        <view class="mb-24rpx text-32rpx text-[#333] font-semibold">
          选择规格
        </view>
        <scroll-view class="max-h-50vh" scroll-y>
          <view
            v-for="property in availableProperties"
            :key="property.id"
            class="border-b border-[#f5f5f5] py-20rpx text-28rpx text-[#333]"
            @click="handleAddSpec(property)"
          >
            {{ property.name }}
          </view>
          <view v-if="!availableProperties.length" class="py-32rpx text-center text-26rpx text-[#999]">
            暂无可选规格
          </view>
        </scroll-view>
      </view>
    </wd-popup>
  </view>
</template>

<script lang="ts" setup>
import type { ProductProperty } from '@/api/mall/product/property'
import type { ProductSku } from '@/api/mall/product/spu'
import { computed, onMounted, ref, watch } from 'vue'
import {
  getSimpleProductPropertyList,
  getSimpleProductPropertyValueList,
} from '@/api/mall/product/property'

/** 规格定义（生成 SKU 用） */
interface SpecItem {
  propertyId: number
  propertyName: string
  allValues: { id: number, name: string }[]
  selectedValueIds: number[]
}

const props = defineProps<{
  modelValue: ProductSku[] // SKU 列表（金额单位元）
  specType?: boolean // 是否多规格
  subCommissionType?: boolean // 是否单独分佣
}>()

const emit = defineEmits<{
  'update:modelValue': [skus: ProductSku[]]
}>()

const rows = computed(() => props.modelValue || []) // SKU 列表（直接编辑 modelValue 内元素）
const specs = ref<SpecItem[]>([]) // 规格定义
const propertyList = ref<ProductProperty[]>([]) // 全部商品属性
const specPickerVisible = ref(false) // 规格选择弹窗
const availableProperties = computed(() => propertyList.value.filter(p => !specs.value.some(s => s.propertyId === p.id))) // 未选规格
const canGenerate = computed(() => specs.value.length > 0 && specs.value.every(s => s.selectedValueIds.length > 0)) // 可生成

/** 创建一条默认 SKU（元） */
function createSku(properties: ProductSku['properties'] = []): ProductSku {
  return { price: 0, marketPrice: 0, costPrice: 0, stock: 0, firstBrokeragePrice: 0, secondBrokeragePrice: 0, properties }
}

/** SKU 规格组合文案 */
function skuLabel(sku: ProductSku) {
  return (sku.properties || []).map(p => p.valueName).filter(Boolean).join(' / ') || '默认'
}

/** 通知父级 SKU 变化（结构变化时重新派发数组） */
function emitChange() {
  emit('update:modelValue', [...rows.value])
}

/** 打开规格选择 */
async function handleOpenSpecPicker() {
  if (!propertyList.value.length) {
    propertyList.value = await getSimpleProductPropertyList()
  }
  specPickerVisible.value = true
}

/** 添加规格并加载其属性值 */
async function handleAddSpec(property: ProductProperty) {
  specPickerVisible.value = false
  const values = await getSimpleProductPropertyValueList(property.id!)
  specs.value.push({
    propertyId: property.id!,
    propertyName: property.name,
    allValues: values.filter(v => v.id != null).map(v => ({ id: v.id as number, name: v.name })),
    selectedValueIds: [],
  })
}

/** 删除规格 */
function handleRemoveSpec(index: number) {
  specs.value.splice(index, 1)
}

/** 切换属性值选中 */
function handleToggleValue(spec: SpecItem, valueId: number) {
  const idx = spec.selectedValueIds.indexOf(valueId)
  if (idx >= 0) {
    spec.selectedValueIds.splice(idx, 1)
  } else {
    spec.selectedValueIds.push(valueId)
  }
}

/** 生成规格组合 SKU（保留已有组合的价格库存） */
function handleGenerate() {
  // 每个规格取「选中值」做笛卡尔积
  let combos: ProductSku['properties'][] = [[]]
  for (const spec of specs.value) {
    const next: ProductSku['properties'][] = []
    for (const combo of combos) {
      for (const valueId of spec.selectedValueIds) {
        const value = spec.allValues.find(v => v.id === valueId)
        next.push([...(combo || []), { propertyId: spec.propertyId, propertyName: spec.propertyName, valueId, valueName: value?.name }])
      }
    }
    combos = next
  }
  // 以组合 key 保留旧 SKU 价格
  const oldMap = new Map(rows.value.map(sku => [comboKey(sku.properties), sku]))
  const next = combos.map((properties) => {
    const old = oldMap.get(comboKey(properties))
    return old ? { ...old, properties } : createSku(properties)
  })
  emit('update:modelValue', next)
}

/** 组合唯一 key（按 valueId 排序） */
function comboKey(properties: ProductSku['properties'] = []) {
  return (properties || []).map(p => p.valueId).sort((a, b) => Number(a) - Number(b)).join('-')
}

/** 从已有 SKU 反推规格定义（编辑回显） */
async function rebuildSpecsFromSkus() {
  const map = new Map<number, { name: string, values: Map<number, string> }>()
  for (const sku of rows.value) {
    for (const prop of sku.properties || []) {
      if (prop.propertyId == null || prop.valueId == null) {
        continue
      }
      if (!map.has(prop.propertyId)) {
        map.set(prop.propertyId, { name: prop.propertyName || '', values: new Map() })
      }
      map.get(prop.propertyId)!.values.set(prop.valueId, prop.valueName || '')
    }
  }
  specs.value = Array.from(map.entries()).map(([propertyId, item]) => ({
    propertyId,
    propertyName: item.name,
    allValues: Array.from(item.values.entries()).map(([id, name]) => ({ id, name })),
    selectedValueIds: Array.from(item.values.keys()),
  }))
}

/** 同步单/多规格结构 */
function syncStructure() {
  if (props.specType) {
    // 多规格：有规格信息则反推规格定义，否则清空等待生成
    if (rows.value.some(sku => sku.properties?.length)) {
      rebuildSpecsFromSkus()
    } else if (rows.value.length) {
      emit('update:modelValue', [])
    }
  } else {
    // 单规格：始终保持一条无规格 SKU
    if (rows.value.length !== 1 || rows.value[0]?.properties?.length) {
      emit('update:modelValue', [rows.value[0] ? { ...rows.value[0], properties: [] } : createSku()])
    }
  }
}

// 多规格切换：重置规格定义
watch(() => props.specType, syncStructure)

/** 初始化 */
onMounted(() => {
  syncStructure()
})
</script>
