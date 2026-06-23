<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="产品单位详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <view>
      <wd-cell-group border>
        <wd-cell title="单位名字" :value="formData?.name || '-'" />
        <wd-cell title="单位状态">
          <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="formData?.status" />
        </wd-cell>
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>
    </view>

    <!-- 底部操作按钮 -->
    <ErpBasicActions
      :can-update="canUpdate"
      :can-delete="canDelete"
      :deleting="deleting"
      @edit="handleEdit"
      @delete="handleDelete"
    />
  </view>
</template>

<script lang="ts" setup>
import type { ProductUnit } from '@/api/erp/product/unit'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref, watch } from 'vue'
import { useRouteQuery } from '@/hooks/useRouteQuery'
import { deleteProductUnit, getProductUnit } from '@/api/erp/product/unit'
import { useAccess } from '@/hooks/useAccess'
import ErpBasicActions from '@/pages-erp/components/erp-basic-actions.vue'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'

const props = defineProps<{ id?: number | any }>()
const { getRouteQueryNumber } = useRouteQuery(props, '/pages-erp/product/unit/detail/index')
const currentId = computed(() => getRouteQueryNumber('id'))

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const dialog = useDialog()
const toast = useToast()
const formData = ref<ProductUnit>() // 详情数据
const deleting = ref(false) // 删除状态
const canUpdate = computed(() => hasAccessByCodes(['erp:product-unit:update']))
const canDelete = computed(() => hasAccessByCodes(['erp:product-unit:delete']))

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-erp/product/unit/index')
}

/** 加载产品单位详情 */
async function getDetail() {
  if (!currentId.value || deleting.value) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getProductUnit(Number(currentId.value))
  } finally {
    toast.close()
  }
}

/** 编辑产品单位 */
function handleEdit() {
  uni.navigateTo({ url: `/pages-erp/product/unit/form/index?id=${currentId.value}` })
}

/** 删除产品单位 */
async function handleDelete() {
  if (!currentId.value) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确定要删除该产品单位吗？',
    })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteProductUnit(Number(currentId.value))
    toast.success('删除成功')
    uni.$emit('erp:product-unit:reload')
    setTimeout(() => handleBack(), 500)
  } finally {
    deleting.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
  uni.$on('erp:product-unit:reload', getDetail)
})

watch(currentId, () => {
  formData.value = undefined
  void getDetail()
})

/** 卸载 */
onUnload(() => {
  uni.$off('erp:product-unit:reload', getDetail)
})
</script>
