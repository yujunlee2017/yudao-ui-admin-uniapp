<template>
  <view class="mt-24rpx bg-white">
    <!-- 关联商机标题栏 -->
    <view class="flex items-center justify-between border-b border-[#f5f5f5] px-24rpx py-20rpx">
      <text class="text-30rpx text-[#333] font-semibold">关联商机</text>
      <CrmPicker
        v-if="canAdd"
        source="business"
        :params="{ customerId }"
        use-default-slot
        @confirm="handleAdd"
      >
        <wd-button size="small" type="primary">
          关联
        </wd-button>
      </CrmPicker>
    </view>

    <!-- 关联商机列表 -->
    <view
      v-for="business in list"
      :key="business.id"
      class="flex items-center justify-between border-b border-[#f5f5f5] px-24rpx py-20rpx"
    >
      <view class="min-w-0 flex-1">
        <view class="line-clamp-1 text-28rpx text-[#333] font-semibold">
          {{ business.name || '-' }}
        </view>
        <view class="mt-6rpx text-24rpx text-[#999]">
          金额：{{ formatMoney(business.totalPrice) }}
          <text v-if="business.statusName" class="ml-16rpx">阶段：{{ business.statusName }}</text>
        </view>
      </view>
      <wd-button
        v-if="canRemove"
        size="small"
        type="danger"
        variant="plain"
        @click="handleRemove(business)"
      >
        解除
      </wd-button>
    </view>

    <!-- 空状态 -->
    <wd-empty v-if="list.length === 0" icon="content" tip="暂无关联商机" />
  </view>
</template>

<script lang="ts" setup>
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref, watch } from 'vue'
import { getBusinessPageByContact } from '@/api/crm/business'
import { createContactBusinessList, deleteContactBusinessList } from '@/api/crm/contact'
import { useAccess } from '@/hooks/useAccess'
import { formatMoney } from '@/utils/format'
import CrmPicker from '@/pages-crm/components/crm-picker.vue'

interface PickerOption {
  id: number | string
  name: string
  raw?: Record<string, any>
}

const props = defineProps<{
  contactId: number
  customerId?: number
}>()

const { hasAccessByCodes } = useAccess()
const toast = useToast()
const dialog = useDialog()
const list = ref<Record<string, any>[]>([]) // 关联商机列表
const canAdd = computed(() => hasAccessByCodes(['crm:contact:create-business'])) // 关联权限
const canRemove = computed(() => hasAccessByCodes(['crm:contact:delete-business'])) // 解除权限

/** 加载关联商机 */
async function loadList() {
  if (!props.contactId) {
    return
  }
  try {
    const data = await getBusinessPageByContact({ pageNo: 1, pageSize: 100, contactId: props.contactId })
    list.value = data.list || []
  } catch {
    list.value = []
  }
}

/** 关联商机 */
async function handleAdd(option?: PickerOption) {
  const businessId = Number(option?.id)
  if (!businessId) {
    return
  }
  if (list.value.some(item => Number(item.id) === businessId)) {
    toast.show('该商机已关联')
    return
  }
  await createContactBusinessList({ contactId: props.contactId, businessIds: [businessId] })
  toast.success('关联成功')
  loadList()
}

/** 解除关联 */
async function handleRemove(business: Record<string, any>) {
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确定解除与商机【${business.name || ''}】的关联吗？`,
    })
  } catch {
    return
  }
  await deleteContactBusinessList({ contactId: props.contactId, businessIds: [Number(business.id)] })
  toast.success('解除成功')
  loadList()
}

watch(() => props.contactId, loadList)

/** 初始化 */
onMounted(() => {
  loadList()
})
</script>
