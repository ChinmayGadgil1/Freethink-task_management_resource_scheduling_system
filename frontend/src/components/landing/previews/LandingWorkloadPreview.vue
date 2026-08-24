<template>
  <div class="landing-workload-row row q-col-gutter-sm items-stretch">
    <!-- Card 1: Effort & Workload -->
    <div class="col-12 col-sm-6">
      <div class="preview-sub-card full-height">
        <div class="card-header row items-start justify-between no-wrap q-mb-sm">
          <div>
            <div class="card-title">Effort & Workload</div>
            <div class="card-subtitle">40h standard weekly capacity</div>
          </div>
          <span class="badge-pill bg-purple-pill">Allocated Effort</span>
        </div>

        <div class="effort-hero-display q-mt-sm">
          <div class="effort-big-number">40<span class="unit-text">h</span></div>

          <div class="effort-progress-block q-mt-xs">
            <div class="row justify-between q-mb-xs">
              <span class="stat-caption-bold">Effort consumed</span>
              <span class="stat-pct-text">70%</span>
            </div>
            <div class="progress-track">
              <div class="progress-fill fill-purple" style="width: 70%" />
            </div>
          </div>
        </div>

        <div class="stat-cells-grid q-mt-md">
          <div class="stat-cell stat-purple">
            <div class="cell-label">Active tasks</div>
            <div class="cell-value">6</div>
          </div>
          <div class="stat-cell stat-blue">
            <div class="cell-label">Actual effort</div>
            <div class="cell-value">28h</div>
          </div>
          <div class="stat-cell stat-mint">
            <div class="cell-label">Remaining effort</div>
            <div class="cell-value">12h</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Card 2: Task Overview -->
    <div class="col-12 col-sm-6">
      <div class="preview-sub-card full-height">
        <div class="card-header row items-center justify-between no-wrap q-mb-sm">
          <div>
            <div class="card-title">Task Overview</div>
            <div class="card-subtitle">Status distribution of assigned tasks</div>
          </div>
          <span class="badge-pill bg-grey-pill">16 Total</span>
        </div>

        <!-- Segmented bar -->
        <div class="segmented-bar-wrap">
          <div class="segmented-bar">
            <div class="segment seg-inprogress" style="width: 31.25%" />
            <div class="segment seg-scheduled" style="width: 18.75%" />
            <div class="segment seg-completed" style="width: 50%" />
          </div>
        </div>

        <!-- Status Legend List -->
        <div class="status-list q-mt-sm column q-gutter-y-xs">
          <div class="status-row row items-center justify-between">
            <div class="row items-center no-wrap gap-xs">
              <span class="status-dot dot-inprogress" />
              <span class="status-item-label">In Progress</span>
            </div>
            <div class="row items-center no-wrap gap-xs">
              <span class="status-item-val">5</span>
              <span class="status-item-pct">(31%)</span>
            </div>
          </div>

          <div class="status-row row items-center justify-between">
            <div class="row items-center no-wrap gap-xs">
              <span class="status-dot dot-scheduled" />
              <span class="status-item-label">Scheduled</span>
            </div>
            <div class="row items-center no-wrap gap-xs">
              <span class="status-item-val">3</span>
              <span class="status-item-pct">(19%)</span>
            </div>
          </div>

          <div class="status-row row items-center justify-between">
            <div class="row items-center no-wrap gap-xs">
              <span class="status-dot dot-completed" />
              <span class="status-item-label">Completed</span>
            </div>
            <div class="row items-center no-wrap gap-xs">
              <span class="status-item-val">8</span>
              <span class="status-item-pct">(50%)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts"></script>

<style scoped lang="scss">
.preview-sub-card {
  background: #ffffff;
  border: 1px solid #eaecef;
  border-radius: 14px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(16, 24, 40, 0.04);
}

.card-title {
  font-size: 14.5px;
  font-weight: 700;
  color: #1e293b;
  line-height: 1.2;
}

.card-subtitle {
  font-size: 11.5px;
  color: #64748b;
  margin-top: 2px;
}

.badge-pill {
  font-size: 10.5px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 9999px;

  &.bg-purple-pill {
    background: #8b6fd8;
    color: #ffffff;
  }
  &.bg-grey-pill {
    background: #f1f5f9;
    color: #475569;
  }
}

.effort-big-number {
  font-size: 26px;
  font-weight: 800;
  color: #1e293b;
  line-height: 1;

  .unit-text {
    font-size: 15px;
    font-weight: 600;
    color: #64748b;
    margin-left: 2px;
  }
}

.stat-caption-bold {
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
}

.stat-pct-text {
  font-size: 11.5px;
  font-weight: 800;
  color: #8b6fd8;
}

.progress-track {
  width: 100%;
  height: 7px;
  background: #f1f5f9;
  border-radius: 999px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 999px;

  &.fill-purple {
    background: #8b6fd8;
  }
}

.stat-cells-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.stat-cell {
  padding: 8px 10px;
  border-radius: 8px;
  text-align: center;

  &.stat-purple {
    background: #f5f3ff;
    .cell-value {
      color: #6b21a8;
    }
  }
  &.stat-blue {
    background: #eff6ff;
    .cell-value {
      color: #1d4ed8;
    }
  }
  &.stat-mint {
    background: #f0fdf4;
    .cell-value {
      color: #15803d;
    }
  }

  .cell-label {
    font-size: 10px;
    font-weight: 600;
    color: #64748b;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .cell-value {
    font-size: 14px;
    font-weight: 800;
    margin-top: 2px;
  }
}

/* Task Overview */
.segmented-bar-wrap {
  margin: 12px 0 14px 0;
}

.segmented-bar {
  display: flex;
  height: 9px;
  border-radius: 999px;
  overflow: hidden;
  background: #f1f5f9;
}

.segment {
  height: 100%;

  &.seg-inprogress {
    background: #2e90fa;
  }
  &.seg-scheduled {
    background: #8b6fd8;
    border-left: 2px solid #ffffff;
    border-right: 2px solid #ffffff;
  }
  &.seg-completed {
    background: #12b76a;
  }
}

.status-row {
  padding: 4px 0;
  font-size: 12px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;

  &.dot-inprogress {
    background: #2e90fa;
  }
  &.dot-scheduled {
    background: #8b6fd8;
  }
  &.dot-completed {
    background: #12b76a;
  }
}

.status-item-label {
  font-weight: 600;
  color: #334155;
}

.status-item-val {
  font-weight: 700;
  color: #1e293b;
}

.status-item-pct {
  color: #64748b;
}

body.body--dark {
  .preview-sub-card {
    background: #181d28;
    border-color: #283042;
  }

  .card-title {
    color: #f3f4f6;
  }

  .card-subtitle {
    color: #94a3b8;
  }

  .badge-pill {
    &.bg-grey-pill {
      background: #202636;
      color: #cbd5e1;
    }
  }

  .effort-big-number {
    color: #f3f4f6;

    .unit-text {
      color: #94a3b8;
    }
  }

  .stat-caption-bold {
    color: #cbd5e1;
  }

  .stat-pct-text {
    color: #a78bfa;
  }

  .progress-track {
    background: #283042;
  }

  .stat-cell {
    &.stat-purple {
      background: rgba(139, 111, 216, 0.14);
      .cell-label {
        color: #a78bfa;
      }
      .cell-value {
        color: #f3f4f6;
      }
    }
    &.stat-blue {
      background: rgba(59, 130, 246, 0.14);
      .cell-label {
        color: #60a5fa;
      }
      .cell-value {
        color: #f3f4f6;
      }
    }
    &.stat-mint {
      background: rgba(16, 185, 129, 0.14);
      .cell-label {
        color: #34d399;
      }
      .cell-value {
        color: #f3f4f6;
      }
    }
  }

  .segmented-bar {
    background: #283042;
  }

  .segment {
    &.seg-scheduled {
      border-left-color: #181d28;
      border-right-color: #181d28;
    }
  }

  .status-item-label {
    color: #cbd5e1;
  }

  .status-item-val {
    color: #f3f4f6;
  }

  .status-item-pct {
    color: #64748b;
  }
}
</style>
