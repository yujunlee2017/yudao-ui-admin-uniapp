<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar title="缺陷类型详情" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 详情内容 -->
    <view>
      <wd-cell-group border>
        <wd-cell title="缺陷编码" :value="formData?.code || '-'" />
        <wd-cell title="缺陷描述" :value="formData?.name || '-'" />
        <wd-cell title="检测项类型">
          <dict-tag v-if="formData?.type != null" :type="DICT_TYPE.MES_INDICATOR_TYPE" :value="formData.type" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="缺陷等级">
          <dict-tag v-if="formData?.level != null" :type="DICT_TYPE.MES_DEFECT_LEVEL" :value="formData.level" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="备注" :value="formData?.remark || '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
        <wd-cell title="编号" :value="formData?.id ? String(formData.id) : '-'" />
      </wd-cell-group>
    </view>

    <!-- 底部操作按钮 -->
    <view class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button
          v-if="hasAccessByCodes(['mes:qc-defect:update'])"
          class="flex-1"
          type="warning"
          @click="handleEdit"
        >
          编辑
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['mes:qc-defect:delete'])"
          class="flex-1"
          type="danger"
          :loading="deleting"
          @click="handleDelete"
        >
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { QcDefectVO } from '@/api/mes/qc/defect'
import { onShow } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref, watch } from 'vue'
import { deleteDefect, getDefect } from '@/api/mes/qc/defect'
import { useAccess } from '@/hooks/useAccess'
import { useRouteQuery } from '@/hooks/useRouteQuery'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
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
const { getRouteQueryNumber } = useRouteQuery(props, '/pages-mes/qc/defect/detail/index')
const formData = ref<QcDefectVO>() // 详情数据
const deleting = ref(false) // 删除状态
const currentId = computed(() => getRouteQueryNumber('id')) // 当前详情编号

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/qc/defect/index')
}

/** 加载详情 */
async function getDetail() {
  if (!currentId.value) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getDefect(currentId.value)
  } finally {
    toast.close()
  }
}

/** 初始化页面数据 */
async function initPage() {
  if (!currentId.value) {
    formData.value = undefined
    return
  }
  if (!formData.value || formData.value.id !== currentId.value) {
    await getDetail()
  }
}

/** 编辑缺陷类型 */
function handleEdit() {
  uni.navigateTo({ url: `/pages-mes/qc/defect/form/index?id=${currentId.value}` })
}

/** 删除缺陷类型 */
async function handleDelete() {
  if (!currentId.value) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确定要删除该缺陷类型吗？删除后将无法恢复。',
    })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteDefect(currentId.value)
    toast.success('删除成功')
    uni.$emit('mes:qc:defect:reload')
    setTimeout(() => handleBack(), 500)
  } finally {
    deleting.value = false
  }
}

/** 初始化 */
onMounted(() => {
  initPage()
})

onShow(() => {
  initPage()
})

watch(currentId, () => {
  initPage()
})
</script>
