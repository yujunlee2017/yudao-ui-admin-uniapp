<template>
  <view class="yd-page-container">
    <wd-navbar title="仓库详情" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-cell-group border>
        <wd-cell title="仓库编码" :value="formData?.code || '-'" />
        <wd-cell title="仓库名称" :value="formData?.name || '-'" />
        <wd-cell title="负责人" :value="formData?.chargeUserName || '-'" />
        <wd-cell title="仓库地址" :value="formData?.address || '-'" />
        <wd-cell title="面积" :value="formData?.area != null ? `${formData.area} ㎡` : '-'" />
        <wd-cell title="是否冻结" :value="formData?.frozen ? '是' : '否'" />
        <wd-cell title="备注" :value="formData?.remark || '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>
      <view class="h-160rpx" />
    </scroll-view>
    <view v-if="hasFooter" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button v-if="hasAccessByCodes(['mes:wm-warehouse:update'])" class="flex-1" type="warning" @click="handleEdit">
          编辑
        </wd-button>
        <wd-button v-if="hasAccessByCodes(['mes:wm-warehouse:delete'])" class="flex-1" type="danger" :loading="deleting" @click="handleDelete">
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { WmWarehouseVO } from '@/api/mes/wm/warehouse'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref, watch } from 'vue'
import { deleteWarehouse, getWarehouse } from '@/api/mes/wm/warehouse'
import { getSimpleUserList } from '@/api/system/user'
import { useAccess } from '@/hooks/useAccess'
import { useRouteQuery } from '@/hooks/useRouteQuery'
import { delay, navigateBackPlus } from '@/utils'
import { formatDateTime } from '@/utils/date'

const props = defineProps<{ id?: number | string }>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const dialog = useDialog()
const toast = useToast()
const { getRouteQueryNumber } = useRouteQuery(props, '/pages-mes/wm/warehouse/detail/index')
const currentId = computed(() => getRouteQueryNumber('id'))
const formData = ref<WmWarehouseVO>()
const deleting = ref(false)
const hasFooter = computed(() => hasAccessByCodes(['mes:wm-warehouse:update']) || hasAccessByCodes(['mes:wm-warehouse:delete']))

function handleBack() {
  navigateBackPlus('/pages-mes/wm/warehouse/index')
}

async function getDetail() {
  if (!currentId.value || deleting.value) {
    return
  }
  try {
    toast.loading('加载中...')
    const [data, users] = await Promise.all([
      getWarehouse(currentId.value),
      getSimpleUserList(),
    ])
    const chargeUser = users.find(user => user.id === data.chargeUserId)
    formData.value = { ...data, chargeUserName: chargeUser?.nickname || null }
  } finally {
    toast.close()
  }
}

async function initPage() {
  if (!currentId.value) {
    formData.value = undefined
    return
  }
  if (!formData.value || formData.value.id !== currentId.value) {
    await getDetail()
  }
}

function handleEdit() {
  uni.navigateTo({ url: `/pages-mes/wm/warehouse/form/index?id=${currentId.value}` })
}

async function handleDelete() {
  if (!currentId.value) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: '确定要删除该仓库吗？' })
  } catch {
    return
  }
  deleting.value = true
  try {
    toast.loading('删除中...')
    await deleteWarehouse(currentId.value)
    toast.close()
    toast.success('删除成功')
    uni.$emit('mes:wm:warehouse:reload')
    delay(handleBack)
  } catch {
    toast.close()
  } finally {
    deleting.value = false
  }
}

onMounted(() => {
  initPage()
  uni.$on('mes:wm:warehouse:reload', getDetail)
})

watch(currentId, () => {
  initPage()
})

onUnload(() => {
  uni.$off('mes:wm:warehouse:reload', getDetail)
})
</script>
