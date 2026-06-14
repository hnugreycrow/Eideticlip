<script setup lang="ts">
import { computed } from "vue";
import { useClipboardStore } from "@/stores/clipboardStore";
import { storeToRefs } from "pinia";

const clipboardStore = useClipboardStore();
const { activeFilter, typeCounts } = storeToRefs(clipboardStore);

interface FilterOption {
  key: "all" | "text" | "url" | "code" | "favorite";
  label: string;
}

const filters: FilterOption[] = [
  { key: "all", label: "全部" },
  { key: "text", label: "文本" },
  { key: "url", label: "链接" },
  { key: "code", label: "代码" },
  { key: "favorite", label: "收藏" },
];

const itemsWithCount = computed(() =>
  filters.map((f) => ({ ...f, count: typeCounts.value[f.key] ?? 0 }))
);

const selectFilter = (key: FilterOption["key"]) => {
  if (activeFilter.value === key) return;
  clipboardStore.activeFilter = key;
};
</script>

<template>
  <div class="filter-sidebar">
    <div class="filter-title">分类</div>
    <button
      v-for="item in itemsWithCount"
      :key="item.key"
      class="filter-item"
      :class="{ active: activeFilter === item.key }"
      @click="selectFilter(item.key)"
    >
      <el-icon class="filter-icon">
        <i-ep-Menu v-if="item.key === 'all'" />
        <i-ep-Document v-else-if="item.key === 'text'" />
        <i-ep-Link v-else-if="item.key === 'url'" />
        <i-ep-Tickets v-else-if="item.key === 'code'" />
        <i-ep-Star v-else-if="item.key === 'favorite'" />
      </el-icon>
      <span class="filter-label">{{ item.label }}</span>
      <span class="filter-count">{{ item.count }}</span>
    </button>
  </div>
</template>

<style lang="scss" scoped>
.filter-sidebar {
  width: var(--filter-sidebar-width, 180px);
  flex-shrink: 0;
  height: 100%;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-light);
  display: flex;
  flex-direction: column;
  padding: 14px 10px;
  gap: 4px;
  overflow-y: auto;
}

.filter-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 4px 10px 8px;
}

.filter-item {
  width: 100%;
  height: 36px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 10px;
  border: none;
  background: transparent;
  border-radius: 8px;
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.18s ease;
  text-align: left;
  position: relative;

  &:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
  }

  &.active {
    background: var(--bg-active);
    color: var(--accent-primary);
    font-weight: 500;
  }
}

.filter-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.filter-label {
  flex: 1;
  min-width: 0;
}

.filter-count {
  font-size: 12px;
  color: var(--text-tertiary);
  font-variant-numeric: tabular-nums;
  font-weight: 500;
  flex-shrink: 0;
}

.filter-item.active .filter-count {
  color: var(--accent-primary);
}
</style>
