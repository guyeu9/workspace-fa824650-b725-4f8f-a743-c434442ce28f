// 测试文件导出功能的修复
import { fileExportManager } from './src/lib/file-export'

async function testExportFunctions() {
  console.log('🧪 开始测试文件导出功能修复...')
  
  try {
    // 测试JSON导出
    console.log('📋 测试JSON导出...')
    const testData = {
      game_title: '测试游戏',
      description: '这是一个测试游戏',
      branches: [
        {
          branch_id: 'test_1',
          chapter: '第一章',
          scene_detail: '测试场景描述',
          choices: []
        }
      ]
    }
    
    const jsonResult = await fileExportManager.exportJson('test-game.json', testData, false)
    console.log('JSON导出结果:', jsonResult)
    
    // 测试文本导出
    console.log('📝 测试文本导出...')
    const testText = '这是一个测试游戏日志\n包含多行文本\n用于测试导出功能'
    
    const textResult = await fileExportManager.exportText('test-log.txt', testText, false)
    console.log('文本导出结果:', textResult)
    
    console.log('✅ 所有测试完成！')
    
  } catch (error) {
    console.error('❌ 测试失败:', error)
  }
}

// 如果直接运行此脚本，执行测试
if (typeof window === 'undefined') {
  testExportFunctions()
}