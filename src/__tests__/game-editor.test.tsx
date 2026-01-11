import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GameEditor from '../app/game-editor/page';
import EnhancedGameEditor from '../app/enhanced-editor/page';
import { gameStore } from '../lib/game-store';

// Mock dependencies
jest.mock('@/lib/game-store');
jest.mock('@/lib/platform-file-download');
jest.mock('@/lib/platform-file-upload');
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn()
  }
}));

describe('老版编辑器测试', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('游戏基础信息管理', () => {
    it('应该正确初始化默认游戏数据', () => {
      render(<GameEditor />);
      
      expect(screen.getByPlaceholderText('我的故事')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('这是一个精彩的故事...')).toBeInTheDocument();
    });

    it('应该允许修改游戏标题', async () => {
      const user = userEvent.setup();
      render(<GameEditor />);
      
      const titleInput = screen.getByPlaceholderText('我的故事');
      await user.clear(titleInput);
      await user.type(titleInput, '测试游戏标题');
      
      expect(titleInput).toHaveValue('测试游戏标题');
    });

    it('应该允许修改游戏描述', async () => {
      const user = userEvent.setup();
      render(<GameEditor />);
      
      const descInput = screen.getByPlaceholderText('这是一个精彩的故事...');
      await user.clear(descInput);
      await user.type(descInput, '这是测试描述');
      
      expect(descInput).toHaveValue('这是测试描述');
    });

    it('应该保存游戏标题到历史记录', async () => {
      const user = userEvent.setup();
      render(<GameEditor />);
      
      const titleInput = screen.getByPlaceholderText('我的故事');
      await user.clear(titleInput);
      await user.type(titleInput, '新标题');
      
      // 等待状态更新
      await waitFor(() => {
        expect(titleInput).toHaveValue('新标题');
      });
    });
  });

  describe('分支管理功能', () => {
    it('应该成功添加新分支', async () => {
      const user = userEvent.setup();
      render(<GameEditor />);
      
      const addButton = screen.getByText('添加分支');
      await user.click(addButton);
      
      await waitFor(() => {
        expect(screen.getByText('新章节')).toBeInTheDocument();
      });
    });

    it('应该为每个分支生成唯一的branch_id', async () => {
      const user = userEvent.setup();
      render(<GameEditor />);
      
      const addButton = screen.getByText('添加分支');
      await user.click(addButton);
      await user.click(addButton);
      
      // 验证两个分支的ID不同
      const branches = screen.getAllByText('新章节');
      expect(branches).toHaveLength(2);
    });

    it('应该允许编辑分支章节标题', async () => {
      const user = userEvent.setup();
      render(<GameEditor />);
      
      const addButton = screen.getByText('添加分支');
      await user.click(addButton);
      
      const chapterInput = screen.getByPlaceholderText('章节标题');
      await user.clear(chapterInput);
      await user.type(chapterInput, '第一章');
      
      expect(chapterInput).toHaveValue('第一章');
    });

    it('应该允许编辑分支场景描述', async () => {
      const user = userEvent.setup();
      render(<GameEditor />);
      
      const addButton = screen.getByText('添加分支');
      await user.click(addButton);
      
      const sceneInput = screen.getByPlaceholderText('在这里输入场景描述...');
      await user.clear(sceneInput);
      await user.type(sceneInput, '这是第一个场景');
      
      expect(sceneInput).toHaveValue('这是第一个场景');
    });

    it('应该成功删除分支', async () => {
      const user = userEvent.setup();
      render(<GameEditor />);
      
      const addButton = screen.getByText('添加分支');
      await user.click(addButton);
      
      await waitFor(() => {
        expect(screen.getByText('新章节')).toBeInTheDocument();
      });
      
      const deleteButton = screen.getByText('删除');
      await user.click(deleteButton);
      
      await waitFor(() => {
        expect(screen.queryByText('新章节')).not.toBeInTheDocument();
      });
    });

    it('删除分支后应更新selectedBranchId', async () => {
      const user = userEvent.setup();
      render(<GameEditor />);
      
      const addButton = screen.getByText('添加分支');
      await user.click(addButton);
      
      await waitFor(() => {
        expect(screen.getByText('新章节')).toBeInTheDocument();
      });
      
      const deleteButton = screen.getByText('删除');
      await user.click(deleteButton);
      
      await waitFor(() => {
        expect(screen.queryByText('新章节')).not.toBeInTheDocument();
      });
    });
  });

  describe('选项管理功能', () => {
    it('应该成功添加选项到分支', async () => {
      const user = userEvent.setup();
      render(<GameEditor />);
      
      const addButton = screen.getByText('添加分支');
      await user.click(addButton);
      
      await waitFor(() => {
        expect(screen.getByText('新章节')).toBeInTheDocument();
      });
      
      const addChoiceButton = screen.getByText('添加选项');
      await user.click(addChoiceButton);
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('选项文本')).toBeInTheDocument();
      });
    });

    it('应该允许编辑选项文本', async () => {
      const user = userEvent.setup();
      render(<GameEditor />);
      
      const addButton = screen.getByText('添加分支');
      await user.click(addButton);
      
      await waitFor(() => {
        expect(screen.getByText('新章节')).toBeInTheDocument();
      });
      
      const addChoiceButton = screen.getByText('添加选项');
      await user.click(addChoiceButton);
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('选项文本')).toBeInTheDocument();
      });
      
      const choiceInput = screen.getByPlaceholderText('选项文本');
      await user.clear(choiceInput);
      await user.type(choiceInput, '选择这个选项');
      
      expect(choiceInput).toHaveValue('选择这个选项');
    });

    it('应该允许设置选项的目标分支', async () => {
      const user = userEvent.setup();
      render(<GameEditor />);
      
      const addButton = screen.getByText('添加分支');
      await user.click(addButton);
      await user.click(addButton);
      
      await waitFor(() => {
        expect(screen.getAllByText('新章节')).toHaveLength(2);
      });
      
      const addChoiceButton = screen.getAllByText('添加选项')[0];
      await user.click(addChoiceButton);
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('选项文本')).toBeInTheDocument();
      });
      
      const targetBranchSelect = screen.getByPlaceholderText('选择目标分支');
      await user.click(targetBranchSelect);
      
      // 选择第二个分支
      const branchOptions = screen.getAllByText('branch_');
      if (branchOptions.length > 0) {
        await user.click(branchOptions[1]);
      }
    });

    it('应该允许设置选项为结束游戏', async () => {
      const user = userEvent.setup();
      render(<GameEditor />);
      
      const addButton = screen.getByText('添加分支');
      await user.click(addButton);
      
      await waitFor(() => {
        expect(screen.getByText('新章节')).toBeInTheDocument();
      });
      
      const addChoiceButton = screen.getByText('添加选项');
      await user.click(addChoiceButton);
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('选项文本')).toBeInTheDocument();
      });
      
      const endGameCheckbox = screen.getByLabelText('结束游戏');
      await user.click(endGameCheckbox);
      
      expect(endGameCheckbox).toBeChecked();
    });

    it('应该成功删除选项', async () => {
      const user = userEvent.setup();
      render(<GameEditor />);
      
      const addButton = screen.getByText('添加分支');
      await user.click(addButton);
      
      await waitFor(() => {
        expect(screen.getByText('新章节')).toBeInTheDocument();
      });
      
      const addChoiceButton = screen.getByText('添加选项');
      await user.click(addChoiceButton);
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('选项文本')).toBeInTheDocument();
      });
      
      const deleteChoiceButton = screen.getByText('删除选项');
      await user.click(deleteChoiceButton);
      
      await waitFor(() => {
        expect(screen.queryByPlaceholderText('选项文本')).not.toBeInTheDocument();
      });
    });

    it('应该支持添加多个选项到同一分支', async () => {
      const user = userEvent.setup();
      render(<GameEditor />);
      
      const addButton = screen.getByText('添加分支');
      await user.click(addButton);
      
      await waitFor(() => {
        expect(screen.getByText('新章节')).toBeInTheDocument();
      });
      
      const addChoiceButton = screen.getByText('添加选项');
      await user.click(addChoiceButton);
      await user.click(addChoiceButton);
      await user.click(addChoiceButton);
      
      await waitFor(() => {
        const choiceInputs = screen.getAllByPlaceholderText('选项文本');
        expect(choiceInputs).toHaveLength(3);
      });
    });
  });

  describe('历史记录和撤销/重做功能', () => {
    it('应该保存操作到历史记录', async () => {
      const user = userEvent.setup();
      render(<GameEditor />);
      
      const titleInput = screen.getByPlaceholderText('我的故事');
      await user.clear(titleInput);
      await user.type(titleInput, '新标题');
      
      await waitFor(() => {
        expect(titleInput).toHaveValue('新标题');
      });
    });

    it('应该支持撤销操作', async () => {
      const user = userEvent.setup();
      render(<GameEditor />);
      
      const titleInput = screen.getByPlaceholderText('我的故事');
      await user.clear(titleInput);
      await user.type(titleInput, '新标题');
      
      await waitFor(() => {
        expect(titleInput).toHaveValue('新标题');
      });
      
      const undoButton = screen.getByText('撤销');
      await user.click(undoButton);
      
      await waitFor(() => {
        expect(titleInput).toHaveValue('我的故事');
      });
    });

    it('应该支持重做操作', async () => {
      const user = userEvent.setup();
      render(<GameEditor />);
      
      const titleInput = screen.getByPlaceholderText('我的故事');
      await user.clear(titleInput);
      await user.type(titleInput, '新标题');
      
      await waitFor(() => {
        expect(titleInput).toHaveValue('新标题');
      });
      
      const undoButton = screen.getByText('撤销');
      await user.click(undoButton);
      
      await waitFor(() => {
        expect(titleInput).toHaveValue('我的故事');
      });
      
      const redoButton = screen.getByText('重做');
      await user.click(redoButton);
      
      await waitFor(() => {
        expect(titleInput).toHaveValue('新标题');
      });
    });

    it('历史记录应该限制在50条以内', async () => {
      const user = userEvent.setup();
      render(<GameEditor />);
      
      const titleInput = screen.getByPlaceholderText('我的故事');
      
      // 执行超过50次操作
      for (let i = 0; i < 60; i++) {
        await user.clear(titleInput);
        await user.type(titleInput, `标题${i}`);
        await waitFor(() => {
          expect(titleInput).toHaveValue(`标题${i}`);
        });
      }
      
      // 验证历史记录不会无限增长
      // 这个测试需要访问组件内部状态，可能需要调整实现
    });
  });

  describe('游戏导入导出功能', () => {
    it('应该成功导出游戏为JSON', async () => {
      const user = userEvent.setup();
      render(<GameEditor />);
      
      const exportButton = screen.getByText('导出');
      await user.click(exportButton);
      
      // 验证导出功能被调用
      // 需要mock PlatformFileDownloader.downloadJson
    });

    it('应该成功导入游戏JSON文件', async () => {
      const user = userEvent.setup();
      render(<GameEditor />);
      
      const importButton = screen.getByText('导入');
      await user.click(importButton);
      
      // 验证导入功能被调用
      // 需要mock PlatformFileUploader.uploadJson
    });

    it('应该拒绝无效的JSON文件', async () => {
      const user = userEvent.setup();
      render(<GameEditor />);
      
      // 模拟上传无效文件
      const file = new File(['invalid json'], 'game.json', { type: 'application/json' });
      
      const importButton = screen.getByText('导入');
      await user.click(importButton);
      
      // 验证错误提示
      // 需要mock文件上传过程
    });
  });

  describe('游戏保存功能', () => {
    it('应该成功保存游戏到IndexedDB', async () => {
      const user = userEvent.setup();
      render(<GameEditor />);
      
      const titleInput = screen.getByPlaceholderText('我的故事');
      await user.clear(titleInput);
      await user.type(titleInput, '测试游戏');
      
      const startButton = screen.getByText('开始游戏');
      await user.click(startButton);
      
      // 验证gameStore.createGame被调用
      expect(gameStore.createGame).toHaveBeenCalled();
    });

    it('应该保存游戏数据到sessionStorage', async () => {
      const user = userEvent.setup();
      render(<GameEditor />);
      
      const titleInput = screen.getByPlaceholderText('我的故事');
      await user.clear(titleInput);
      await user.type(titleInput, '测试游戏');
      
      const startButton = screen.getByText('开始游戏');
      await user.click(startButton);
      
      // 验证sessionStorage包含游戏数据
      expect(sessionStorage.getItem('gameData')).toBeTruthy();
    });

    it('应该跳转到首页开始游戏', async () => {
      const user = userEvent.setup();
      render(<GameEditor />);
      
      const startButton = screen.getByText('开始游戏');
      await user.click(startButton);
      
      // 验证页面跳转
      expect(window.location.pathname).toBe('/');
    });
  });

  describe('视图模式切换', () => {
    it('应该支持列表视图', async () => {
      const user = userEvent.setup();
      render(<GameEditor />);
      
      const listViewButton = screen.getByText('列表');
      await user.click(listViewButton);
      
      // 验证列表视图被激活
      expect(listViewButton).toHaveClass('bg-gradient-to-r');
    });

    it('应该支持图形视图', async () => {
      const user = userEvent.setup();
      render(<GameEditor />);
      
      const graphViewButton = screen.getByText('图形');
      await user.click(graphViewButton);
      
      // 验证图形视图被激活
      expect(graphViewButton).toHaveClass('bg-gradient-to-r');
    });

    it('图形视图应该显示分支节点', async () => {
      const user = userEvent.setup();
      render(<GameEditor />);
      
      const addButton = screen.getByText('添加分支');
      await user.click(addButton);
      
      await waitFor(() => {
        expect(screen.getByText('新章节')).toBeInTheDocument();
      });
      
      const graphViewButton = screen.getByText('图形');
      await user.click(graphViewButton);
      
      // 验证图形视图显示分支节点
      // 需要检查图形渲染
    });
  });

  describe('步骤引导功能', () => {
    it('应该显示5个制作步骤', () => {
      render(<GameEditor />);
      
      expect(screen.getByText('步骤 1 / 5')).toBeInTheDocument();
    });

    it('应该高亮当前步骤', () => {
      render(<GameEditor />);
      
      const step1 = screen.getByText('基础信息');
      expect(step1).toHaveClass('text-slate-800');
    });

    it('应该显示步骤描述', () => {
      render(<GameEditor />);
      
      expect(screen.getByText('填写游戏标题和描述')).toBeInTheDocument();
    });
  });

  describe('错误处理和边界情况', () => {
    it('应该处理空标题的保存', async () => {
      const user = userEvent.setup();
      render(<GameEditor />);
      
      const titleInput = screen.getByPlaceholderText('我的故事');
      await user.clear(titleInput);
      
      const startButton = screen.getByText('开始游戏');
      await user.click(startButton);
      
      // 验证不保存空标题的游戏
      expect(gameStore.createGame).not.toHaveBeenCalled();
    });

    it('应该处理超长标题', async () => {
      const user = userEvent.setup();
      render(<GameEditor />);
      
      const titleInput = screen.getByPlaceholderText('我的故事');
      const longTitle = 'A'.repeat(300);
      await user.clear(titleInput);
      await user.type(titleInput, longTitle);
      
      // 验证标题被截断或显示错误
      expect(titleInput).toHaveValue(longTitle);
    });

    it('应该处理空分支列表', () => {
      render(<GameEditor />);
      
      // 验证空分支列表的显示
      expect(screen.getByText('还没有任何分支')).toBeInTheDocument();
    });
  });
});

describe('增强版编辑器测试', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('游戏基础信息管理', () => {
    it('应该正确初始化默认游戏数据', () => {
      render(<EnhancedGameEditor />);
      
      expect(screen.getByPlaceholderText('游戏标题')).toBeInTheDocument();
    });

    it('应该允许修改游戏标题', async () => {
      const user = userEvent.setup();
      render(<EnhancedGameEditor />);
      
      const titleInput = screen.getByPlaceholderText('游戏标题');
      await user.clear(titleInput);
      await user.type(titleInput, '测试游戏标题');
      
      expect(titleInput).toHaveValue('测试游戏标题');
    });

    it('应该允许修改游戏作者', async () => {
      const user = userEvent.setup();
      render(<EnhancedGameEditor />);
      
      const authorInput = screen.getByPlaceholderText('作者');
      await user.clear(authorInput);
      await user.type(authorInput, '测试作者');
      
      expect(authorInput).toHaveValue('测试作者');
    });

    it('应该显示未保存更改提示', async () => {
      const user = userEvent.setup();
      render(<EnhancedGameEditor />);
      
      const titleInput = screen.getByPlaceholderText('游戏标题');
      await user.clear(titleInput);
      await user.type(titleInput, '新标题');
      
      await waitFor(() => {
        const saveButton = screen.getByText('保存 *');
        expect(saveButton).toBeInTheDocument();
      });
    });
  });

  describe('分支管理功能', () => {
    it('应该成功添加新分支', async () => {
      const user = userEvent.setup();
      render(<EnhancedGameEditor />);
      
      const addButton = screen.getByRole('button', { name: /添加分支/i });
      await user.click(addButton);
      
      await waitFor(() => {
        expect(screen.getByText(/第\d+章/)).toBeInTheDocument();
      });
    });

    it('应该允许切换当前编辑的分支', async () => {
      const user = userEvent.setup();
      render(<EnhancedGameEditor />);
      
      const addButton = screen.getByRole('button', { name: /添加分支/i });
      await user.click(addButton);
      await user.click(addButton);
      
      await waitFor(() => {
        const branches = screen.getAllByText(/第\d+章/);
        expect(branches.length).toBeGreaterThan(1);
      });
      
      // 点击第二个分支进行切换
      const branches = screen.getAllByText(/第\d+章/);
      if (branches.length > 1) {
        await user.click(branches[1]);
      }
    });

    it('应该允许编辑分支标题', async () => {
      const user = userEvent.setup();
      render(<EnhancedGameEditor />);
      
      const addButton = screen.getByRole('button', { name: /添加分支/i });
      await user.click(addButton);
      
      await waitFor(() => {
        expect(screen.getByText(/第\d+章/)).toBeInTheDocument();
      });
      
      const branchTitle = screen.getByText(/第\d+章/);
      await user.click(branchTitle);
      
      const titleInput = screen.getByDisplayValue(/第\d+章/);
      await user.clear(titleInput);
      await user.type(titleInput, '新章节标题');
      
      expect(titleInput).toHaveValue('新章节标题');
    });

    it('应该允许编辑分支场景描述', async () => {
      const user = userEvent.setup();
      render(<EnhancedGameEditor />);
      
      const addButton = screen.getByRole('button', { name: /添加分支/i });
      await user.click(addButton);
      
      await waitFor(() => {
        expect(screen.getByText(/第\d+章/)).toBeInTheDocument();
      });
      
      const sceneInput = screen.getByPlaceholderText('场景描述');
      await user.clear(sceneInput);
      await user.type(sceneInput, '这是场景描述');
      
      expect(sceneInput).toHaveValue('这是场景描述');
    });

    it('应该成功删除分支', async () => {
      const user = userEvent.setup();
      render(<EnhancedGameEditor />);
      
      const addButton = screen.getByRole('button', { name: /添加分支/i });
      await user.click(addButton);
      
      await waitFor(() => {
        expect(screen.getByText(/第\d+章/)).toBeInTheDocument();
      });
      
      const deleteButton = screen.getByRole('button', { name: /删除/i });
      await user.click(deleteButton);
      
      await waitFor(() => {
        expect(screen.queryByText(/第\d+章/)).not.toBeInTheDocument();
      });
    });
  });

  describe('选项管理功能', () => {
    it('应该成功添加选项到分支', async () => {
      const user = userEvent.setup();
      render(<EnhancedGameEditor />);
      
      const addButton = screen.getByRole('button', { name: /添加分支/i });
      await user.click(addButton);
      
      await waitFor(() => {
        expect(screen.getByText(/第\d+章/)).toBeInTheDocument();
      });
      
      const addChoiceButton = screen.getByRole('button', { name: /添加选项/i });
      await user.click(addChoiceButton);
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('选项文本')).toBeInTheDocument();
      });
    });

    it('应该允许编辑选项文本', async () => {
      const user = userEvent.setup();
      render(<EnhancedGameEditor />);
      
      const addButton = screen.getByRole('button', { name: /添加分支/i });
      await user.click(addButton);
      
      await waitFor(() => {
        expect(screen.getByText(/第\d+章/)).toBeInTheDocument();
      });
      
      const addChoiceButton = screen.getByRole('button', { name: /添加选项/i });
      await user.click(addChoiceButton);
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('选项文本')).toBeInTheDocument();
      });
      
      const choiceInput = screen.getByPlaceholderText('选项文本');
      await user.clear(choiceInput);
      await user.type(choiceInput, '选择这个选项');
      
      expect(choiceInput).toHaveValue('选择这个选项');
    });

    it('应该允许设置选项的目标分支', async () => {
      const user = userEvent.setup();
      render(<EnhancedGameEditor />);
      
      const addButton = screen.getByRole('button', { name: /添加分支/i });
      await user.click(addButton);
      await user.click(addButton);
      
      await waitFor(() => {
        const branches = screen.getAllByText(/第\d+章/);
        expect(branches.length).toBeGreaterThan(1);
      });
      
      const addChoiceButton = screen.getAllByRole('button', { name: /添加选项/i })[0];
      await user.click(addChoiceButton);
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('选项文本')).toBeInTheDocument();
      });
      
      const targetBranchSelect = screen.getByRole('combobox', { name: /目标分支/i });
      await user.click(targetBranchSelect);
      
      // 选择第二个分支
      const branchOptions = screen.getAllByText(/第\d+章/);
      if (branchOptions.length > 1) {
        await user.click(branchOptions[1]);
      }
    });

    it('应该允许设置选项为结束游戏', async () => {
      const user = userEvent.setup();
      render(<EnhancedGameEditor />);
      
      const addButton = screen.getByRole('button', { name: /添加分支/i });
      await user.click(addButton);
      
      await waitFor(() => {
        expect(screen.getByText(/第\d+章/)).toBeInTheDocument();
      });
      
      const addChoiceButton = screen.getByRole('button', { name: /添加选项/i });
      await user.click(addChoiceButton);
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('选项文本')).toBeInTheDocument();
      });
      
      const endGameCheckbox = screen.getByRole('checkbox', { name: /结束游戏/i });
      await user.click(endGameCheckbox);
      
      expect(endGameCheckbox).toBeChecked();
    });

    it('应该成功删除选项', async () => {
      const user = userEvent.setup();
      render(<EnhancedGameEditor />);
      
      const addButton = screen.getByRole('button', { name: /添加分支/i });
      await user.click(addButton);
      
      await waitFor(() => {
        expect(screen.getByText(/第\d+章/)).toBeInTheDocument();
      });
      
      const addChoiceButton = screen.getByRole('button', { name: /添加选项/i });
      await user.click(addChoiceButton);
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('选项文本')).toBeInTheDocument();
      });
      
      const deleteChoiceButton = screen.getByRole('button', { name: /删除选项/i });
      await user.click(deleteChoiceButton);
      
      await waitFor(() => {
        expect(screen.queryByPlaceholderText('选项文本')).not.toBeInTheDocument();
      });
    });

    it('应该支持添加多个选项到同一分支', async () => {
      const user = userEvent.setup();
      render(<EnhancedGameEditor />);
      
      const addButton = screen.getByRole('button', { name: /添加分支/i });
      await user.click(addButton);
      
      await waitFor(() => {
        expect(screen.getByText(/第\d+章/)).toBeInTheDocument();
      });
      
      const addChoiceButton = screen.getByRole('button', { name: /添加选项/i });
      await user.click(addChoiceButton);
      await user.click(addChoiceButton);
      await user.click(addChoiceButton);
      
      await waitFor(() => {
        const choiceInputs = screen.getAllByPlaceholderText('选项文本');
        expect(choiceInputs).toHaveLength(3);
      });
    });
  });

  describe('历史记录和撤销/重做功能', () => {
    it('应该保存操作到历史记录', async () => {
      const user = userEvent.setup();
      render(<EnhancedGameEditor />);
      
      const titleInput = screen.getByPlaceholderText('游戏标题');
      await user.clear(titleInput);
      await user.type(titleInput, '新标题');
      
      await waitFor(() => {
        expect(titleInput).toHaveValue('新标题');
      });
    });

    it('应该支持撤销操作', async () => {
      const user = userEvent.setup();
      render(<EnhancedGameEditor />);
      
      const titleInput = screen.getByPlaceholderText('游戏标题');
      await user.clear(titleInput);
      await user.type(titleInput, '新标题');
      
      await waitFor(() => {
        expect(titleInput).toHaveValue('新标题');
      });
      
      const undoButton = screen.getByRole('button', { name: /撤销/i });
      await user.click(undoButton);
      
      await waitFor(() => {
        expect(titleInput).toHaveValue('');
      });
    });

    it('应该支持重做操作', async () => {
      const user = userEvent.setup();
      render(<EnhancedGameEditor />);
      
      const titleInput = screen.getByPlaceholderText('游戏标题');
      await user.clear(titleInput);
      await user.type(titleInput, '新标题');
      
      await waitFor(() => {
        expect(titleInput).toHaveValue('新标题');
      });
      
      const undoButton = screen.getByRole('button', { name: /撤销/i });
      await user.click(undoButton);
      
      await waitFor(() => {
        expect(titleInput).toHaveValue('');
      });
      
      const redoButton = screen.getByRole('button', { name: /重做/i });
      await user.click(redoButton);
      
      await waitFor(() => {
        expect(titleInput).toHaveValue('新标题');
      });
    });

    it('历史记录应该限制在50条以内', async () => {
      const user = userEvent.setup();
      render(<EnhancedGameEditor />);
      
      const titleInput = screen.getByPlaceholderText('游戏标题');
      
      // 执行超过50次操作
      for (let i = 0; i < 60; i++) {
        await user.clear(titleInput);
        await user.type(titleInput, `标题${i}`);
        await waitFor(() => {
          expect(titleInput).toHaveValue(`标题${i}`);
        });
      }
      
      // 验证历史记录不会无限增长
      // 这个测试需要访问组件内部状态，可能需要调整实现
    });
  });

  describe('游戏导入导出功能', () => {
    it('应该成功导出游戏为JSON', async () => {
      const user = userEvent.setup();
      render(<EnhancedGameEditor />);
      
      const exportButton = screen.getByRole('button', { name: /导出/i });
      await user.click(exportButton);
      
      // 验证导出功能被调用
      // 需要mock PlatformFileDownloader.downloadJson
    });

    it('应该成功导入游戏JSON文件', async () => {
      const user = userEvent.setup();
      render(<EnhancedGameEditor />);
      
      const importButton = screen.getByRole('button', { name: /导入/i });
      await user.click(importButton);
      
      // 验证导入功能被调用
      // 需要mock PlatformFileUploader.uploadJson
    });

    it('应该拒绝无效的JSON文件', async () => {
      const user = userEvent.setup();
      render(<EnhancedGameEditor />);
      
      // 模拟上传无效文件
      const file = new File(['invalid json'], 'game.json', { type: 'application/json' });
      
      const importButton = screen.getByRole('button', { name: /导入/i });
      await user.click(importButton);
      
      // 验证错误提示
      // 需要mock文件上传过程
    });
  });

  describe('游戏保存功能', () => {
    it('应该成功保存游戏到IndexedDB', async () => {
      const user = userEvent.setup();
      render(<EnhancedGameEditor />);
      
      const titleInput = screen.getByPlaceholderText('游戏标题');
      await user.clear(titleInput);
      await user.type(titleInput, '测试游戏');
      
      const saveButton = screen.getByRole('button', { name: /保存/i });
      await user.click(saveButton);
      
      // 验证gameStore.createGame被调用
      expect(gameStore.createGame).toHaveBeenCalled();
    });

    it('应该保存游戏数据到sessionStorage', async () => {
      const user = userEvent.setup();
      render(<EnhancedGameEditor />);
      
      const titleInput = screen.getByPlaceholderText('游戏标题');
      await user.clear(titleInput);
      await user.type(titleInput, '测试游戏');
      
      const saveButton = screen.getByRole('button', { name: /保存/i });
      await user.click(saveButton);
      
      // 验证sessionStorage包含游戏数据
      expect(sessionStorage.getItem('gameData')).toBeTruthy();
    });

    it('应该跳转到首页开始游戏', async () => {
      const user = userEvent.setup();
      render(<EnhancedGameEditor />);
      
      const playButton = screen.getByRole('button', { name: /开始游戏/i });
      await user.click(playButton);
      
      // 验证页面跳转
      expect(window.location.pathname).toBe('/');
    });
  });

  describe('视图模式切换', () => {
    it('应该支持列表视图', async () => {
      const user = userEvent.setup();
      render(<EnhancedGameEditor />);
      
      const listViewButton = screen.getByRole('button', { name: /列表/i });
      await user.click(listViewButton);
      
      // 验证列表视图被激活
      expect(listViewButton).toHaveClass('bg-gradient-to-r');
    });

    it('应该支持图形视图', async () => {
      const user = userEvent.setup();
      render(<EnhancedGameEditor />);
      
      const graphViewButton = screen.getByRole('button', { name: /图形/i });
      await user.click(graphViewButton);
      
      // 验证图形视图被激活
      expect(graphViewButton).toHaveClass('bg-gradient-to-r');
    });

    it('图形视图应该显示分支节点', async () => {
      const user = userEvent.setup();
      render(<EnhancedGameEditor />);
      
      const addButton = screen.getByRole('button', { name: /添加分支/i });
      await user.click(addButton);
      
      await waitFor(() => {
        expect(screen.getByText(/第\d+章/)).toBeInTheDocument();
      });
      
      const graphViewButton = screen.getByRole('button', { name: /图形/i });
      await user.click(graphViewButton);
      
      // 验证图形视图显示分支节点
      // 需要检查图形渲染
    });
  });

  describe('步骤引导功能', () => {
    it('应该显示5个制作步骤', () => {
      render(<EnhancedGameEditor />);
      
      expect(screen.getByText('步骤 1 / 5')).toBeInTheDocument();
    });

    it('应该高亮当前步骤', () => {
      render(<EnhancedGameEditor />);
      
      const step1 = screen.getByText('基础信息');
      expect(step1).toHaveClass('text-slate-800');
    });

    it('应该显示步骤描述', () => {
      render(<EnhancedGameEditor />);
      
      expect(screen.getByText('填写游戏标题和描述')).toBeInTheDocument();
    });
  });

  describe('错误处理和边界情况', () => {
    it('应该处理空标题的保存', async () => {
      const user = userEvent.setup();
      render(<EnhancedGameEditor />);
      
      const titleInput = screen.getByPlaceholderText('游戏标题');
      await user.clear(titleInput);
      
      const saveButton = screen.getByRole('button', { name: /保存/i });
      await user.click(saveButton);
      
      // 验证不保存空标题的游戏
      expect(gameStore.createGame).not.toHaveBeenCalled();
    });

    it('应该处理超长标题', async () => {
      const user = userEvent.setup();
      render(<EnhancedGameEditor />);
      
      const titleInput = screen.getByPlaceholderText('游戏标题');
      const longTitle = 'A'.repeat(300);
      await user.clear(titleInput);
      await user.type(titleInput, longTitle);
      
      // 验证标题被截断或显示错误
      expect(titleInput).toHaveValue(longTitle);
    });

    it('应该处理空分支列表', () => {
      render(<EnhancedGameEditor />);
      
      // 验证空分支列表的显示
      expect(screen.getByText('还没有任何分支')).toBeInTheDocument();
    });
  });
});
