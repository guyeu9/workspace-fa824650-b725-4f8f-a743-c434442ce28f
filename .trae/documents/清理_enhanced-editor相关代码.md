根据用户的要求，只需要删除以下两个文件，不需要修改其他代码：

**删除内容：**
1. **增强编辑器页面** (`src/app/enhanced-editor/page.tsx`)：
   - 删除整个页面文件

2. **增强导航库** (`src/lib/enhanced-navigation.ts`)：
   - 删除此文件，因为它没有被任何组件引用

**不修改的内容：**
- 系统选择页面 (`src/app/system-selector/page.tsx`)：保持不变
- 首页 (`src/app/page.tsx`)：保持不变
- 游戏库页面 (`src/app/game-library/page.tsx`)：保持不变
- 游戏库小部件 (`src/components/game-library-widget.tsx`)：保持不变

**验证方法：**
- 检查构建是否成功，确保删除文件后没有引用错误
- 确认系统选择页面和首页的功能正常工作

**预期结果：**
`/enhanced-editor` 页面和相关导航库已被删除，但系统选择页面和首页中的按钮保持不变，仍然可以正常工作。