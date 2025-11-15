import { ref, computed } from "vue";
import { ClipboardItem } from "@/utils/type";

export function useSelection(items: () => ClipboardItem[]) {
  const selectedIds = ref<Set<number>>(new Set());
  const isSelectionMode = ref(false);

  /**
   * 计算是否全选
   */
  const isAllSelected = computed(() => {
    const currentItems = items();
    return (
      currentItems.length > 0 &&
      currentItems.every((item) => selectedIds.value.has(item.id))
    );
  });

  /**
   * 计算是否部分选中
   */
  const isIndeterminate = computed(() => {
    const currentItems = items();
    const count = currentItems.filter((item) =>
      selectedIds.value.has(item.id)
    ).length;
    return count > 0 && count < currentItems.length;
  });

  /**
   * 计算选中的项目数量
   */
  const selectedCount = computed(() => selectedIds.value.size);

  // 方法
  const toggleSelectionMode = () => {
    isSelectionMode.value = !isSelectionMode.value;
    if (!isSelectionMode.value) selectedIds.value.clear();
  };

  /**
   * 切换单个项目的选中状态
   */
  const toggleItemSelection = (id: number) => {
    if (selectedIds.value.has(id)) {
      selectedIds.value.delete(id);
    } else {
      selectedIds.value.add(id);
    }
  };

  /**
   * 全选/取消全选
   */
  const toggleSelectAll = () => {
    const currentItems = items();
    if (isAllSelected.value) {
      currentItems.forEach((item) => selectedIds.value.delete(item.id));
    } else {
      currentItems.forEach((item) => selectedIds.value.add(item.id));
    }
  };

  const clearSelection = () => selectedIds.value.clear();

  return {
    selectedIds,
    isSelectionMode,
    isAllSelected,
    isIndeterminate,
    selectedCount,
    toggleSelectionMode,
    toggleItemSelection,
    toggleSelectAll,
    clearSelection,
  };
}
