<script setup lang="ts">
import Header from "./header/index.vue";
import Sidebar from "./sidebar/index.vue";
import { useRouter } from "vue-router";
import { computed } from "vue";

const router = useRouter();

// 自动找出所有 meta.keepAlive = true 的路由
const cacheRoutes = computed<string[]>(() =>
  router.getRoutes()
    .filter(r => r.meta?.keepAlive)
    .map(r => r.name) 
    .filter((name): name is string => typeof name === "string")
);
</script>

<template>
  <div class="common-layout">
    <el-container>
      <el-header height="32px">
        <Header></Header>
      </el-header>
      <el-container class="main-container">
        <Sidebar />
        <el-main>
          <router-view v-slot="{ Component, route }">
            <keep-alive v-if="route.meta.keepAlive" :include="cacheRoutes">
              <component :is="Component" />
            </keep-alive>
            <component v-else :is="Component" />
          </router-view>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<style lang="scss" scoped>
.common-layout {
  display: flex;
  flex: 1;
  margin: 0 auto;
  background: var(--bg-primary);
  overflow: hidden;
}

.el-header,
.el-main {
  padding: 0;
  width: 100%;
}

.el-header {
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-light);
  z-index: 10;
}

.el-main {
  display: flex;
  background: transparent;
}

.main-container {
  height: calc(100% - 32px);
  overflow: hidden;
  display: flex;
  flex: 1;
}
</style>
