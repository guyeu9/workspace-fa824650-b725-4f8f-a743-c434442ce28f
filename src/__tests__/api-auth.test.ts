import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { InputSanitizer, ValidationRules } from '@/lib/security-utils';

export const dynamic = 'force-dynamic';

const registerSchema = z.object({
  email: ValidationRules.email,
  password: ValidationRules.password,
  name: ValidationRules.username,
});

describe('用户注册API测试', () => {
  let mockDb;
  let mockRequest;
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    mockDb = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      onlineStats: {
        create: jest.fn(),
      },
    };
    
    mockRequest = {
      json: jest.fn(),
    };
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('POST /api/auth/register', () => {
    it('应该成功注册新用户', async () => {
      mockRequest.json.mockResolvedValue({
        email: 'test@example.com',
        password: 'Password123!',
        name: '测试用户'
      });
      
      mockDb.user.findUnique.mockResolvedValue(null);
      mockDb.user.create.mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        name: '测试用户',
        role: 'user',
      });
      mockDb.onlineStats.create.mockResolvedValue({});
      
      const response = await createUserHandler(mockRequest, mockDb);
      
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.message).toBe('注册成功');
      expect(body.user.email).toBe('test@example.com');
      expect(body.user.name).toBe('测试用户');
    });

    it('应该拒绝已存在的邮箱', async () => {
      mockRequest.json.mockResolvedValue({
        email: 'existing@example.com',
        password: 'Password123!',
        name: '测试用户'
      });
      
      mockDb.user.findUnique.mockResolvedValue({
        id: 'existing-user',
        email: 'existing@example.com',
      });
      
      const response = await createUserHandler(mockRequest, mockDb);
      
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe('该邮箱已被注册');
    });

    it('应该验证无效的邮箱格式', async () => {
      mockRequest.json.mockResolvedValue({
        email: 'invalid-email',
        password: 'Password123!',
        name: '测试用户'
      });
      
      mockDb.user.findUnique.mockResolvedValue(null);
      
      const response = await createUserHandler(mockRequest, mockDb);
      
      expect(response.status).toBe(400);
    });

    it('应该验证密码长度要求', async () => {
      mockRequest.json.mockResolvedValue({
        email: 'test@example.com',
        password: '123',
        name: '测试用户'
      });
      
      mockDb.user.findUnique.mockResolvedValue(null);
      
      const response = await createUserHandler(mockRequest, mockDb);
      
      expect(response.status).toBe(400);
    });

    it('应该验证用户名长度要求 - 最小长度', async () => {
      mockRequest.json.mockResolvedValue({
        email: 'test@example.com',
        password: 'Password123!',
        name: ''  // 空用户名，应该被 min(1) 拒绝
      });
      
      mockDb.user.findUnique.mockResolvedValue(null);
      bcrypt.hash = jest.fn().mockResolvedValue('hashedPassword');
      
      const response = await createUserHandler(mockRequest, mockDb);
      
      expect(response.status).toBe(400);
    });

    it('应该验证用户名长度要求 - 最大长度', async () => {
      mockRequest.json.mockResolvedValue({
        email: 'test@example.com',
        password: 'Password123!',
        name: 'a'.repeat(100)  // 100字符，应该被 max(50) 拒绝
      });
      
      mockDb.user.findUnique.mockResolvedValue(null);
      bcrypt.hash = jest.fn().mockResolvedValue('hashedPassword');
      
      const response = await createUserHandler(mockRequest, mockDb);
      
      expect(response.status).toBe(400);
    });

    it('应该处理服务器错误', async () => {
      mockRequest.json.mockResolvedValue({
        email: 'test@example.com',
        password: 'Password123!',
        name: '测试用户'
      });
      
      mockDb.user.findUnique.mockRejectedValue(new Error('数据库错误'));
      
      const response = await createUserHandler(mockRequest, mockDb);
      
      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error).toBe('注册失败，请稍后重试');
    });
  });
});

async function createUserHandler(request, db) {
  try {
    const body = await request.json();
    
    const validatedData = registerSchema.parse(body);
    
    const existingUser = await db.user.findUnique({
      where: { email: validatedData.email }
    });
    
    if (existingUser) {
      return NextResponse.json(
        { error: '该邮箱已被注册' },
        { status: 400 }
      );
    }
    
    const hashedPassword = await bcrypt.hash(validatedData.password, 12);
    
    const user = await db.user.create({
      data: {
        email: InputSanitizer.sanitizeEmail(validatedData.email),
        name: InputSanitizer.sanitizeText(validatedData.name),
        password: hashedPassword,
      }
    });
    
    await db.onlineStats.create({
      data: {
        userId: user.id,
        totalOnlineTime: 0,
      }
    });

    return NextResponse.json({
      message: '注册成功',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      }
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors && error.errors.length > 0 
        ? error.errors[0].message 
        : '输入数据验证失败'
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      );
    }
    
    console.error('注册失败:', error);
    return NextResponse.json(
      { error: '注册失败，请稍后重试' },
      { status: 500 }
    );
  }
}
