<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="产品详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-cell-group border>
        <wd-cell title="名称" :value="formData?.name || '-'" />
        <wd-cell title="条码" :value="formData?.barCode || '-'" />
        <wd-cell title="分类" :value="formData?.categoryName || '-'" />
        <wd-cell title="单位" :value="formData?.unitName || '-'" />
        <wd-cell title="状态">
          <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="formData?.status" />
        </wd-cell>
        <wd-cell title="规格" :value="formData?.standard || '-'" />
        <wd-cell title="保质期天数" :value="formData?.expiryDay ?? '-'" />
        <wd-cell title="重量(kg)" :value="formatNumber(formData?.weight)" />
        <wd-cell title="采购价格" :value="formatMoney(formData?.purchasePrice)" />
        <wd-cell title="销售价格" :value="formatMoney(formData?.salePrice)" />
        <wd-cell title="最低价格" :value="formatMoney(formData?.minPrice)" />
        <wd-cell title="备注" :value="formData?.remark || '-'" />
      </wd-cell-group>

      <!-- 底部安全区域 -->
      <view class="h-160rpx" />
    </scroll-view>

    <!-- 底部操作按钮 -->
    <!-- TODO @Yunai：不做 ErpBasicActions 统一封装，参考其它模块把底部操作写回各自详情页。 -->
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
import type { Product } from '@/api/erp/product/product'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref, watch } from 'vue'
import { useRouteQuery } from '@/hooks/useRouteQuery'
import { deleteProduct, getProduct } from '@/api/erp/product/product'
import { useAccess } from '@/hooks/useAccess'
import ErpBasicActions from '@/pages-erp/components/erp-basic-actions.vue'
import { enrichErpDocumentDetail, formatMoney, formatNumber } from '@/pages-erp/utils'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'

const props = defineProps<{ id?: number | any }>()
const { getRouteQueryNumber } = useRouteQuery(props, '/pages-erp/product/product/detail/index')
// TODO @Yunai：对齐 system 页面，直接用 props.id 接参，删除 useRouteQuery/currentId 包装。
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
const formData = ref<Product>() // 详情数据
const deleting = ref(false) // 删除状态
const canUpdate = computed(() => hasAccessByCodes(['erp:product:update']))
const canDelete = computed(() => hasAccessByCodes(['erp:product:delete']))

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-erp/product/product/index')
}

/** 加载产品详情 */
async function getDetail() {
  if (!currentId.value || deleting.value) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await enrichErpDocumentDetail(await getProduct(Number(currentId.value)), 'product') as Product
  } finally {
    toast.close()
  }
}

/** 编辑产品 */
function handleEdit() {
  uni.navigateTo({ url: `/pages-erp/product/product/form/index?id=${currentId.value}` })
}

/** 删除产品 */
async function handleDelete() {
  if (!currentId.value) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确定要删除该产品吗？',
    })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteProduct(Number(currentId.value))
    toast.success('删除成功')
    uni.$emit('erp:product:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
  uni.$on('erp:product:reload', getDetail)
})

// TODO @Yunai：watch currentId 对齐其它 detail，补 /** */ 注释并统一初始化/路由变化刷新写法。
watch(currentId, () => {
  formData.value = undefined
  void getDetail()
})

/** 卸载 */
onUnload(() => {
  uni.$off('erp:product:reload', getDetail)
})
</script>
