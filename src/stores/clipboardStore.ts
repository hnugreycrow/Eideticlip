// stores/clipboardStore.ts
import { defineStore } from 'pinia';
import { ClipboardItem } from '@/utils/type';
import { formatSize, getContentType } from '@/utils/utils';
import { ElMessage, ElMessageBox } from 'element-plus'; // 确保导入UI组件

// 定义仓库类型（用于约束 this）
type ClipboardStore = ReturnType<typeof useClipboardStore>;

export const useClipboardStore = defineStore('clipboard', {
  state: () => ({
    clipboardData: [] as ClipboardItem[],
    activeFilter: 'all' as string,
    pageSize: 10,
    currentPage: 1,
    totalItems: 0,
    isLoadingMore: false,
  }),

  actions: {
    // 加载剪贴板历史（原 useClipboard 中的核心方法）
    async loadClipboardHistory(this: ClipboardStore, page = 1, append = false, type = this.activeFilter) {
      this.isLoadingMore = true;
      this.currentPage = page;

      try {
        const result = await window.clipboard.getHistory(page, this.pageSize, type);
        if (result?.total !== undefined) {
          this.totalItems = result.total;
        }

        const history = result?.items || [];
        if (history && Array.isArray(history) && history.length > 0) {
          const processedHistory = history.map((item) => ({
            ...item,
            timestamp: new Date(item.timestamp),
          }));

          this.clipboardData = append && page > 1 
            ? [...this.clipboardData, ...processedHistory] 
            : processedHistory;
        } else if (!append) {
          this.clipboardData = [];
        }
      } catch (error) {
        console.error('加载剪贴板历史出错:', error);
        ElMessage({ message: '加载历史记录失败', type: 'error', plain: true });
      } finally {
        this.isLoadingMore = false;
      }
    },

    // 保存单个剪贴板项
    async saveClipboardItem(item: ClipboardItem): Promise<number | null> {
      try {
        return await window.clipboard.saveItem(item);
      } catch (error) {
        console.error('保存剪贴板项目出错:', error);
        return null;
      }
    },

    // 添加新剪贴板项
    async addClipboardItem(content: string) {
      const exists = this.clipboardData.some(item => item.content === content);
      if (exists) return;

      const type = getContentType(content);
      const shouldAddToCurrentView = this.activeFilter === 'all' || this.activeFilter === type;
      const size = formatSize(new Blob([content]).size);

      let newItem: ClipboardItem = {
        id: Date.now(),
        type,
        content,
        timestamp: new Date(),
        size,
      };

      try {
        const savedItemId = await this.saveClipboardItem(newItem);
        if (savedItemId && typeof savedItemId === 'number') {
          newItem.id = savedItemId;
          if (shouldAddToCurrentView) {
            this.clipboardData.unshift(newItem); // 新增项放前面
            this.totalItems += 1;
          }
        } else {
          await this.loadClipboardHistory(); // 保存失败时刷新
        }
      } catch (error) {
        console.error('添加剪贴板项目失败:', error);
        await this.loadClipboardHistory();
      }
    },

    // 删除项目
    deleteItem(itemOrId: ClipboardItem | number, event?: Event) {
      event?.stopPropagation();
      const id = typeof itemOrId === 'number' ? itemOrId : itemOrId.id;

      // 本地删除
      const index = this.clipboardData.findIndex(item => item.id === id);
      if (index !== -1) {
        this.clipboardData.splice(index, 1);
        this.totalItems -= 1;
        ElMessage({ message: '删除成功', type: 'success' });
      }

      // 数据库删除
      window.clipboard.deleteItem(id)
        .catch((error) => {
          console.error('删除出错:', error);
          ElMessage({ message: '删除失败，请重试', type: 'error' });
          this.loadClipboardHistory(); // 不一致时刷新
        });
    },

    // 清空所有
    async clearAll() {
      try {
        await ElMessageBox.confirm(
          '确定要清空所有记录吗?（包括收藏记录）',
          'Warning',
          { confirmButtonText: '确认', cancelButtonText: '取消', type: 'warning' }
        );

        const success = await window.clipboard.clearAll();
        if (success) {
          this.clipboardData = [];
          this.totalItems = 0;
          ElMessage({ message: '已清空所有记录', type: 'success' });
        } else {
          ElMessage({ message: '清空失败', type: 'error' });
        }
      } catch (error) {
        console.error('清空出错:', error);
        if (error !== 'cancel') { // 排除用户取消的情况
          ElMessage({ message: '清空失败', type: 'error' });
        }
      }
    },

    // 加载更多
    loadMoreData() {
      if (this.isLoadingMore || this.clipboardData.length >= this.totalItems) return;
      this.loadClipboardHistory(this.currentPage + 1, true);
    },
  },
});