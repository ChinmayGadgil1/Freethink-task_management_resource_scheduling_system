<template>
  <div class="print-only-report">
    <!-- Header Block -->
    <div class="print-header">
      <div class="print-header-top">
        <div>
          <div class="print-brand-name">FREETHINK</div>
          <div class="print-brand-sub">Project Management &amp; Resource Scheduling System</div>
        </div>
        <div class="print-meta-col">
          <div><strong>Generated:</strong> {{ generatedAt }}</div>
          <div><strong>Classification:</strong> Internal Project Report</div>
        </div>
      </div>

      <div class="print-title-row">
        <h1 class="print-doc-title">{{ title }}</h1>
      </div>

      <!-- Active Filters / Scope Metadata -->
      <div class="print-filters-panel">
        <div class="print-meta-heading">REPORT PARAMETERS &amp; ACTIVE FILTERS</div>
        <div class="print-filters-grid">
          <div v-for="f in filters" :key="f.label" class="print-filter-cell">
            <span class="print-filter-label">{{ f.label }}:</span>
            <span class="print-filter-val">{{ f.value }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Executive Summary Block -->
    <div v-if="summaryMetrics && summaryMetrics.length > 0" class="print-section">
      <div class="print-section-title">EXECUTIVE SUMMARY</div>
      <div class="print-summary-grid">
        <div
          v-for="m in summaryMetrics"
          :key="m.label"
          class="print-kpi-box"
          :class="m.color && !m.color.startsWith('#') ? `kpi-${m.color}` : ''"
        >
          <div
            class="print-kpi-val"
            :style="m.color && m.color.startsWith('#') ? { color: m.color } : {}"
          >
            {{ m.value }}
          </div>
          <div class="print-kpi-lbl">{{ m.label }}</div>
          <div v-if="m.helper" class="print-kpi-sub">{{ m.helper }}</div>
        </div>
      </div>
    </div>

    <!-- Detailed Content / Table Slot -->
    <div class="print-section">
      <div class="print-section-title">DETAILED REPORT DATA</div>
      <slot />
    </div>

    <!-- Notes & Disclaimers Block -->
    <div v-if="notes && notes.length > 0" class="print-section print-notes-container">
      <div class="print-section-title">AUDIT &amp; METHODOLOGY NOTES</div>
      <div class="print-notes-list">
        <div v-for="(n, idx) in notes" :key="idx" class="print-note-item">&bull; {{ n }}</div>
      </div>
    </div>

    <!-- Document Footer -->
    <div class="print-doc-footer">
      <div>Freethink &bull; Project Management &amp; Resource Scheduling System</div>
      <div>Confidential &bull; Generated {{ generatedAt }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

export interface ReportFilterMeta {
  label: string;
  value: string;
}

export interface SummaryMetricMeta {
  label: string;
  value: string | number;
  color?: string | undefined;
  helper?: string | undefined;
}

defineProps<{
  title: string;
  filters: ReportFilterMeta[];
  summaryMetrics?: SummaryMetricMeta[];
  notes?: string[];
}>();

const generatedAt = computed(() => {
  const now = new Date();
  return now.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
});
</script>

<style scoped>
/* Screen Display: Completely Hidden */
.print-only-report {
  display: none;
}

@media print {
  .print-only-report {
    display: block !important;
    color: #111827 !important;
    background: #ffffff !important;
  }

  .print-header {
    border-bottom: 2px solid #111827;
    padding-bottom: 12px;
    margin-bottom: 16px;
  }

  .print-header-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 10px;
  }

  .print-brand-name {
    font-size: 18px;
    font-weight: 800;
    letter-spacing: 0.5px;
    color: #4f46e5;
  }

  .print-brand-sub {
    font-size: 10px;
    color: #4b5563;
    margin-top: 1px;
  }

  .print-meta-col {
    text-align: right;
    font-size: 10px;
    color: #4b5563;
    line-height: 1.4;
  }

  .print-title-row {
    margin: 8px 0 12px 0;
  }

  .print-doc-title {
    font-size: 20px;
    font-weight: 800;
    color: #111827;
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .print-filters-panel {
    background-color: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 4px;
    padding: 8px 12px;
    margin-top: 8px;
  }

  .print-meta-heading {
    font-size: 9px;
    font-weight: 700;
    color: #6b7280;
    letter-spacing: 0.5px;
    margin-bottom: 6px;
  }

  .print-filters-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 12px 24px;
  }

  .print-filter-cell {
    font-size: 11px;
  }

  .print-filter-label {
    font-weight: 600;
    color: #4b5563;
    margin-right: 4px;
  }

  .print-filter-val {
    font-weight: 700;
    color: #111827;
  }

  .print-section {
    margin-top: 16px;
    page-break-inside: auto;
  }

  .print-section-title {
    font-size: 11px;
    font-weight: 800;
    color: #374151;
    letter-spacing: 0.5px;
    border-bottom: 1px solid #d1d5db;
    padding-bottom: 4px;
    margin-bottom: 10px;
  }

  .print-summary-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
    margin-bottom: 8px;
  }

  .print-kpi-box {
    border: 1px solid #e5e7eb;
    border-radius: 4px;
    background-color: #f9fafb;
    padding: 8px 10px;
    text-align: center;
  }

  .print-kpi-val {
    font-size: 18px;
    font-weight: 800;
    color: #111827;
  }

  .print-kpi-lbl {
    font-size: 10px;
    font-weight: 600;
    color: #4b5563;
    margin-top: 2px;
    text-transform: uppercase;
  }

  .print-kpi-sub {
    font-size: 9px;
    color: #6b7280;
    margin-top: 2px;
  }

  .kpi-positive .print-kpi-val {
    color: #059669;
  }

  .kpi-negative .print-kpi-val {
    color: #dc2626;
  }

  .kpi-warning .print-kpi-val {
    color: #d97706;
  }

  .kpi-info .print-kpi-val {
    color: #2563eb;
  }

  .kpi-primary .print-kpi-val {
    color: #4f46e5;
  }

  .print-notes-container {
    margin-top: 20px;
    page-break-inside: avoid;
  }

  .print-notes-list {
    background-color: #f9fafb;
    border-left: 3px solid #6b7280;
    padding: 8px 12px;
    font-size: 10px;
    color: #374151;
    line-height: 1.5;
  }

  .print-note-item {
    margin-bottom: 4px;
  }
  .print-note-item:last-child {
    margin-bottom: 0;
  }

  .print-doc-footer {
    border-top: 1px solid #d1d5db;
    margin-top: 24px;
    padding-top: 8px;
    display: flex;
    justify-content: space-between;
    font-size: 9px;
    color: #6b7280;
    page-break-inside: avoid;
  }
}
</style>
