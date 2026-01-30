# Proposal: Comprehensive Test Plan for Game Editor Ecosystem

## Context
为了确保游戏编辑器生态系统的稳定性，需要对**旧版编辑器 (Legacy Editor)**、**新版编辑器 (Studio)** 以及**游戏库管理 (Game Library)** 进行全方位的端到端测试。测试将覆盖核心编辑功能、数据流转、界面交互及持久化机制。

## Scope
1.  **旧版编辑器 (Game Editor)**:
    *   基础分支创建与编辑
    *   选项逻辑设置
    *   JSON 导出功能
    *   保存到本地库
2.  **新版编辑器 (Studio)**:
    *   复杂分支图谱管理
    *   数值/状态系统 (Variables)
    *   高级 UI 交互 (Resizeable Panels)
    *   导入旧版数据兼容性
3.  **游戏库管理 (Game Library)**:
    *   游戏列表展示与刷新
    *   "开始游戏" (Play Mode) 流程
    *   "编辑" 跳转逻辑 (根据版本路由)
    *   游戏删除与导出

## Behavior & Scenarios

### 1. 旧版编辑器核心流程
*   **输入**: 进入 `/game-editor`，创建名为 "Test_Legacy_01" 的游戏，添加分支 "Branch_A" (内容: "Start") 和 "Branch_B" (内容: "End")，设置选项从 A 跳转到 B。
*   **验证**: 点击保存后，Toast 提示成功；导出 JSON 文件内容包含正确的 `branches` 结构。

### 2. 游戏库集成与跳转
*   **输入**: 进入首页 `/`，查找 "Test_Legacy_01"。
*   **验证**: 列表中存在该游戏；点击 "编辑" 能正确跳回 `/game-editor` 并加载数据；点击 "开始游戏" 能进入播放器并正确执行 A -> B 跳转。

### 3. Studio 高级功能与兼容性
*   **输入**: 进入 `/studio`，导入 "Test_Legacy_01" 或新建 "Test_Studio_02"。创建数值变量 "Gold" (Initial: 100)。在选项中添加效果 "Gold - 10"。
*   **验证**: 保存后，在播放器中执行选项，左侧状态栏显示 Gold 变为 90。

### 4. 数据持久化 (Persistence)
*   **输入**: 在 Studio 中修改标题为 "Test_Studio_Modified"，刷新页面。
*   **验证**: 页面重新加载后，标题仍为 "Test_Studio_Modified"，未丢失进度。

## Risks
*   **路由状态丢失**: 在“编辑”跳转时，URL 参数 `id` 可能未正确传递，导致加载空项目。
*   **IndexedDB 竞争**: 两个编辑器同时打开可能导致数据库写入冲突（虽然是单人操作，但需注意 SessionStorage 与 LocalStorage 的混用）。
