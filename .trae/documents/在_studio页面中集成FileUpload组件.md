在/studio页面中集成FileUpload组件，添加图片上传功能：

**修改内容：**
1. **导入FileUpload组件** (`src/app/studio/page.tsx`)：
   - 在文件顶部添加FileUpload组件的导入
   - 导入：`import { FileUpload } from '@/components/file-upload'`

2. **替换背景图片输入框** (`src/app/studio/page.tsx`)：
   - 找到当前的背景图片输入区域（第600-630行）
   - 将简单的Input输入框替换为FileUpload组件
   - 使用以下props：
     - gameId: 使用当前游戏ID（可以生成一个临时ID）
     - currentImageUrl: selectedBranch.background_image
     - onImageUploaded: 处理图片上传成功，更新selectedBranch的background_image和background_asset_id
     - onImageRemoved: 处理图片移除，清空selectedBranch的background_image和background_asset_id
     - label: "背景图片"
     - description: "上传游戏背景图片，支持 JPG、PNG、WebP、GIF 格式"

3. **删除不需要的状态** (`src/app/studio/page.tsx`)：
   - 如果有与背景图片相关的独立状态，可以删除，因为FileUpload组件会管理这些状态

**验证方法：**
- 打开/studio页面，检查背景图片区域是否显示FileUpload组件
- 尝试上传图片，检查是否成功更新selectedBranch的background_image
- 尝试移除图片，检查是否成功清空selectedBranch的background_image
- 检查图片预览功能是否正常工作

**预期结果：**
/studio页面将拥有完整的图片上传功能，包括预览、拖拽上传、进度显示、错误处理等功能，用户可以方便地上传和管理游戏背景图片。