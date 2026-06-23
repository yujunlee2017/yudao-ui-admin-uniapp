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
          产品
        </view>
        <ErpPicker
          v-model="formData.productId"
          source="product"
          form-item
          placeholder="请选择产品"
          @confirm="option => selectedNames.product = option?.name || ''"
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          仓库
        </view>
        <ErpPicker
          v-model="formData.warehouseId"
          source="warehouse"
          form-item
          placeholder="请选择仓库"
          @confirm="option => selectedNames.warehouse = option?.name || ''"
        />
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
import ErpPicker from '@/pages-erp/components/erp-picker.vue'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const selectedNames = reactive({
  product: '',
  warehouse: '',
}) // 选择器展示名称
const formData = reactive({
  productId: undefined as number | undefined,
  warehouseId: undefined as number | undefined,
}) // 搜索表单数据

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.productId) {
    conditions.push(`产品:${selectedNames.product || formData.productId}`)
  }
  if (formData.warehouseId) {
    conditions.push(`仓库:${selectedNames.warehouse || formData.warehouseId}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索产品库存'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    productId: formData.productId,
    warehouseId: formData.warehouseId,
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.productId = undefined
  formData.warehouseId = undefined
  selectedNames.product = ''
  selectedNames.warehouse = ''
  visible.value = false
  emit('reset')
}
</script>
