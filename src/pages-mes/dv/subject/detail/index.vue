<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="MES 点检项目详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-cell-group border>
        <wd-cell title="项目编码" :value="formData?.code || '-'" />
        <wd-cell title="项目名称" :value="formData?.name || '-'" />
        <wd-cell title="项目类型">
          <dict-tag v-if="formData?.type != null" :type="DICT_TYPE.MES_DV_SUBJECT_TYPE" :value="formData.type" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="项目内容" :value="formData?.content || '-'" />
        <wd-cell title="标准" :value="formData?.standard || '-'" />
        <wd-cell title="状态">
          <dict-tag v-if="formData?.status != null" :type="DICT_TYPE.COMMON_STATUS" :value="formData.status" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
        <wd-cell title="备注" :value="formData?.remark || '-'" />
      </wd-cell-group>
      <view class="h-160rpx" />
    </scroll-view>

    <!-- 底部操作按钮 -->
    <view v-if="hasFooter" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button
          v-if="hasAccessByCodes(['mes:dv-subject:update'])"
          class="flex-1" type="warning" @click="handleEdit"
        >
          编辑
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['mes:dv-subject:delete'])"
          class="flex-1" type="danger" :loading="deleting" @click="handleDelete"
        >
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { DvSubjectVO } from '@/api/mes/dv/subject'
import { onShow } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref, watch } from 'vue'
import { deleteSubject, getSubject } from '@/api/mes/dv/subject'
import { useAccess } from '@/hooks/useAccess'
import { useRouteQuery } from '@/hooks/useRouteQuery'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'

const props = defineProps<{
  id?: number | string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const dialog = useDialog()
const toast = useToast()
const { getRouteQueryNumber } = useRouteQuery(props, '/pages-mes/dv/subject/detail/index')
const currentId = computed(() => getRouteQueryNumber('id')) // 当前详情编号
const formData = ref<DvSubjectVO>() // 详情数据
const deleting = ref(false) // 删除状态
const hasFooter = computed(() => hasAccessByCodes(['mes:dv-subject:update']) || hasAccessByCodes(['mes:dv-subject:delete']))

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/dv/subject/index')
}

/** 加载详情 */
async function getDetail() {
  if (!currentId.value) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getSubject(currentId.value)
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

/** 编辑 */
function handleEdit() {
  uni.navigateTo({
    url: `/pages-mes/dv/subject/form/index?id=${currentId.value}`,
  })
}

/** 删除 */
async function handleDelete() {
  if (!currentId.value || !formData.value) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确定要删除「${formData.value.name || formData.value.code}」吗？`,
    })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteSubject(currentId.value)
    toast.success('删除成功')
    uni.$emit('mes:dv:subject:reload')
    delay(handleBack)
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

<style lang="scss" scoped>
</style>
