import { computed, ref, watch } from "vue";
import { ClipboardItem } from "@/utils/type";

export function useSearch(originalData: () => ClipboardItem[]) {
  const searchQuery = ref("");
  const debouncedSearchQuery = ref("");
  let searchDebounceTimer: number | null = null;

  // 搜索防抖
  watch(searchQuery, (newValue) => {
    if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
    searchDebounceTimer = window.setTimeout(() => {
      debouncedSearchQuery.value = newValue.trim().toLowerCase();
      searchDebounceTimer = null;
    }, 300);
  });

  // 过滤后的数据，返回的是一个数组，数组在 JavaScript 中属于 引用类型
  // 如果 filteredData 的变化涉及数组内部元素的修改（而非数组本身被重新赋值），普通 watch 无法感知，必须通过 deep: true 开启深度监听才能生效。
  const filteredData = computed(() => {
    console.log("Filtering data with query:");
    const query = debouncedSearchQuery.value;
    if (!query) return originalData();

    return originalData().filter(
      (item) =>
        item.content &&
        typeof item.content === "string" &&
        item.content.toLowerCase().includes(query)
    );
  });

  return {
    searchQuery,
    filteredData,
  };
}
