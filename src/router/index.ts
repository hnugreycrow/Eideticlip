import { createMemoryHistory, createRouter } from "vue-router";
import Layout from "@/layout/index.vue";

const routes = [
  {
    path: "/",
    component: Layout,
    children: [
      {
        path: "",
        redirect: "clipboard",
      },
      {
        path: "clipboard",
        name: "Clipboard",
        component: () => import("@/views/clipboard/index.vue"),
        meta: {
          title: "剪贴板",
          keepAlive: true,
        },
      },
      {
        path: "settings",
        name: "Settings",
        component: () => import("@/views/settings/index.vue"),
        meta: {
          title: "设置",
        },
      },
      {
        path: "changelog",
        name: "Changelog",
        component: () => import("@/views/changelog/index.vue"),
        meta: {
          title: "更新日志",
        },
      },
    ],
  },
];

const router = createRouter({
  history: createMemoryHistory(),
  routes,
});

export default router;
