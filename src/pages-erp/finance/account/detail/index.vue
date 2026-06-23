<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar title="结算账户详情" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 详情内容 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-cell-group border>
        <wd-cell title="账户名称" :value="formData?.name || '-'" />
        <wd-cell title="账户编码" :value="formData?.no || '-'" />
        <wd-cell title="账户状态">
          <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="formData?.status" />
        </wd-cell>
        <wd-cell title="是否默认" :value="formData?.defaultStatus ? '是' : '否'" />
        <wd-cell title="排序" :value="formData?.sort ?? '-'" />
        <wd-cell title="备注" :value="formData?.remark || '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>

      <!-- 底部安全区域 -->
      <view class="h-160rpx" />
    </scroll-view>

    <!-- 底部操作按钮 -->
    <view v-if="hasFooter" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button v-if="canUpdate" class="flex-1" type="warning" @click="handleEdit">
          编辑
        </wd-button>
        <wd-button v-if="canSetDefault" class="flex-1" type="primary" :loading="defaultLoading" @click="handleSetDefault">
          设为默认
        </wd-button>
        <wd-button v-if="canDelete" class="flex-1" type="danger" :loading="deleting" @click="handleDelete">
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { Account } from '@/api/erp/finance/account'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref, watch } from 'vue'
import { useRouteQuery } from '@/hooks/useRouteQuery'
import { deleteAccount, getAccount, updateAccountDefaultStatus } from '@/api/erp/finance/account'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'

const props = defineProps<{ id?: number | any }>()
const { getRouteQueryNumber } = useRouteQuery(props, '/pages-erp/finance/account/detail/index')
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
const formData = ref<Account>() // 详情数据
const deleting = ref(false) // 删除状态
const defaultLoading = ref(false) // 默认状态修改状态
const canUpdate = computed(() => hasAccessByCodes(['erp:account:update']))
const canDelete = computed(() => hasAccessByCodes(['erp:account:delete']))
const canSetDefault = computed(() => canUpdate.value && !formData.value?.defaultStatus)
const hasFooter = computed(() => canUpdate.value || canDelete.value || canSetDefault.value)

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-erp/finance/account/index')
}

/** 加载结算账户详情 */
async function getDetail() {
  if (!currentId.value || deleting.value) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getAccount(Number(currentId.value))
  } finally {
    toast.close()
  }
}

/** 编辑结算账户 */
function handleEdit() {
  uni.navigateTo({ url: `/pages-erp/finance/account/form/index?id=${currentId.value}` })
}

/** 删除结算账户 */
async function handleDelete() {
  if (!currentId.value) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: '确定要删除该结算账户吗？' })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteAccount(Number(currentId.value))
    toast.success('删除成功')
    uni.$emit('erp:account:reload')
    setTimeout(() => handleBack(), 500)
  } finally {
    deleting.value = false
  }
}

/** 设为默认 */
async function handleSetDefault() {
  if (!currentId.value || !formData.value) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: `确定要设置“${formData.value.name || '该结算账户'}”为默认账户吗？` })
  } catch {
    return
  }
  defaultLoading.value = true
  try {
    await updateAccountDefaultStatus(Number(currentId.value), true)
    toast.success('设置成功')
    uni.$emit('erp:account:reload')
    await getDetail()
  } finally {
    defaultLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
  uni.$on('erp:account:reload', getDetail)
})

watch(currentId, () => {
  formData.value = undefined
  void getDetail()
})

/** 卸载 */
onUnload(() => {
  uni.$off('erp:account:reload', getDetail)
})
</script>
