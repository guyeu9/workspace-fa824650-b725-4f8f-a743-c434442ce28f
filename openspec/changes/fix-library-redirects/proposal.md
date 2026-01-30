# Proposal: Fix Game Library Redirects & Complete Library Validation

## Context
在测试过程中发现，游戏库（`/game-library`）中的“新游戏”和“开始游戏”按钮错误地将用户重定向到了编辑器（`/studio`），而不是游戏播放器（`/`）。这导致用户无法正常开始新游戏。此外，需要完成对游戏库管理功能的全面验证，包括列表展示、编辑跳转和播放流程。

## Scope
1.  **文件修改**:
    *   `src/app/game-library/page.tsx`: 修正 `handleNewGame` 函数的跳转逻辑。
2.  **功能验证**:
    *   验证“开始游戏”/“新游戏”正确跳转至 `/`。
    *   验证“编辑”正确跳转至 `/studio` 并加载数据。
    *   验证游戏列表的搜索、排序功能。

## Behavior
*   **修正前**: 点击“开始游戏” -> 跳转到 `/studio`。
*   **修正后**: 点击“开始游戏” -> 清除旧进度 -> 跳转到 `/` 开始新游戏。
*   **编辑流程**: 点击“编辑” -> 加载数据 -> 跳转到 `/studio`（保持现状，因为 Studio 兼容旧版数据）。

## Risks
*   **进度丢失**: 如果 `handleNewGame` 错误地删除了不该删除的进度，可能导致用户不满。但在“新游戏”语境下，删除旧进度是符合预期的。
*   **路由冲突**: 确保 `router.push` 与 `window.location.href` 的使用一致，避免在 Next.js 环境下出现不必要的页面刷新。
