<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="(val) => emit('update:modelValue', val)"
  >
    <q-card class="dialog-card" :style="{ minWidth: minWidth, maxWidth: '90vw' }">
      <q-card-section class="row items-center q-pb-none">
        <q-avatar
          :icon="icon"
          :color="iconColor"
          text-color="white"
          size="36px"
          class="q-mr-sm"
        />
        <div>
          <div class="text-subtitle1 text-weight-bold text-dark">{{ title }}</div>
          <div v-if="subtitle" class="text-caption text-grey-6">{{ subtitle }}</div>
        </div>
      </q-card-section>

      <q-card-section class="q-pt-sm text-body2 text-grey-8">
        <slot>
          <template v-if="message">
            {{ message }}
          </template>
          <template v-else-if="targetName">
            Are you sure you want to proceed with <strong>"{{ targetName }}"</strong>?
          </template>
        </slot>
      </q-card-section>

      <q-card-actions align="right" class="q-pa-md q-pt-none">
        <q-btn
          v-close-popup
          flat
          no-caps
          :label="cancelLabel"
          color="grey-7"
          class="text-weight-medium"
          @click="emit('cancel')"
        />
        <q-btn
          unelevated
          no-caps
          :color="confirmColor"
          :label="confirmLabel"
          class="action-btn-primary"
          :loading="loading"
          @click="emit('confirm')"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
export interface ConfirmActionDialogProps {
  modelValue?: boolean;
  title: string;
  subtitle?: string;
  message?: string;
  targetName?: string;
  icon?: string;
  iconColor?: string;
  confirmLabel?: string;
  confirmColor?: string;
  cancelLabel?: string;
  loading?: boolean;
  minWidth?: string;
}

withDefaults(defineProps<ConfirmActionDialogProps>(), {
  modelValue: false,
  subtitle: 'This action cannot be undone',
  message: '',
  targetName: '',
  icon: 'delete_forever',
  iconColor: 'negative',
  confirmLabel: 'Confirm',
  confirmColor: 'negative',
  cancelLabel: 'Cancel',
  loading: false,
  minWidth: '380px',
});

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void;
  (e: 'confirm'): void;
  (e: 'cancel'): void;
}>();
</script>

<style scoped lang="scss">
.dialog-card {
  border-radius: 12px;
  background: var(--wo-bg-card, #ffffff);
}
</style>
