<template>
  <view class="yd-page-container">
    <wd-navbar title="供应商详情" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-cell-group border>
        <wd-cell title="供应商编码" :value="formData?.code || '-'" />
        <wd-cell title="供应商名称" :value="formData?.name || '-'" />
        <wd-cell title="供应商简称" :value="formData?.nickname || '-'" />
        <wd-cell title="英文名称" :value="formData?.englishName || '-'" />
        <wd-cell title="供应商等级">
          <dict-tag v-if="formData?.level" :type="DICT_TYPE.MES_VENDOR_LEVEL" :value="formData.level" /><text v-else>-</text>
        </wd-cell>
        <wd-cell title="供应商评分" :value="formData?.score ?? '-'" />
        <wd-cell title="供应商简介" :value="formData?.description || '-'" />
        <wd-cell title="供应商 LOGO">
          <wd-img v-if="formData?.logo" :src="formData.logo" width="96rpx" height="96rpx" radius="8rpx" mode="aspectFill" enable-preview />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="供应商地址" :value="formData?.address || '-'" />
        <wd-cell title="官网地址" :value="formData?.website || '-'" />
        <wd-cell title="邮箱地址" :value="formData?.email || '-'" />
        <wd-cell title="供应商电话" :value="formData?.telephone || '-'" />
        <wd-cell title="联系人1" :value="formData?.contact1Name || '-'" />
        <wd-cell title="联系人1-电话" :value="formData?.contact1Telephone || '-'" />
        <wd-cell title="联系人1-邮箱" :value="formData?.contact1Email || '-'" />
        <wd-cell title="联系人2" :value="formData?.contact2Name || '-'" />
        <wd-cell title="联系人2-电话" :value="formData?.contact2Telephone || '-'" />
        <wd-cell title="联系人2-邮箱" :value="formData?.contact2Email || '-'" />
        <wd-cell title="信用代码" :value="formData?.creditCode || '-'" />
        <wd-cell title="状态">
          <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="formData?.status" />
        </wd-cell>
        <wd-cell title="备注" :value="formData?.remark || '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>
      <VendorItemReceiptList :vendor-id="currentId" />
      <view class="h-160rpx" />
    </scroll-view>
    <MesFooterActions v-if="hasAccessByCodes(['mes:md-vendor:update']) || hasAccessByCodes(['mes:md-vendor:delete'])" content-class="yd-detail-footer-actions">
      <wd-button v-if="hasAccessByCodes(['mes:md-vendor:update'])" class="flex-1" type="warning" @click="handleEdit">
        编辑
      </wd-button>
      <wd-button v-if="hasAccessByCodes(['mes:md-vendor:delete'])" class="flex-1" type="danger" :loading="deleting" @click="handleDelete">
        删除
      </wd-button>
    </MesFooterActions>
  </view>
</template>

<script lang="ts" setup>
import type { MdVendorVO } from '@/api/mes/md/vendor'
import { onShow, onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref, watch } from 'vue'
import { deleteVendor, getVendor } from '@/api/mes/md/vendor'
import { useAccess } from '@/hooks/useAccess'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import MesFooterActions from '@/pages-mes/components/mes-footer-actions.vue'
import VendorItemReceiptList from '../components/vendor-item-receipt-list.vue'

const props = defineProps<{ id?: number | string }>()
definePage({ style: { navigationBarTitleText: '', navigationStyle: 'custom' } })
const { hasAccessByCodes } = useAccess()
const dialog = useDialog()
const toast = useToast()
const formData = ref<MdVendorVO>()
const currentId = computed(() => props.id ? Number(props.id) : undefined)
const deleting = ref(false)

function handleBack() {
  navigateBackPlus('/pages-mes/md/vendor/index')
}

async function getDetail() {
  if (!currentId.value || deleting.value) {
    return
  }
  try {
    toast.loading('加载中...')
    const detailData = await getVendor(currentId.value)
    if (!detailData) {
      uni.showToast({ icon: 'none', title: '详情不存在，已返回列表' })
      delay(handleBack)
      return
    }
    formData.value = detailData
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
  uni.navigateTo({ url: `/pages-mes/md/vendor/form/index?id=${currentId.value}` })
}

async function handleDelete() {
  if (!currentId.value) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: '确定要删除该供应商吗？' })
  } catch {
    return
  }
  deleting.value = true
  try {
    toast.loading('删除中...')
    await deleteVendor(currentId.value)
    toast.close()
    toast.success('删除成功')
    uni.$emit('mes:md:vendor:reload')
    delay(handleBack)
  } catch {
    toast.close()
  } finally {
    deleting.value = false
  }
}

onMounted(() => {
  initPage()
  uni.$on('mes:md:vendor:reload', getDetail)
})

onShow(() => {
  initPage()
})

watch(currentId, () => {
  initPage()
})

onUnload(() => {
  uni.$off('mes:md:vendor:reload', getDetail)
})
</script>
