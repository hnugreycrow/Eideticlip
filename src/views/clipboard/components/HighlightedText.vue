<template>
  <div class="highlighted-text">
    <pre
      v-if="isCode"
      class="hljs code-block"
    ><code v-html="highlightedCode"></code></pre>
    <div v-else class="plain-text" v-html="highlightedText"></div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, watch } from "vue";
import hljs from "highlight.js";
import { themeService } from "@/utils/theme";
// 按需加载：通过 ?url 获取样式文件的构建后地址
import githubDarkUrl from "highlight.js/styles/github-dark.css?url";
import githubLightUrl from "highlight.js/styles/github.css?url";

const props = defineProps<{
  content: string;
  type?: string; // 'text' | 'code' | ...
  search?: string | null; // optional search term to highlight in plain text
  language?: string | null; // optional language hint for code
}>();

const isCode = computed(() => props.type === "code");

// 根据主题动态切换 highlight.js 的样式文件
const HLJS_LINK_ID = "hljs-theme-css";
function applyHljsTheme(theme: string) {
  const href = theme === "dark" ? githubDarkUrl : githubLightUrl;
  const prev = document.getElementById(HLJS_LINK_ID);
  if (prev) prev.remove();
  const link = document.createElement("link");
  link.id = HLJS_LINK_ID;
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
}

onMounted(() => {
  applyHljsTheme(themeService.currentTheme.value);
});

// 监听主题变化，动态更新样式
watch(
  () => themeService.currentTheme.value,
  (t) => applyHljsTheme(t)
);

onUnmounted(() => {
  const prev = document.getElementById(HLJS_LINK_ID);
  if (prev) prev.remove();
});

/**
 * 转义 HTML 字符
 */
function escapeHtml(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * 高亮代码内容，返回 HTML 字符串
 */
const highlightedCode = computed(() => {
  const txt = props.content || "";
  try {
    if (!txt) return "";
    if (props.language) {
      // try using specified language
      const res = hljs.highlight(txt, { language: props.language });
      return res.value;
    }
    const res = hljs.highlightAuto(txt);
    return res.value;
  } catch (e) {
    // fallback to escaped raw
    return escapeHtml(txt);
  }
});

/**
 * 高亮普通文本内容中的搜索词，返回 HTML 字符串
 */
const highlightedText = computed(() => {
  const txt = props.content || "";
  if (!props.search) return escapeHtml(txt).replace(/\n/g, "<br/>");

  // 简单地高亮搜索词（不区分HTML）
  const escaped = escapeHtml(txt);
  const term = props.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(term, "gi");
  return escaped
    .replace(re, (m) => `<mark>${m}</mark>`)
    .replace(/\n/g, "<br/>");
});
</script>

<style scoped>
.plain-text {
  white-space: pre-wrap;
  word-break: break-word;
  color: var(--text-primary);
}
.code-block {
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0;
  border-radius: 6px;
  background: transparent;
  overflow: auto;
}
mark {
  background: rgba(255, 229, 100, 0.25);
  padding: 0 2px;
  border-radius: 2px;
}
</style>
