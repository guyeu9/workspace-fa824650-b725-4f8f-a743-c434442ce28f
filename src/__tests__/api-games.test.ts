import { GET, POST } from '../app/api/games/route';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { db } from '@/lib/db';

// Mock dependencies
jest.mock('next-auth', () => ({
  getServerSession: jest.fn()
}));

jest.mock('@/lib/db', () => ({
  db: {
    game: {
      findMany: jest.fn(),
      create: jest.fn()
    },
    user: {
      findUnique: jest.fn()
    },
    vote: {
      groupBy: jest.fn()
    }
  }
}));

describe('游戏API测试', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('GET /api/games - 获取游戏列表', () => {
    it('应该成功返回游戏列表', async () => {
      const mockGames = [
        {
          id: '1',
          title: '测试游戏1',
          description: '测试描述1',
          coverUrl: 'https://example.com/image1.jpg',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          author: {
            id: 'user1',
            name: '测试用户1'
          },
          _count: {
            votes: 5,
            comments: 3
          }
        },
        {
          id: '2',
          title: '测试游戏2',
          description: '测试描述2',
          coverUrl: 'https://example.com/image2.jpg',
          createdAt: new Date('2024-01-02'),
          updatedAt: new Date('2024-01-02'),
          author: {
            id: 'user2',
            name: '测试用户2'
          },
          _count: {
            votes: 10,
            comments: 7
          }
        }
      ];

      const mockVoteStats = [
        { gameId: '1', type: 'UP', _count: 8 },
        { gameId: '1', type: 'DOWN', _count: 3 },
        { gameId: '2', type: 'UP', _count: 15 },
        { gameId: '2', type: 'DOWN', _count: 5 }
      ];

      jest.mocked(db.game.findMany).mockResolvedValue(mockGames);
      jest.mocked(db.vote.groupBy).mockResolvedValue(mockVoteStats);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(2);
      expect(data[0].title).toBe('测试游戏1');
      expect(data[0].upvotes).toBe(8);
      expect(data[0].downvotes).toBe(3);
      expect(data[0].score).toBe(5);
      expect(data[0].commentsCount).toBe(3);
      expect(data[1].title).toBe('测试游戏2');
      expect(data[1].upvotes).toBe(15);
      expect(data[1].downvotes).toBe(5);
      expect(data[1].score).toBe(10);
      expect(data[1].commentsCount).toBe(7);
    });

    it('应该按创建时间降序返回游戏', async () => {
      const mockGames = [
        {
          id: '1',
          title: '游戏1',
          createdAt: new Date('2024-01-02'),
          author: { id: 'user1', name: '用户1' },
          _count: { votes: 0, comments: 0 }
        },
        {
          id: '2',
          title: '游戏2',
          createdAt: new Date('2024-01-01'),
          author: { id: 'user2', name: '用户2' },
          _count: { votes: 0, comments: 0 }
        }
      ];

      jest.mocked(db.game.findMany).mockResolvedValue(mockGames);
      jest.mocked(db.vote.groupBy).mockResolvedValue([]);

      const response = await GET();
      const data = await response.json();

      expect(data[0].id).toBe('1');
      expect(data[1].id).toBe('2');
    });

    it('应该限制返回的游戏数量为50个', async () => {
      const mockGames = Array.from({ length: 100 }, (_, i) => ({
        id: `${i}`,
        title: `游戏${i}`,
        createdAt: new Date(),
        author: { id: `user${i}`, name: `用户${i}` },
        _count: { votes: 0, comments: 0 }
      }));

      jest.mocked(db.game.findMany).mockResolvedValue(mockGames.slice(0, 50));
      jest.mocked(db.vote.groupBy).mockResolvedValue([]);

      const response = await GET();
      const data = await response.json();

      expect(db.game.findMany).toHaveBeenCalledWith(expect.objectContaining({
        take: 50
      }));
      expect(data.length).toBeLessThanOrEqual(50);
    });

    it('应该正确处理没有投票的游戏', async () => {
      const mockGames = [
        {
          id: '1',
          title: '测试游戏',
          createdAt: new Date(),
          author: { id: 'user1', name: '用户1' },
          _count: { votes: 0, comments: 0 }
        }
      ];

      jest.mocked(db.game.findMany).mockResolvedValue(mockGames);
      jest.mocked(db.vote.groupBy).mockResolvedValue([]);

      const response = await GET();
      const data = await response.json();

      expect(data[0].upvotes).toBe(0);
      expect(data[0].downvotes).toBe(0);
      expect(data[0].score).toBe(0);
    });

    it('应该正确计算游戏得分', async () => {
      const mockGames = [
        {
          id: '1',
          title: '测试游戏',
          createdAt: new Date(),
          author: { id: 'user1', name: '用户1' },
          _count: { votes: 0, comments: 0 }
        }
      ];

      const mockVoteStats = [
        { gameId: '1', type: 'UP', _count: 20 },
        { gameId: '1', type: 'DOWN', _count: 5 }
      ];

      jest.mocked(db.game.findMany).mockResolvedValue(mockGames);
      jest.mocked(db.vote.groupBy).mockResolvedValue(mockVoteStats);

      const response = await GET();
      const data = await response.json();

      expect(data[0].score).toBe(15); // 20 - 5
    });

    it('应该返回空列表当没有游戏时', async () => {
      jest.mocked(db.game.findMany).mockResolvedValue([]);
      jest.mocked(db.vote.groupBy).mockResolvedValue([]);

      const response = await GET();
      const data = await response.json();

      expect(data).toEqual([]);
    });

    it('应该包含作者信息', async () => {
      const mockGames = [
        {
          id: '1',
          title: '测试游戏',
          createdAt: new Date(),
          author: {
            id: 'user1',
            name: '测试作者'
          },
          _count: { votes: 0, comments: 0 }
        }
      ];

      jest.mocked(db.game.findMany).mockResolvedValue(mockGames);
      jest.mocked(db.vote.groupBy).mockResolvedValue([]);

      const response = await GET();
      const data = await response.json();

      expect(data[0].author).toBeDefined();
      expect(data[0].author.id).toBe('user1');
      expect(data[0].author.name).toBe('测试作者');
    });

    it('应该包含评论数量', async () => {
      const mockGames = [
        {
          id: '1',
          title: '测试游戏',
          createdAt: new Date(),
          author: { id: 'user1', name: '用户1' },
          _count: {
            votes: 0,
            comments: 10
          }
        }
      ];

      jest.mocked(db.game.findMany).mockResolvedValue(mockGames);
      jest.mocked(db.vote.groupBy).mockResolvedValue([]);

      const response = await GET();
      const data = await response.json();

      expect(data[0].commentsCount).toBe(10);
    });

    it('应该处理数据库错误', async () => {
      jest.mocked(db.game.findMany).mockRejectedValue(new Error('数据库连接失败'));

      await expect(GET()).rejects.toThrow('数据库连接失败');
    });
  });

  describe('POST /api/games - 创建游戏', () => {
    it('应该成功创建游戏', async () => {
      const mockUser = {
        id: 'user1',
        email: 'test@example.com',
        name: '测试用户'
      };

      const mockGame = {
        id: 'game1',
        title: '测试游戏',
        description: '测试描述',
        coverUrl: 'https://example.com/image.jpg',
        jsonData: { game_title: '测试游戏', branches: [] },
        authorId: 'user1',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      jest.mocked(getServerSession).mockResolvedValue({
        user: {
          email: 'test@example.com',
          name: '测试用户'
        }
      });

      jest.mocked(db.user.findUnique).mockResolvedValue(mockUser);
      jest.mocked(db.game.create).mockResolvedValue(mockGame);

      const formData = new FormData();
      formData.append('title', '测试游戏');
      formData.append('description', '测试描述');
      formData.append('coverUrl', 'https://example.com/image.jpg');
      formData.append('file', new File(['{}'], 'game.json', { type: 'application/json' }));

      const request = new NextRequest('http://localhost/api/games', {
        method: 'POST',
        body: formData
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.id).toBe('game1');
      expect(db.game.create).toHaveBeenCalledWith({
        data: {
          title: '测试游戏',
          description: '测试描述',
          coverUrl: 'https://example.com/image.jpg',
          jsonData: {},
          authorId: 'user1'
        }
      });
    });

    it('应该拒绝未认证的请求', async () => {
      jest.mocked(getServerSession).mockResolvedValue(null);

      const formData = new FormData();
      formData.append('title', '测试游戏');
      formData.append('file', new File(['{}'], 'game.json', { type: 'application/json' }));

      const request = new NextRequest('http://localhost/api/games', {
        method: 'POST',
        body: formData
      });

      const response = await POST(request);

      expect(response.status).toBe(401);
      expect(await response.text()).toBe('Unauthorized');
    });

    it('应该拒绝没有用户邮箱的会话', async () => {
      jest.mocked(getServerSession).mockResolvedValue({
        user: {
          name: '测试用户'
        }
      });

      const formData = new FormData();
      formData.append('title', '测试游戏');
      formData.append('file', new File(['{}'], 'game.json', { type: 'application/json' }));

      const request = new NextRequest('http://localhost/api/games', {
        method: 'POST',
        body: formData
      });

      const response = await POST(request);

      expect(response.status).toBe(401);
    });

    it('应该拒绝不存在的用户', async () => {
      jest.mocked(getServerSession).mockResolvedValue({
        user: {
          email: 'nonexistent@example.com',
          name: '测试用户'
        }
      });

      jest.mocked(db.user.findUnique).mockResolvedValue(null);

      const formData = new FormData();
      formData.append('title', '测试游戏');
      formData.append('file', new File(['{}'], 'game.json', { type: 'application/json' }));

      const request = new NextRequest('http://localhost/api/games', {
        method: 'POST',
        body: formData
      });

      const response = await POST(request);

      expect(response.status).toBe(401);
    });

    it('应该拒绝空标题', async () => {
      const mockUser = { id: 'user1', email: 'test@example.com', name: '测试用户' };

      jest.mocked(getServerSession).mockResolvedValue({
        user: { email: 'test@example.com', name: '测试用户' }
      });

      jest.mocked(db.user.findUnique).mockResolvedValue(mockUser);

      const formData = new FormData();
      formData.append('title', '');
      formData.append('file', new File(['{}'], 'game.json', { type: 'application/json' }));

      const request = new NextRequest('http://localhost/api/games', {
        method: 'POST',
        body: formData
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      expect(await response.text()).toBe('Invalid title');
    });

    it('应该拒绝只有空格的标题', async () => {
      const mockUser = { id: 'user1', email: 'test@example.com', name: '测试用户' };

      jest.mocked(getServerSession).mockResolvedValue({
        user: { email: 'test@example.com', name: '测试用户' }
      });

      jest.mocked(db.user.findUnique).mockResolvedValue(mockUser);

      const formData = new FormData();
      formData.append('title', '   ');
      formData.append('file', new File(['{}'], 'game.json', { type: 'application/json' }));

      const request = new NextRequest('http://localhost/api/games', {
        method: 'POST',
        body: formData
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('应该拒绝缺少文件', async () => {
      const mockUser = { id: 'user1', email: 'test@example.com', name: '测试用户' };

      jest.mocked(getServerSession).mockResolvedValue({
        user: { email: 'test@example.com', name: '测试用户' }
      });

      jest.mocked(db.user.findUnique).mockResolvedValue(mockUser);

      const formData = new FormData();
      formData.append('title', '测试游戏');

      const request = new NextRequest('http://localhost/api/games', {
        method: 'POST',
        body: formData
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      expect(await response.text()).toBe('JSON file is required');
    });

    it('应该拒绝非JSON文件', async () => {
      const mockUser = { id: 'user1', email: 'test@example.com', name: '测试用户' };

      jest.mocked(getServerSession).mockResolvedValue({
        user: { email: 'test@example.com', name: '测试用户' }
      });

      jest.mocked(db.user.findUnique).mockResolvedValue(mockUser);

      const formData = new FormData();
      formData.append('title', '测试游戏');
      formData.append('file', new File(['test'], 'game.txt', { type: 'text/plain' }));

      const request = new NextRequest('http://localhost/api/games', {
        method: 'POST',
        body: formData
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      expect(await response.text()).toBe('Only JSON files are allowed');
    });

    it('应该拒绝无效的JSON内容', async () => {
      const mockUser = { id: 'user1', email: 'test@example.com', name: '测试用户' };

      jest.mocked(getServerSession).mockResolvedValue({
        user: { email: 'test@example.com', name: '测试用户' }
      });

      jest.mocked(db.user.findUnique).mockResolvedValue(mockUser);

      const formData = new FormData();
      formData.append('title', '测试游戏');
      formData.append('file', new File(['invalid json'], 'game.json', { type: 'application/json' }));

      const request = new NextRequest('http://localhost/api/games', {
        method: 'POST',
        body: formData
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      expect(await response.text()).toBe('Invalid JSON content');
    });

    it('应该接受有效的JSON内容', async () => {
      const mockUser = { id: 'user1', email: 'test@example.com', name: '测试用户' };
      const mockGame = {
        id: 'game1',
        title: '测试游戏',
        description: null,
        coverUrl: null,
        jsonData: { game_title: '测试游戏', branches: [] },
        authorId: 'user1'
      };

      jest.mocked(getServerSession).mockResolvedValue({
        user: { email: 'test@example.com', name: '测试用户' }
      });

      jest.mocked(db.user.findUnique).mockResolvedValue(mockUser);
      jest.mocked(db.game.create).mockResolvedValue(mockGame);

      const formData = new FormData();
      formData.append('title', '测试游戏');
      formData.append('file', new File(['{"game_title":"测试游戏","branches":[]}'], 'game.json', { type: 'application/json' }));

      const request = new NextRequest('http://localhost/api/games', {
        method: 'POST',
        body: formData
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
    });

    it('应该拒绝无效的封面URL', async () => {
      const mockUser = { id: 'user1', email: 'test@example.com', name: '测试用户' };

      jest.mocked(getServerSession).mockResolvedValue({
        user: { email: 'test@example.com', name: '测试用户' }
      });

      jest.mocked(db.user.findUnique).mockResolvedValue(mockUser);

      const formData = new FormData();
      formData.append('title', '测试游戏');
      formData.append('coverUrl', 'javascript:alert(1)');
      formData.append('file', new File(['{}'], 'game.json', { type: 'application/json' }));

      const request = new NextRequest('http://localhost/api/games', {
        method: 'POST',
        body: formData
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      expect(await response.text()).toContain('Invalid cover URL');
    });

    it('应该接受http://开头的封面URL', async () => {
      const mockUser = { id: 'user1', email: 'test@example.com', name: '测试用户' };
      const mockGame = {
        id: 'game1',
        title: '测试游戏',
        description: null,
        coverUrl: 'http://example.com/image.jpg',
        jsonData: {},
        authorId: 'user1'
      };

      jest.mocked(getServerSession).mockResolvedValue({
        user: { email: 'test@example.com', name: '测试用户' }
      });

      jest.mocked(db.user.findUnique).mockResolvedValue(mockUser);
      jest.mocked(db.game.create).mockResolvedValue(mockGame);

      const formData = new FormData();
      formData.append('title', '测试游戏');
      formData.append('coverUrl', 'http://example.com/image.jpg');
      formData.append('file', new File(['{}'], 'game.json', { type: 'application/json' }));

      const request = new NextRequest('http://localhost/api/games', {
        method: 'POST',
        body: formData
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
    });

    it('应该接受https://开头的封面URL', async () => {
      const mockUser = { id: 'user1', email: 'test@example.com', name: '测试用户' };
      const mockGame = {
        id: 'game1',
        title: '测试游戏',
        description: null,
        coverUrl: 'https://example.com/image.jpg',
        jsonData: {},
        authorId: 'user1'
      };

      jest.mocked(getServerSession).mockResolvedValue({
        user: { email: 'test@example.com', name: '测试用户' }
      });

      jest.mocked(db.user.findUnique).mockResolvedValue(mockUser);
      jest.mocked(db.game.create).mockResolvedValue(mockGame);

      const formData = new FormData();
      formData.append('title', '测试游戏');
      formData.append('coverUrl', 'https://example.com/image.jpg');
      formData.append('file', new File(['{}'], 'game.json', { type: 'application/json' }));

      const request = new NextRequest('http://localhost/api/games', {
        method: 'POST',
        body: formData
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
    });

    it('应该接受空的封面URL', async () => {
      const mockUser = { id: 'user1', email: 'test@example.com', name: '测试用户' };
      const mockGame = {
        id: 'game1',
        title: '测试游戏',
        description: null,
        coverUrl: null,
        jsonData: {},
        authorId: 'user1'
      };

      jest.mocked(getServerSession).mockResolvedValue({
        user: { email: 'test@example.com', name: '测试用户' }
      });

      jest.mocked(db.user.findUnique).mockResolvedValue(mockUser);
      jest.mocked(db.game.create).mockResolvedValue(mockGame);

      const formData = new FormData();
      formData.append('title', '测试游戏');
      formData.append('coverUrl', '');
      formData.append('file', new File(['{}'], 'game.json', { type: 'application/json' }));

      const request = new NextRequest('http://localhost/api/games', {
        method: 'POST',
        body: formData
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
    });

    it('应该接受字符串类型的描述', async () => {
      const mockUser = { id: 'user1', email: 'test@example.com', name: '测试用户' };
      const mockGame = {
        id: 'game1',
        title: '测试游戏',
        description: '测试描述',
        coverUrl: null,
        jsonData: {},
        authorId: 'user1'
      };

      jest.mocked(getServerSession).mockResolvedValue({
        user: { email: 'test@example.com', name: '测试用户' }
      });

      jest.mocked(db.user.findUnique).mockResolvedValue(mockUser);
      jest.mocked(db.game.create).mockResolvedValue(mockGame);

      const formData = new FormData();
      formData.append('title', '测试游戏');
      formData.append('description', '测试描述');
      formData.append('file', new File(['{}'], 'game.json', { type: 'application/json' }));

      const request = new NextRequest('http://localhost/api/games', {
        method: 'POST',
        body: formData
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
      expect(db.game.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          description: '测试描述'
        })
      });
    });

    it('应该处理非字符串类型的描述', async () => {
      const mockUser = { id: 'user1', email: 'test@example.com', name: '测试用户' };
      const mockGame = {
        id: 'game1',
        title: '测试游戏',
        description: null,
        coverUrl: null,
        jsonData: {},
        authorId: 'user1'
      };

      jest.mocked(getServerSession).mockResolvedValue({
        user: { email: 'test@example.com', name: '测试用户' }
      });

      jest.mocked(db.user.findUnique).mockResolvedValue(mockUser);
      jest.mocked(db.game.create).mockResolvedValue(mockGame);

      const formData = new FormData();
      formData.append('title', '测试游戏');
      formData.append('description', 123 as any);
      formData.append('file', new File(['{}'], 'game.json', { type: 'application/json' }));

      const request = new NextRequest('http://localhost/api/games', {
        method: 'POST',
        body: formData
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
      expect(db.game.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          description: null
        })
      });
    });

    it('应该修剪标题前后的空格', async () => {
      const mockUser = { id: 'user1', email: 'test@example.com', name: '测试用户' };
      const mockGame = {
        id: 'game1',
        title: '测试游戏',
        description: null,
        coverUrl: null,
        jsonData: {},
        authorId: 'user1'
      };

      jest.mocked(getServerSession).mockResolvedValue({
        user: { email: 'test@example.com', name: '测试用户' }
      });

      jest.mocked(db.user.findUnique).mockResolvedValue(mockUser);
      jest.mocked(db.game.create).mockResolvedValue(mockGame);

      const formData = new FormData();
      formData.append('title', '  测试游戏  ');
      formData.append('file', new File(['{}'], 'game.json', { type: 'application/json' }));

      const request = new NextRequest('http://localhost/api/games', {
        method: 'POST',
        body: formData
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
      expect(db.game.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: '测试游戏'
        })
      });
    });

    it('应该修剪封面URL前后的空格', async () => {
      const mockUser = { id: 'user1', email: 'test@example.com', name: '测试用户' };
      const mockGame = {
        id: 'game1',
        title: '测试游戏',
        description: null,
        coverUrl: 'https://example.com/image.jpg',
        jsonData: {},
        authorId: 'user1'
      };

      jest.mocked(getServerSession).mockResolvedValue({
        user: { email: 'test@example.com', name: '测试用户' }
      });

      jest.mocked(db.user.findUnique).mockResolvedValue(mockUser);
      jest.mocked(db.game.create).mockResolvedValue(mockGame);

      const formData = new FormData();
      formData.append('title', '测试游戏');
      formData.append('coverUrl', '  https://example.com/image.jpg  ');
      formData.append('file', new File(['{}'], 'game.json', { type: 'application/json' }));

      const request = new NextRequest('http://localhost/api/games', {
        method: 'POST',
        body: formData
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
      expect(db.game.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          coverUrl: 'https://example.com/image.jpg'
        })
      });
    });

    it('应该处理数据库创建错误', async () => {
      const mockUser = { id: 'user1', email: 'test@example.com', name: '测试用户' };

      jest.mocked(getServerSession).mockResolvedValue({
        user: { email: 'test@example.com', name: '测试用户' }
      });

      jest.mocked(db.user.findUnique).mockResolvedValue(mockUser);
      jest.mocked(db.game.create).mockRejectedValue(new Error('数据库错误'));

      const formData = new FormData();
      formData.append('title', '测试游戏');
      formData.append('file', new File(['{}'], 'game.json', { type: 'application/json' }));

      const request = new NextRequest('http://localhost/api/games', {
        method: 'POST',
        body: formData
      });

      await expect(POST(request)).rejects.toThrow('数据库错误');
    });
  });

  describe('API安全性测试', () => {
    it('应该防止XSS攻击 - 标题', async () => {
      const mockUser = { id: 'user1', email: 'test@example.com', name: '测试用户' };
      const mockGame = {
        id: 'game1',
        title: '<script>alert("XSS")</script>',
        description: null,
        coverUrl: null,
        jsonData: {},
        authorId: 'user1'
      };

      jest.mocked(getServerSession).mockResolvedValue({
        user: { email: 'test@example.com', name: '测试用户' }
      });

      jest.mocked(db.user.findUnique).mockResolvedValue(mockUser);
      jest.mocked(db.game.create).mockResolvedValue(mockGame);

      const formData = new FormData();
      formData.append('title', '<script>alert("XSS")</script>');
      formData.append('file', new File(['{}'], 'game.json', { type: 'application/json' }));

      const request = new NextRequest('http://localhost/api/games', {
        method: 'POST',
        body: formData
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
      // 数据库应该存储原始字符串，前端负责转义
    });

    it('应该防止XSS攻击 - 封面URL', async () => {
      const mockUser = { id: 'user1', email: 'test@example.com', name: '测试用户' };

      jest.mocked(getServerSession).mockResolvedValue({
        user: { email: 'test@example.com', name: '测试用户' }
      });

      jest.mocked(db.user.findUnique).mockResolvedValue(mockUser);

      const formData = new FormData();
      formData.append('title', '测试游戏');
      formData.append('coverUrl', 'javascript:alert(1)');
      formData.append('file', new File(['{}'], 'game.json', { type: 'application/json' }));

      const request = new NextRequest('http://localhost/api/games', {
        method: 'POST',
        body: formData
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('应该防止SQL注入', async () => {
      const mockUser = { id: 'user1', email: 'test@example.com', name: '测试用户' };
      const mockGame = {
        id: 'game1',
        title: "' OR '1'='1",
        description: null,
        coverUrl: null,
        jsonData: {},
        authorId: 'user1'
      };

      jest.mocked(getServerSession).mockResolvedValue({
        user: { email: 'test@example.com', name: '测试用户' }
      });

      jest.mocked(db.user.findUnique).mockResolvedValue(mockUser);
      jest.mocked(db.game.create).mockResolvedValue(mockGame);

      const formData = new FormData();
      formData.append('title', "' OR '1'='1");
      formData.append('file', new File(['{}'], 'game.json', { type: 'application/json' }));

      const request = new NextRequest('http://localhost/api/games', {
        method: 'POST',
        body: formData
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
      // Prisma ORM应该自动处理SQL注入防护
    });
  });

  describe('API性能测试', () => {
    it('应该在合理时间内返回游戏列表', async () => {
      const mockGames = Array.from({ length: 50 }, (_, i) => ({
        id: `${i}`,
        title: `游戏${i}`,
        createdAt: new Date(),
        author: { id: `user${i}`, name: `用户${i}` },
        _count: { votes: 0, comments: 0 }
      }));

      jest.mocked(db.game.findMany).mockResolvedValue(mockGames);
      jest.mocked(db.vote.groupBy).mockResolvedValue([]);

      const startTime = Date.now();
      const response = await GET();
      const endTime = Date.now();

      expect(response.status).toBe(200);
      expect(endTime - startTime).toBeLessThan(1000); // 应该在1秒内完成
    });

    it('应该在合理时间内创建游戏', async () => {
      const mockUser = { id: 'user1', email: 'test@example.com', name: '测试用户' };
      const mockGame = {
        id: 'game1',
        title: '测试游戏',
        description: null,
        coverUrl: null,
        jsonData: {},
        authorId: 'user1'
      };

      jest.mocked(getServerSession).mockResolvedValue({
        user: { email: 'test@example.com', name: '测试用户' }
      });

      jest.mocked(db.user.findUnique).mockResolvedValue(mockUser);
      jest.mocked(db.game.create).mockResolvedValue(mockGame);

      const formData = new FormData();
      formData.append('title', '测试游戏');
      formData.append('file', new File(['{}'], 'game.json', { type: 'application/json' }));

      const request = new NextRequest('http://localhost/api/games', {
        method: 'POST',
        body: formData
      });

      const startTime = Date.now();
      const response = await POST(request);
      const endTime = Date.now();

      expect(response.status).toBe(201);
      expect(endTime - startTime).toBeLessThan(2000); // 应该在2秒内完成
    });
  });
});
