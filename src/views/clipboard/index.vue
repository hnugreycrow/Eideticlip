<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, onActivated } from "vue";
import DetailPanel from "./components/DetailPanel.vue";
import { ClipboardItem } from "@/utils/type";
import { formatTime, getTypeLabel, truncateText } from "@/utils/utils";
import { useSearch } from "./composables/useSearch";
import { useVirtualScroll } from "./composables/useVirtualScroll";
import { useSelection } from "./composables/useSelection";
import { useClipboardStore } from "@/stores/clipboardStore";
import { storeToRefs } from "pinia";

// 定义组件名称，用于keep-alive识别
defineOptions({
  name: "clipboard",
});

const clipboardStore = useClipboardStore();
const { clipboardData, isLoadingMore, activeFilter, totalItems, currentPage } =
  storeToRefs(clipboardStore);

// 搜索功能
const { searchQuery, filteredData } = useSearch(() => clipboardData.value);

// 选择功能
const {
  selectedIds,
  isSelectionMode,
  isAllSelected,
  isIndeterminate,
  selectedCount,
  toggleSelectionMode,
  toggleItemSelection,
  toggleSelectAll,
} = useSelection(() => filteredData.value);

// 虚拟滚动
const { contentListRef, virtualScroll, visibleItems, handleScroll } =
  useVirtualScroll(() => filteredData.value);

const selectedItem = ref<ClipboardItem | null>(null);
const clipboardWatcherActive = ref(true); // 默认开启剪贴板监听
let clipboardWatcherCleanup: (() => void) | null = null; // 剪贴板监听清理函数

// 监听类型过滤器变化，重新加载数据
watch(activeFilter, (newType) => {
  // 切换类型时，重置页码并重新加载数据
  currentPage.value = 1;
  clipboardStore.loadClipboardHistory(1, false, newType);
});

const isOpen = ref(false);

/**
 * 选择剪贴板项目
 * @param {ClipboardItem} item - 待选择的项目
 * @returns {void}
 */
const selectItem = (item: ClipboardItem) => {
  selectedItem.value = item;
  isOpen.value = true;
};

/**
 * 关闭详情面板
 * @returns {void}
 */
const closeDetail = () => {
  selectedItem.value = null;
  isOpen.value = false;
};

/**
 * 切换收藏状态
 * @param {ClipboardItem} item - 待切换收藏状态的项目
 * @param {Event} [event] - 可选的事件对象，用于阻止事件冒泡
 * @returns {void}
 */
const toggleFavorite = (item: ClipboardItem, event?: Event) => {
  if (event) event.stopPropagation();
  const newStatus = !item.is_favorite;

  window.clipboard
    .setFavorite(item.id, newStatus)
    .then((success) => {
      if (success) {
        // 更新本地状态
        item.is_favorite = newStatus;
        ElMessage({
          message: newStatus ? "已添加到收藏" : "已取消收藏",
          type: newStatus ? "success" : "info",
        });
      } else {
        console.error("设置收藏状态失败");
        ElMessage({
          message: "操作失败",
          type: "error",
        });
      }
    })
    .catch((error) => {
      console.error("设置收藏状态出错:", error);
      ElMessage({
        message: "操作失败",
        type: "error",
      });
    });
};

/**
 * 复制项目内容到剪贴板
 * @param {ClipboardItem} item - 待复制的项目
 * @param {Event} [event] - 可选的事件对象，用于阻止事件冒泡
 * @returns {void}
 */
const copyItem = (item: ClipboardItem, event?: Event) => {
  if (event) event.stopPropagation();
  window.clipboard
    .write(item.content)
    .then(() => {
      ElMessage({
        message: "复制成功",
        type: "primary",
      });
    })
    .catch((error) => {
      console.error("复制失败:", error);
      ElMessage({
        message: "复制失败",
        type: "error",
      });
    });
};

/**
 * 启动剪贴板监听
 * @returns {void}
 */
const startClipboardWatcher = () => {
  // 如果已经有监听清理函数，说明监听已经启动，不需要重新启动
  if (clipboardWatcherCleanup) {
    console.log("剪贴板监听已经在运行中，无需重新启动");
    return;
  }

  // 启动监听
  window.clipboard
    .startWatching()
    .then(() => {
      // 设置变化回调
      clipboardWatcherCleanup = window.clipboard.onChanged(async (content) => {
        if (content && content.trim() !== "") {
          await clipboardStore.addClipboardItem(truncateText(content, 3000));
        }
      });
    })
    .catch((error) => {
      console.error("启动剪贴板监听失败:", error);
    });
};

/**
 * 停止剪贴板监听
 * @returns {void}
 */
const stopClipboardWatcher = () => {
  // 停止监听
  if (clipboardWatcherCleanup) {
    clipboardWatcherCleanup();
    clipboardWatcherCleanup = null;

    window.clipboard
      .stopWatching()
      .then(() => {
        console.log("剪贴板监听已停止");
      })
      .catch((error) => {
        console.error("停止剪贴板监听失败:", error);
      });
  }
};

// 组件挂载时启动监听，加载历史记录，卸载时停止监听
onMounted(() => {
  // 加载历史记录（只加载第一页）
  clipboardStore.loadClipboardHistory(1, false, activeFilter.value);
  // 启动剪贴板监听
  startClipboardWatcher();

  setTimeout(() => {
    // 初始化滚动参数
    handleScroll();
  }, 100);

  window.addEventListener("resize", handleScroll);
});

onUnmounted(() => {
  console.log("组件卸载");
  stopClipboardWatcher();
  window.removeEventListener("resize", handleScroll);
});

onActivated(() => {
  // 调用时机为首次挂载
  // 以及每次从缓存中被重新插入时
  handleScroll();
});

// 导出数据
const exportData = () => {
  const data = JSON.stringify(clipboardData.value, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `clipboard-${new Date().toISOString().split("T")[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  // 这里可以添加导出成功的提示
};

/**
 * 批量删除选中的项目
 */
const deleteBatchItems = () => {
  if (selectedIds.value.size === 0) {
    ElMessage({
      message: "请先选择要删除的项目",
      type: "warning",
    });
    return;
  }

  ElMessageBox.confirm(
    `确定要删除选中的 ${selectedIds.value.size} 个项目吗？`,
    "批量删除确认",
    {
      confirmButtonText: "确认删除",
      cancelButtonText: "取消",
      type: "warning",
    }
  ).then(() => {
    const idsToDelete = Array.from(selectedIds.value);

    // 先从本地数据中移除
    const deletedItems = [];
    for (let i = clipboardData.value.length - 1; i >= 0; i--) {
      const item = clipboardData.value[i];
      if (selectedIds.value.has(item.id)) {
        deletedItems.push(clipboardData.value.splice(i, 1)[0]);
      }
    }

    // 更新总数
    totalItems.value -= deletedItems.length;

    // 清空选中状态
    selectedIds.value.clear();

    // 如果当前选中的项目被删除，清空选中
    if (selectedItem.value && idsToDelete.includes(selectedItem.value.id)) {
      selectedItem.value = null;
    }

    ElMessage({
      message: `已删除 ${deletedItems.length} 个项目`,
      type: "success",
    });

    // 调用后端批量删除
    window.clipboard
      .deleteBatch(idsToDelete)
      .then((result) => {
        if (!result.success && result.failedIds.length > 0) {
          console.error("部分项目删除失败:", result.failedIds);
          // 如果有删除失败的项目，重新加载数据以保持一致性
          clipboardStore.loadClipboardHistory();
          ElMessage({
            message: `${result.failedIds.length} 个项目删除失败，已重新加载数据`,
            type: "warning",
          });
        }
      })
      .catch((error) => {
        console.error("批量删除出错:", error);
        // 发生错误时重新加载数据以保持一致性
        clipboardStore.loadClipboardHistory();
        ElMessage({
          message: "删除失败，已重新加载数据",
          type: "error",
        });
      });
  });
};
</script>

<template>
  <div class="main-content">
    <div class="content-container">
      <!-- 内容头部 -->
      <div class="content-header">
        <div class="header-left">
          <h1 class="header-title">剪贴板历史</h1>
          <span class="header-stats"
            >共 {{ totalItems }} 条记录 (已加载
            {{ clipboardData.length }} 条)</span
          >
        </div>
        <div class="header-actions">
          <el-tooltip content="停止/启动自动监听剪贴板" placement="top">
            <el-switch
              v-model="clipboardWatcherActive"
              @change="
                clipboardWatcherActive
                  ? startClipboardWatcher()
                  : stopClipboardWatcher()
              "
              active-text="监听中"
              inactive-text="已停止"
              inline-prompt
            />
          </el-tooltip>

          <!-- 批量操作区域 -->
          <template v-if="isSelectionMode">
            <div class="batch-actions">
              <el-checkbox
                :model-value="isAllSelected"
                :indeterminate="isIndeterminate"
                @change="toggleSelectAll"
              >
                全选 ({{ selectedCount }})
              </el-checkbox>
              <el-button
                class="action-btn"
                :disabled="selectedCount === 0"
                @click="deleteBatchItems"
              >
                <i-ep-delete class="el-icon--left" /> 删除选中 ({{
                  selectedCount
                }})
              </el-button>
              <el-button class="action-btn" @click="toggleSelectionMode">
                取消
              </el-button>
            </div>
          </template>
          <template v-else>
            <el-button class="action-btn" @click="toggleSelectionMode">
              <i-ep-select class="el-icon--left" /> 批量选择
            </el-button>
            <el-dropdown trigger="click">
              <el-button>
                更多<el-icon class="el-icon--right"
                  ><i-ep-arrow-down
                /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="clipboardStore.clearAll">
                    <i-ep-delete class="el-icon--left" />清空
                  </el-dropdown-item>
                  <el-dropdown-item @click="exportData">
                    <i-ep-upload class="el-icon--left" />导出
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </div>
      </div>

      <!-- 搜索区域 -->
      <div class="search-container">
        <div class="search-box">
          <i-ep-search class="search-icon" />
          <el-input
            v-model="searchQuery"
            class="search-input"
            placeholder="搜索剪切板内容..."
          />
        </div>
        <div class="search-filters">
          <span
            class="filter-tag"
            :class="{ active: activeFilter === 'all' }"
            @click="activeFilter = 'all'"
            ><i-ep-Menu></i-ep-Menu> 全部</span
          >
          <span
            class="filter-tag"
            :class="{ active: activeFilter === 'text' }"
            @click="activeFilter = 'text'"
            ><i-ep-Document></i-ep-Document> 文本</span
          >
          <span
            class="filter-tag"
            :class="{ active: activeFilter === 'url' }"
            @click="activeFilter = 'url'"
            ><i-ep-Link></i-ep-Link> 链接</span
          >
          <span
            class="filter-tag"
            :class="{ active: activeFilter === 'code' }"
            @click="activeFilter = 'code'"
            ><i-ep-Tickets></i-ep-Tickets> 代码</span
          >
          <span
            class="filter-tag"
            :class="{ active: activeFilter === 'favorite' }"
            @click="activeFilter = 'favorite'"
            ><i-ep-star></i-ep-star> 收藏</span
          >
          <!-- <span
            class="filter-tag"
            :class="{ active: activeFilter === 'image' }"
            @click="activeFilter = 'image'"
            >图片</span
          > -->
        </div>
      </div>

      <!-- 内容列表 -->
      <div class="content-list" ref="contentListRef" @scroll="handleScroll">
        <template v-if="clipboardData.length === 0">
          <div class="empty-state">
            <i-ep-Document-Copy class="empty-icon" />
            <div class="empty-title">暂无记录</div>
            <div class="empty-desc">开始复制内容，它们会出现在这里</div>
          </div>
        </template>
        <template v-else>
          <!-- 虚拟滚动占位元素，撑开滚动区域 -->
          <div
            class="virtual-scroll-placeholder"
            :style="{ height: `${virtualScroll.totalHeight}px` }"
          ></div>

          <!-- 可见项目容器，使用绝对定位 -->
          <div
            class="virtual-scroll-content"
            :style="{
              transform: `translateY(${
                virtualScroll.startIndex * virtualScroll.itemHeight
              }px)`,
            }"
          >
            <div
              v-for="item in visibleItems"
              :key="item.id"
              class="content-item"
              :class="{
                active: selectedItem?.id === item.id,
                favorite: item.is_favorite,
                selected: selectedIds.has(item.id),
              }"
              @click="
                isSelectionMode
                  ? toggleItemSelection(item.id)
                  : (copyItem(item, $event), (selectedItem = item))
              "
            >
              <!-- 批量选择复选框 -->
              <div v-if="isSelectionMode" class="item-checkbox">
                <el-checkbox
                  :model-value="selectedIds.has(item.id)"
                  @change="toggleItemSelection(item.id)"
                  @click.stop
                />
              </div>

              <div class="item-icon">
                <el-icon>
                  <i-ep-Document
                    style="color: var(--accent-blue)"
                    v-if="item.type === 'text'"
                  />
                  <i-ep-Link
                    style="color: var(--accent-green)"
                    v-else-if="item.type === 'url'"
                  />
                  <i-ep-Tickets
                    style="color: var(--accent-purple)"
                    v-else-if="item.type === 'code'"
                  />
                  <i-ep-Picture
                    style="color: var(--accent-red)"
                    v-else-if="item.type === 'image'"
                  />
                  <i-ep-Document style="color: var(--accent-blue)" v-else />
                </el-icon>
              </div>
              <div class="item-content">
                <div class="item-title">
                  {{ truncateText(item.content, 100) }}
                </div>
                <div class="item-meta">
                  <span class="meta-time">
                    <i-ep-Clock class="meta-icon" />
                    {{ formatTime(item.timestamp) }}
                  </span>
                  <!-- 添加id信息展示 -->
                  <span class="meta-id">
                    <i-ep-Key class="meta-icon" />
                    ID: {{ item.id }}
                  </span>
                  <span class="meta-size">
                    <i-ep-Document-Checked class="meta-icon" /> {{ item.size }}
                  </span>
                  <span class="meta-type" :class="`type-${item.type}`">
                    <i-ep-InfoFilled class="meta-icon" />
                    {{ getTypeLabel(item.type) }}
                  </span>
                  <span
                    v-if="item.is_favorite"
                    class="meta-type"
                    :class="`type-favorite`"
                  >
                    <i-ep-Star class="meta-icon" />
                    收藏
                  </span>
                </div>
              </div>
              <div class="item-actions">
                <el-button
                  class="item-action-btn"
                  @click.stop="selectItem(item)"
                  title="查看"
                >
                  <i-ep-view />
                </el-button>
                <el-button
                  class="item-action-btn"
                  @click.stop="toggleFavorite(item, $event)"
                  :title="item.is_favorite ? '取消收藏' : '收藏'"
                >
                  <i-ep-Star class="icon-color" />
                </el-button>
                <el-button
                  class="item-action-btn"
                  @click.stop="clipboardStore.deleteItem(item.id, $event)"
                  title="删除"
                >
                  <i-ep-Delete />
                </el-button>
              </div>
            </div>

            <!-- 全部加载完毕提示 -->
            <div
              v-if="
                !isLoadingMore &&
                clipboardData.length >= totalItems &&
                clipboardData.length > 0
              "
              class="load-complete"
            >
              <span>已加载全部内容</span>
            </div>
          </div>
        </template>
      </div>

      <!-- 加载更多指示器 -->
      <div v-if="isLoadingMore && currentPage > 1" class="loading-more">
        <el-icon class="is-loading"><i-ep-Loading /></el-icon>
        <span>加载更多...</span>
      </div>
    </div>

    <!-- 详情面板 -->
    <DetailPanel
      :item="selectedItem"
      :is-open="isOpen"
      @close="closeDetail"
      @copy="copyItem"
      @delete="clipboardStore.deleteItem"
      @favorite="toggleFavorite"
    />
  </div>
</template>

<style lang="scss" scoped>
:root {
  --detail-width: 320px;
}

.main-content {
  display: flex;
  flex: 1;
  background: var(--bg-primary);
  height: 100%;
  overflow: hidden;
}

/* 内容头部 */
.content-header {
  height: 60px;
  padding: 0 24px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-light);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.header-stats {
  font-size: 13px;
  color: var(--text-secondary);
}

.header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.batch-actions {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 8px 12px;
  border-radius: 8px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: 0px;
  color: var(--text-primary);

  &.primary {
    color: var(--text-inverse);
  }

  &:disabled {
    color: var(--text-tertiary);
    border-color: var(--border-light);
  }
}

/* 搜索区域 */
.search-container {
  padding: 16px 24px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-light);
}

.search-box {
  position: relative;
  max-width: 400px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-tertiary);
  z-index: 1;
}

.search-input {
  width: 100%;
}

:deep(.el-input__wrapper) {
  padding-left: 36px;
}

.search-filters {
  display: flex;
  gap: 10px;
  margin-top: 12px;
  flex-wrap: wrap;
}

.filter-tag {
  padding: 4px 12px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-light);
  border-radius: 20px;
  font-size: 12px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 3px;
}

.filter-tag:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.filter-tag.active {
  background: var(--accent-blue);
  color: white;
  border-color: var(--accent-blue);
}

.content-container {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
  height: 100%;
}

/* 内容列表 */
.content-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px 24px;
  background: var(--bg-primary);
  scroll-behavior: smooth;
  position: relative;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-secondary);
  text-align: center;
  padding: 60px 0;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.3;
}

.empty-title {
  font-size: 16px;
  margin-bottom: 8px;
}

.empty-desc {
  font-size: 14px;
}

/* 内容项目 */
.content-item {
  background: var(--bg-tertiary);
  border: 2px solid var(--border-light);
  border-radius: 10px;
  padding: 14px;
  margin: 10px 20px;
  cursor: pointer;
  transition: all 0.25s ease;
  position: relative;
  display: flex;
  align-items: center;
  gap: 14px;

  &:hover {
    background: var(--bg-hover);
    border: 2px solid inherit;
    background-origin: border-box;
    background-clip: padding-box, border-box;
    transform: translateY(-1px);
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
  }

  &.active {
    background: var(--bg-active);
    border: 2px solid transparent;
    background-image: linear-gradient(var(--bg-hover), var(--bg-hover)),
      linear-gradient(
        135deg,
        var(--gradient-active-start) 0%,
        var(--gradient-active-end) 100%
      );
    background-origin: border-box;
    background-clip: padding-box, border-box;
    box-shadow: 0 3px 10px rgba(0, 136, 255, 0.2);
  }

  /* 选中状态样式 */
  &.selected {
    background: var(--bg-active);
    box-shadow: 0 2px 8px rgba(0, 136, 255, 0.15);
  }

  /* 收藏项目特殊样式 */
  &.favorite {
    &.active {
      border: 2px solid transparent;
      background-image: linear-gradient(var(--bg-active), var(--bg-active)),
        linear-gradient(
          135deg,
          var(--favorite-border) 0%,
          var(--accent-red) 100%
        );
      background-origin: border-box;
      background-clip: padding-box, border-box;
    }

    .icon-color {
      color: var(--favorite-border);
      fill: var(--favorite-border);
    }
  }
}

.item-icon {
  width: 42px;
  height: 42px;
  background: var(--bg-active);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.05),
    0 2px 4px rgba(0, 0, 0, 0.1);
}

.item-checkbox {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-right: 4px;
}

.item-content {
  flex: 1;
  min-width: 0;
}

.item-title {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 6px;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  // 标准属性（未来兼容，目前主流浏览器尚未完全支持）
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  letter-spacing: 0.01em;
}

.item-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.4;

  .meta-icon {
    font-size: 12px;
    margin-right: 4px;
    opacity: 0.9;
    vertical-align: -2px;
  }

  .meta-time,
  .meta-size,
  .meta-type,
  .meta-id {
    display: inline-flex;
    align-items: center;
  }

  .meta-type {
    padding: 2px 8px;
    border-radius: 10px;
    background: rgba(0, 0, 0, 0.04);
    font-weight: 500;
    font-size: 11px;

    &.type-text {
      background: var(--type-text-bg);
      color: var(--accent-blue);
    }

    &.type-url {
      background: var(--type-url-bg);
      color: var(--accent-green);
    }

    &.type-code {
      background: var(--type-code-bg);
      color: var(--accent-purple);
    }

    &.type-image {
      background: var(--type-image-bg);
      color: var(--accent-red);
    }

    &.type-favorite {
      background: var(--type-favorite-bg);
      color: var(--accent-yellow);
    }
  }
}

.item-actions {
  display: flex;
  opacity: 0;
  transition: opacity 0.2s ease;
  gap: 6px;
}

.content-item:hover .item-actions {
  opacity: 1;
}

.item-action-btn {
  width: 32px;
  height: 32px;
  padding: 0;
  min-height: auto;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  transition: all 0.2s ease;
  color: var(--text-secondary);
  margin-left: 2px;

  &:hover {
    background-color: rgba(0, 0, 0, 0.05);
    color: var(--text-primary);
  }
}

/* 加载指示器样式 */
.loading-indicator,
.loading-more,
.load-complete {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  color: var(--text-secondary);
  font-size: 14px;
  gap: 8px;
}

.loading-more {
  padding: 12px;
  background: var(--bg-tertiary);
  border-radius: 8px;
  margin-top: 8px;
  margin-bottom: 8px;
}

.load-complete {
  padding: 12px;
  color: var(--text-tertiary);
  font-size: 13px;
  border-top: 1px dashed var(--border-light);
  margin-top: 4px;
}

/* 虚拟滚动占位元素 */
.virtual-scroll-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  pointer-events: none;
}

/* 可见项目容器 */
.virtual-scroll-content {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  will-change: transform; /* 优化性能 */
}
</style>
