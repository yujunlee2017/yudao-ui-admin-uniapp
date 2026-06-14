<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="产品分类详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情分类（仅单个 tab 时隐藏标签栏） -->
    <view v-if="tabs.length > 1" class="bg-white">
      <wd-tabs v-model="tabIndex">
        <wd-tab v-for="tab in tabs" :key="tab.key" :title="tab.title" />
      </wd-tabs>
    </view>

    <!-- 基本信息 -->
    <wd-cell-group v-if="activeTab === 'basic'" border>
      <template v-for="field in detailFields" :key="field.prop">
        <wd-cell :title="field.label" :value="formatValue(field)" />
      </template>
    </wd-cell-group>

    <!-- 底部操作 -->
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
import { deleteProductCategory, getProductCategory } from '@/api/crm/product/category'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'

const props = defineProps<{ id?: number | any }>()
definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const tabs: { key: string, title: string }[] = [
  { key: 'basic', title: '基本信息' },
]
const detailFields: { label: string, prop: string }[] = [ // 基本信息字段
  { label: '分类名称', prop: 'name' },
  { label: '父级编号', prop: 'parentId' },
]

const { hasAccessByCodes } = useAccess()
const dialog = useDialog()
const toast = useToast()
const formData = ref<Record<string, any>>({}) // 详情数据
const tabIndex = ref(0) // 当前详情分类下标
const deleting = ref(false) // 删除状态
const categoryId = computed(() => Number(props.id))
const activeTab = computed(() => tabs[tabIndex.value].key)
const canUpdate = computed(() => hasAccessByCodes(['crm:product-category:update']))
const canDelete = computed(() => hasAccessByCodes(['crm:product-category:delete']))
const hasFooter = computed(() => {
  if (activeTab.value === 'basic') {
    return canUpdate.value || canDelete.value
  }
  return false
})

/** 格式化基本信息字段值 */
function formatValue(field: { prop: string }) {
  const value = formData.value[field.prop]
  if (value === undefined || value === null || value === '') {
    return '-'
  }
  return String(value)
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-crm/product/category/index')
}

/** 加载详情 */
async function getDetail() {
  if (!categoryId.value) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getProductCategory(categoryId.value)
  } finally {
    toast.close()
  }
}

/** 编辑 */
function handleEdit() {
  uni.navigateTo({ url: `/pages-crm/product/category/form/index?id=${categoryId.value}` })
}

/** 删除 */
async function handleDelete() {
  if (!categoryId.value) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: '确定要删除该产品分类吗？' })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteProductCategory(categoryId.value)
    toast.success('删除成功')
    uni.$emit('crm:productCategory:reload')
    setTimeout(() => handleBack(), 500)
  } finally {
    deleting.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
  uni.$on('crm:productCategory:reload', getDetail)
})

/** 卸载 */
onUnload(() => {
  uni.$off('crm:productCategory:reload', getDetail)
})
</script>
