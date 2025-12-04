export interface ChangelogItem {
  version: string;
  date: string;
  categories: {
    name: string;
    items: string[];
  }[];
}

export const changelogData: ChangelogItem[] = [
  {
    version: "v1.4.0",
    date: "2025-12-04", // 请替换为实际发布日期
    categories: [
      {
        name: "新增",
        items: [
          "详情页新增展开/收起按钮，改善页面交互体验",
          "详情界面显示代码高亮",
        ],
      },
      {
        name: "优化",
        items: [
          "优化路由结构，使用统一的 meta.keepAlive 方式管理缓存",
          "重构 keep-alive 缓存逻辑，自动识别需要缓存的页面，提高代码可维护性",
        ],
      },
      {
        name: "修复",
        items: ["删除操作后未清空选中项的问题"],
      },
    ],
  },
  {
    version: "v1.3.0",
    date: "2025-11-05", // 请替换为实际发布日期
    categories: [
      {
        name: "性能优化",
        items: ["引入虚拟滚动技术，提升大量剪贴板记录时的渲染性能"],
      },
      {
        name: "优化",
        items: ["调整剪贴板记录最长保存时间设置"],
      },
    ],
  },
  {
    version: "v1.2.1",
    date: "2025-10-12",
    categories: [
      {
        name: "修复",
        items: ["修复部分问题"],
      },
    ],
  },
  {
    version: "v1.2.0",
    date: "2025-09-16",
    categories: [
      {
        name: "新功能",
        items: ["新增批量删除功能"],
      },
      {
        name: "优化",
        items: ["剪切记录界面右上角按钮布局优化"],
      },
    ],
  },
  {
    version: "v1.1.3",
    date: "2025-09-14",
    categories: [
      {
        name: "修复",
        items: ["仅当前类型匹配时才将新记录添加到当前显示的记录列表"],
      },
      {
        name: "优化",
        items: ["窗口最大化/还原图标切换"],
      },
    ],
  },
  {
    version: "v1.1.2",
    date: "2025-09-12",
    categories: [
      {
        name: "新功能",
        items: ["新增「设置 - 更新日志」界面，方便用户查看版本更新内容"],
      },
      {
        name: "优化",
        items: ["禁止应用多开", "优化设置界面的滚动部分", "部分样式优化"],
      },
    ],
  },
];
