# UI设计规范

## 1. 导航栏设计
- **位置**：所有页面顶部固定显示
- **背景**：半透明渐变背景，增强层次感
- **链接样式**：使用渐变按钮设计
  - 颜色：从绿色到青色的渐变（bg-gradient-to-r from-green-600 to-teal-600）
  - 悬停效果：深色渐变（hover:from-green-700 hover:to-teal-700）
  - 文字：白色
  - 过渡效果：全部属性300ms过渡（transition-all duration-300）

## 2. 按钮设计
### 2.1 主要按钮（渐变绿色）
- **样式类**：`bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white transition-all duration-300`
- **应用场景**：
  - 登录按钮
  - 注册按钮
  - 主要操作按钮
- **状态**：
  - 正常：绿色到青色渐变
  - 悬停：深绿色到深青色渐变
  - 禁用：半透明效果

### 2.2 次要按钮
- **样式类**：根据具体场景定义，但保持与整体设计风格一致
- **应用场景**：次要操作，如取消、返回等

## 3. 卡片设计
### 3.1 悬浮卡片
- **样式类**：`bg-white border-2 border-slate-300 transition-all duration-200 hover:shadow-2xl`
- **应用场景**：
  - 登录表单
  - 注册表单
  - 游戏库卡片
  - 管理员界面卡片
- **特点**：
  - 白色背景
  - 2px边框
  - 悬停时产生2xl阴影效果
  - 200ms过渡动画

## 4. 输入框设计
- **样式类**：`bg-white border-blue-300 focus:border-blue-500 focus:ring-blue-500/20 text-slate-800 placeholder:text-slate-400`
- **应用场景**：
  - 登录表单输入框
  - 注册表单输入框
  - 搜索框
  - 其他表单输入框
- **特点**：
  - 白色背景
  - 蓝色边框（border-blue-300）
  - 聚焦时边框变为深蓝色（focus:border-blue-500）
  - 聚焦时产生淡蓝色阴影（focus:ring-blue-500/20）
  - 深灰色文字（text-slate-800）
  - 浅灰色占位符（placeholder:text-slate-400）

## 5. 背景设计
- **页面背景**：使用渐变背景增强视觉效果
  - 样式类：`bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30`
- **应用场景**：所有页面背景

## 6. 响应式设计原则
- 确保在不同屏幕尺寸下元素正确对齐和显示
- 导航栏在小屏幕上自适应调整
- 卡片宽度使用max-w-md等限制，确保在大屏幕上不过宽

## 7. 动画和过渡效果
- 所有交互元素添加过渡动画，提升用户体验
- 按钮悬停效果：300ms过渡
- 卡片悬停效果：200ms过渡
- 输入框聚焦效果：平滑过渡

## 8. 字体和排版
- 使用系统默认无衬线字体，确保跨平台一致性
- 标题使用较大字号和粗体
- 正文使用适中字号，确保可读性
- 辅助文字使用较小字号和浅色

## 9. 颜色规范
### 9.1 主色调
- 渐变绿色：从green-600到teal-600
- 用于主要按钮和强调元素

### 9.2 辅助色
- 蓝色：用于输入框边框和聚焦状态
- 紫色：用于背景渐变
- 灰色：用于边框和文字

### 9.3 中性色
- 白色：用于卡片背景
- 深灰色：用于正文文字
- 浅灰色：用于占位符和辅助文字

## 10. 图标使用
- 使用统一风格的图标库（如Lucide React）
- 确保图标与文字大小和颜色协调
- 图标用于增强视觉传达，不应过度使用

## 11. 间距和布局
- 使用统一的间距系统（如space-y-4、p-4等）
- 确保元素之间有适当的间距，避免拥挤
- 采用模块化布局，便于维护和扩展

## 12. 可访问性考虑
- 确保文字与背景对比度符合WCAG标准
- 输入框有明确的标签和占位符
- 按钮和交互元素有适当的大小，便于点击
- 所有交互状态有明确的视觉反馈

## 13. 代码规范
- 使用Tailwind CSS类名，保持代码简洁
- 避免内联样式，所有样式通过类名实现
- 组件化设计，提高代码复用性
- 遵循Next.js和React最佳实践

## 14. 实现示例
### 14.1 渐变按钮示例
```tsx
<Button className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white transition-all duration-300">
  按钮文本
</Button>
```

### 14.2 悬浮卡片示例
```tsx
<Card className="bg-white border-2 border-slate-300 transition-all duration-200 hover:shadow-2xl">
  <CardContent>
    卡片内容
  </CardContent>
</Card>
```

### 14.3 输入框示例
```tsx
<Input
  placeholder="请输入内容"
  className="bg-white border-blue-300 focus:border-blue-500 focus:ring-blue-500/20 text-slate-800 placeholder:text-slate-400"
/>
```

## 15. 维护和更新
- 所有UI组件和样式应遵循本规范
- 对规范的修改需经过团队评审
- 定期更新规范，适应设计趋势和业务需求

## 16. 浏览器兼容性
- 确保在主流浏览器中正常显示
- 测试范围包括Chrome、Firefox、Safari、Edge
- 针对不同浏览器的兼容性问题及时修复

## 17. 性能优化
- 避免过度使用复杂动画
- 合理使用Tailwind CSS类，避免生成过多CSS
- 优化图片和资源加载
- 确保页面加载速度快，交互流畅

## 18. 设计工具和资源
- 使用Figma或Sketch进行设计原型
- 参考Tailwind CSS文档和示例
- 遵循Shadcn UI组件库的设计原则

## 19. 版本控制
- 规范文档与代码一同版本控制
- 每次更新后记录变更内容
- 保持文档与实际实现一致

## 20. 培训和推广
- 向团队成员培训设计规范
- 鼓励团队成员遵循规范进行开发
- 定期检查代码是否符合规范

---

**版本**：1.0
**更新日期**：2026-01-11
**更新内容**：
- 初始版本，包含导航栏、按钮、卡片、输入框等设计规范
- 定义了渐变按钮、悬浮卡片、输入框样式
- 制定了响应式设计和可访问性原则
- 提供了实现示例和代码规范