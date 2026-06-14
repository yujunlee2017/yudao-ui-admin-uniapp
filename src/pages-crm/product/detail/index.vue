<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="产品详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情分类 -->
    <view class="bg-white">
      <wd-tabs v-model="tabIndex">
        <wd-tab v-for="tab in tabs" :key="tab.key" :title="tab.title" />
      </wd-tabs>
    </view>

    <!-- 基本信息 -->
    <wd-cell-group v-if="activeTab === 'basic'" border>
      <template v-for="field in detailFields" :key="field.prop">
        <wd-cell v-if="field.dictType" :title="field.label">
          <dict-tag v-if="hasValue(field.prop)" :type="field.dictType" :value="formData[field.prop]" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell v-else :title="field.label" :value="formatValue(field)" />
      </template>
    </wd-cell-group>

    <!-- 操作日志 -->
    <CrmOperateLogs v-else-if="activeTab === 'log' && productId" :biz-id="productId" :biz-type="bizType" />

    <!-- 底部操作（按 tab 区分，只放当前模块的操作） -->
    <view v-if="hasFooter" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <template v-if="activeTab === 'basic'">
          <wd-button v-if="canUpdate" class="flex-1" type="warning" @click="handleEdit">
            编辑
          </wd-button>
          <wd-button v-if="canDelete" class="flex-1" type="danger" :loading="deleting" @click="handleDelete">
            删除
          </wd-button>
        </template>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { deleteProduct, getProduct } from '@/api/crm/product'
import { BizTypeEnum } from '@/api/crm/permission'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import CrmOperateLogs from '@/pages-crm/operate-log/components/operate-log-list.vue'

const props = defineProps<{ id?: number | any }>()
definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const bizType = BizTypeEnum.CRM_PRODUCT
const tabs: { key: string, title: string }[] = [
  { key: 'basic', title: '基本信息' },
  { key: 'log', title: '操作日志' },
]
const detailFields: { label: string, prop: string, dictType?: string, type?: 'money' }[] = [ // 基本信息字段
  { label: '产品名称', prop: 'name' },
  { label: '产品编码', prop: 'no' },
  { label: '产品分类', prop: 'categoryName' },
  { label: '产品单位', prop: 'unit', dictType: DICT_TYPE.CRM_PRODUCT_UNIT },
  { label: '价格', prop: 'price', type: 'money' },
  { label: '上架状态', prop: 'status', dictType: DICT_TYPE.CRM_PRODUCT_STATUS },
  { label: '产品描述', prop: 'description' },
]

const { hasAccessByCodes } = useAccess()
const dialog = useDialog()
const toast = useToast()
const formData = ref<Record<string, any>>({}) // 详情数据
const tabIndex = ref(0) // 当前详情分类下标
const deleting = ref(false) // 删除状态
const productId = computed(() => Number(props.id))
const activeTab = computed(() => tabs[tabIndex.value].key)
const canUpdate = computed(() => hasAccessByCodes(['crm:product:update']))
const canDelete = computed(() => hasAccessByCodes(['crm:product:delete']))
const hasFooter = computed(() => {
  switch (activeTab.value) {
    case 'log':
      return false
    case 'basic':
      return canUpdate.value || canDelete.value
    default:
      return false
  }
})

/** 字段是否有值 */
function hasValue(prop: string) {
  const value = formData.value[prop]
  return value !== undefined && value !== null && value !== ''
}

/** 格式化基本信息字段值 */
function formatValue(field: { prop: string, type?: 'money' }) {
  const value = formData.value[field.prop]
  if (value === undefined || value === null || value === '') {
    return '-'
  }
  if (field.type === 'money') {
    const amount = Number(value)
    return Number.isNaN(amount) ? String(value) : amount.toFixed(2)
  }
  return String(value)
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-crm/product/index')
}

/** 加载详情 */
async function getDetail() {
  if (!productId.value) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getProduct(productId.value)
  } finally {
    toast.close()
  }
}

/** 编辑 */
function handleEdit() {
  uni.navigateTo({ url: `/pages-crm/product/form/index?id=${productId.value}` })
}

/** 删除 */
async function handleDelete() {
  if (!productId.value) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: '确定要删除该产品吗？' })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteProduct(productId.value)
    toast.success('删除成功')
    uni.$emit('crm:product:reload')
    setTimeout(() => handleBack(), 500)
  } finally {
    deleting.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
  uni.$on('crm:product:reload', getDetail)
})

/** 卸载 */
onUnload(() => {
  uni.$off('crm:product:reload', getDetail)
})
</script>
