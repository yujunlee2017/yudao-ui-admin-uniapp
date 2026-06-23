<template>
  <view v-if="hasActions" class="yd-detail-footer">
    <view class="yd-detail-footer-actions">
      <wd-button v-if="canUpdate" class="flex-1" type="warning" @click="emit('edit')">
        编辑
      </wd-button>
      <wd-button v-if="canDelete" class="flex-1" type="danger" :loading="deleting" @click="emit('delete')">
        删除
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  canUpdate?: boolean // 是否允许编辑
  canDelete?: boolean // 是否允许删除
  deleting?: boolean // 删除提交状态
}>(), {
  canUpdate: false,
  canDelete: false,
  deleting: false,
})

const emit = defineEmits<{
  edit: []
  delete: []
}>()

const hasActions = computed(() => props.canUpdate || props.canDelete)
</script>
