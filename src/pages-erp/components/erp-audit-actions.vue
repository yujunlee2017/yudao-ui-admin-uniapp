<!-- ERP 单据详情底部操作：统一编辑、审批/反审批、删除按钮展示 -->
<!-- TODO @AI：每个模块自己写，不做这种统一的； -->
<template>
  <view v-if="visible" class="yd-detail-footer">
    <view class="yd-detail-footer-actions">
      <wd-button v-if="canUpdate" class="flex-1" type="warning" @click="emit('edit')">
        编辑
      </wd-button>
      <wd-button v-if="canUpdateStatus" class="flex-1" type="primary" :loading="statusLoading" @click="emit('update-status', nextStatus)">
        {{ nextStatus === approvedStatus ? '审批' : '反审批' }}
      </wd-button>
      <wd-button v-if="canDelete" class="flex-1" type="danger" :loading="deleting" @click="emit('delete')">
        删除
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
// TODO @Yunai：审批状态魔法数字。本组件 nextStatus/approvedStatus 默认值 20，以及 13 个单据详情页传入的 10/20，
// 均应改用新建的 ErpAuditStatusEnum（见 utils/constants/biz-erp-enum.ts，参考 biz-system-enum.ts 的 CommonStatusEnum 写法）：
//   export const ErpAuditStatusEnum = { UNAUDITED: 10, AUDITED: 20 }
// 对应后端字典 erp_audit_status（10=未审批、20=已审批）。
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  canUpdate?: boolean
  canUpdateStatus?: boolean
  canDelete?: boolean
  deleting?: boolean
  statusLoading?: boolean
  nextStatus?: number
  approvedStatus?: number
}>(), {
  canUpdate: false,
  canUpdateStatus: false,
  canDelete: false,
  deleting: false,
  statusLoading: false,
  nextStatus: 20,
  approvedStatus: 20,
})

const emit = defineEmits<{
  'edit': []
  'update-status': [status: number]
  'delete': []
}>()

const visible = computed(() => props.canUpdate || props.canUpdateStatus || props.canDelete)
</script>
