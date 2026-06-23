<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="自提门店详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <wd-cell-group border>
      <wd-cell title="门店名称" :value="formData.name || '-'" />
      <wd-cell title="联系电话" :value="formData.phone || '-'" />
      <wd-cell title="门店 Logo">
        <image
          v-if="formData.logo"
          :src="formData.logo"
          class="h-112rpx w-112rpx rounded-8rpx bg-[#f5f5f5]"
          mode="aspectFill"
        />
        <text v-else>-</text>
      </wd-cell>
      <wd-cell title="所在地区" :value="formData.areaName || '-'" />
      <wd-cell title="详细地址" :value="formData.detailAddress || '-'" />
      <wd-cell title="营业开始" :value="formData.openingTime || '-'" />
      <wd-cell title="营业结束" :value="formData.closingTime || '-'" />
      <wd-cell title="纬度" :value="formData.latitude != null ? String(formData.latitude) : '-'" />
      <wd-cell title="经度" :value="formData.longitude != null ? String(formData.longitude) : '-'" />
      <wd-cell title="核销员编号" :value="(formData.verifyUserIds || []).join('，') || '-'" />
      <wd-cell title="开启状态">
        <dict-tag v-if="formData.status != null" :type="DICT_TYPE.COMMON_STATUS" :value="formData.status" />
        <text v-else>-</text>
      </wd-cell>
      <wd-cell title="创建时间" :value="formatDateTime(formData.createTime) || '-'" />
    </wd-cell-group>

    <!-- 底部操作按钮 -->
    <view v-if="canUpdate || canDelete" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button v-if="canUpdate" class="flex-1" type="warning" @click="handleEdit">
          编辑
        </wd-button>
        <wd-button v-if="canDelete" class="flex-1" type="danger" :loading="deleting" @click="handleDelete">
          删除
        </wd-button>
        <wd-button v-if="canUpdate" class="flex-1" type="primary" @click="handleOpenBindStaff">
          绑定核销员
        </wd-button>
      </view>
    </view>

    <!-- 绑定核销员弹窗 -->
    <wd-popup
      v-model="bindStaffVisible"
      position="bottom"
      closable
      custom-style="border-radius: 24rpx 24rpx 0 0;"
      @close="bindStaffVisible = false"
    >
      <view class="p-24rpx">
        <view class="mb-24rpx text-32rpx text-[#333] font-semibold">
          绑定核销员
        </view>
        <wd-textarea
          v-model="bindStaffIds"
          clearable
          :maxlength="500"
          placeholder="多个核销员编号用逗号分隔"
        />
        <view class="mt-24rpx flex gap-20rpx">
          <wd-button class="flex-1" variant="plain" @click="bindStaffVisible = false">
            取消
          </wd-button>
          <wd-button class="flex-1" type="primary" :loading="binding" @click="handleBindStaff">
            确定
          </wd-button>
        </view>
      </view>
    </wd-popup>
  </view>
</template>

<script lang="ts" setup>
import type { DeliveryPickUpStore } from '@/api/mall/trade/delivery/pick-up-store'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import {
  bindDeliveryPickUpStoreStaff,
  deleteDeliveryPickUpStore,
  getDeliveryPickUpStore,
} from '@/api/mall/trade/delivery/pick-up-store'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'

const props = defineProps<{ id?: number | any }>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const dialog = useDialog()
const toast = useToast()
const formData = ref<DeliveryPickUpStore>({} as DeliveryPickUpStore) // 详情数据
const deleting = ref(false) // 删除状态
const bindStaffVisible = ref(false) // 绑定核销员弹窗
const bindStaffIds = ref('') // 绑定核销员编号（逗号分隔）
const binding = ref(false) // 绑定提交状态
const canUpdate = computed(() => hasAccessByCodes(['trade:delivery:pick-up-store:update']))
const canDelete = computed(() => hasAccessByCodes(['trade:delivery:pick-up-store:delete']))

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mall/trade/delivery/pick-up-store/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getDeliveryPickUpStore(Number(props.id))
  } finally {
    toast.close()
  }
}

/** 编辑 */
function handleEdit() {
  uni.navigateTo({ url: `/pages-mall/trade/delivery/pick-up-store/form/index?id=${props.id}` })
}

/** 删除 */
async function handleDelete() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: '确定要删除该自提门店吗？' })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteDeliveryPickUpStore(Number(props.id))
    toast.success('删除成功')
    uni.$emit('mall:delivery-pick-up-store:reload')
    setTimeout(() => handleBack(), 500)
  } finally {
    deleting.value = false
  }
}

/** 打开绑定核销员弹窗 */
function handleOpenBindStaff() {
  bindStaffIds.value = (formData.value.verifyUserIds || []).join(',')
  bindStaffVisible.value = true
}

/** 提交绑定核销员 */
async function handleBindStaff() {
  binding.value = true
  try {
    const verifyUserIds = String(bindStaffIds.value || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
      .map(Number)
    await bindDeliveryPickUpStoreStaff({ id: formData.value.id, verifyUserIds })
    toast.success('绑定成功')
    uni.$emit('mall:delivery-pick-up-store:reload')
    bindStaffVisible.value = false
    await getDetail()
  } finally {
    binding.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
  uni.$on('mall:delivery-pick-up-store:reload', getDetail)
})

/** 卸载 */
onUnload(() => {
  uni.$off('mall:delivery-pick-up-store:reload', getDetail)
})
</script>
