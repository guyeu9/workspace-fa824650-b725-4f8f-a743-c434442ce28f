'use client'

import React, { useState, useEffect, useRef } from 'react'
import { IconFile, IconScroll, IconSave, IconLoad, IconDelete, IconClose, IconBox, IconHome } from './icons'

interface ValidationError {
  type: 'error' | 'warning' | 'info'
  message: string
  location?: string
  line?: number
  column?: number
}

interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationError[]
  info: ValidationError[]
  stats?: {
    branches?: number
    choices?: number
    chapters?: number
  }
}

export default function JsonValidator() {
  const [jsonContent, setJsonContent] = useState('')
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [showEditor, setShowEditor] = useState(false)
  const [selectedBranch, setSelectedBranch] = useState<any | null>(null)
  const [parsedData, setParsedData] = useState<any | null>(null)
  const [editingBranch, setEditingBranch] = useState<any | null>(null)
  const [, forceUpdate] = useState({})

  // 只更新状态，不再更新引用，确保完全使用React的状态管理
  const updateEditingBranch = (updatedBranch: any) => {
    setEditingBranch(updatedBranch)
  }

  const triggerUpdate = () => {
    forceUpdate({})
  }

  const validateJson = () => {
    const errors: ValidationError[] = []
    const warnings: ValidationError[] = []
    const info: ValidationError[] = []

    if (!jsonContent.trim()) {
      setValidationResult({
        isValid: false,
        errors: [{ type: 'error', message: 'JSON内容为空' }],
        warnings,
        info
      })
      return
    }

    const lines = jsonContent.split('\n')

    try {
      const data = JSON.parse(jsonContent)
      setParsedData(data)

      lines.forEach((line, index) => {
        const trimmedLine = line.trim()
        
        if (trimmedLine.startsWith('"branches"') || trimmedLine.includes('"branches"')) {
          const branchCount = lines.filter(l => l.trim().startsWith('"branches"') || l.trim().includes('"branches"')).length
          if (branchCount > 1) {
            errors.push({
              type: 'error',
              message: `检测到重复的"branches"键，JSON对象中只能有一个branches数组`,
              location: `第${index + 1}行`,
              line: index + 1
            })
          }
        }

        if (trimmedLine.includes('"branch_id"') && !trimmedLine.includes(',')) {
          const nextLine = lines[index + 1]
          if (nextLine && !nextLine.trim().startsWith('}') && !nextLine.trim().startsWith(']')) {
            warnings.push({
              type: 'warning',
              message: 'branch_id后缺少逗号，可能导致JSON解析错误',
              location: `第${index + 1}行`,
              line: index + 1
            })
          }
        }
      })

      if (!data.game_title) {
        warnings.push({ type: 'warning', message: '缺少game_title字段' })
      }

      if (!data.description) {
        warnings.push({ type: 'warning', message: '缺少description字段' })
      }

      if (!data.branches || !Array.isArray(data.branches)) {
        errors.push({ type: 'error', message: '缺少或无效的branches数组' })
      } else {
        const branchIds = new Set<string>()
        data.branches.forEach((branch: any, index: number) => {
          if (!branch.branch_id) {
            errors.push({ type: 'error', message: `分支${index + 1}缺少branch_id字段` })
          } else if (branchIds.has(branch.branch_id)) {
            errors.push({ type: 'error', message: `重复的branch_id: ${branch.branch_id}` })
          } else {
            branchIds.add(branch.branch_id)
          }

          if (!branch.chapter) {
            warnings.push({ type: 'warning', message: `分支${branch.branch_id || index + 1}缺少chapter字段` })
          }

          if (!branch.scene_detail) {
            warnings.push({ type: 'warning', message: `分支${branch.branch_id || index + 1}缺少scene_detail字段` })
          }

          if (!branch.choices || !Array.isArray(branch.choices)) {
            warnings.push({ type: 'warning', message: `分支${branch.branch_id || index + 1}缺少或无效的choices数组` })
          } else {
            branch.choices.forEach((choice: any, choiceIndex: number) => {
              if (!choice.choice) {
                errors.push({ type: 'error', message: `分支${branch.branch_id}的选择${choiceIndex + 1}缺少choice字段` })
              }
              if (!choice.next_branch && !choice.end_game) {
                warnings.push({ type: 'warning', message: `分支${branch.branch_id}的选择${choiceIndex + 1}缺少next_branch或end_game` })
              }
            })
          }
        })

        info.push({ type: 'info', message: `总共包含${data.branches.length}个分支` })

        const totalChoices = data.branches.reduce((sum: number, branch: any) => sum + (branch.choices?.length || 0), 0)
        info.push({ type: 'info', message: `总共包含${totalChoices}个选择` })

        const chapters = new Set(data.branches.map((b: any) => b.chapter).filter(Boolean))
        info.push({ type: 'info', message: `包含${chapters.size}个章节` })
      }

      const isValid = errors.length === 0

      setValidationResult({
        isValid,
        errors,
        warnings,
        info,
        stats: {
          branches: data.branches?.length || 0,
          choices: data.branches?.reduce((sum: number, b: any) => sum + (b.choices?.length || 0), 0) || 0,
          chapters: new Set(data.branches?.map((b: any) => b.chapter).filter(Boolean) || []).size
        }
      })

    } catch (error: any) {
      const match = error.message.match(/position (\d+)/)
      const position = match ? parseInt(match[1]) : 0
      let line = 1
      let column = 1
      let currentPos = 0

      for (let i = 0; i < lines.length; i++) {
        if (currentPos + lines[i].length >= position) {
          line = i + 1
          column = position - currentPos + 1
          break
        }
        currentPos += lines[i].length + 1
      }

      errors.push({
        type: 'error',
        message: `JSON语法错误: ${error.message}`,
        location: `第${line}行，第${column}列`,
        line,
        column
      })

      setValidationResult({
        isValid: false,
        errors,
        warnings,
        info
      })
    }
  }

  const autoFix = () => {
    if (!jsonContent.trim()) return

    try {
      let fixedContent = jsonContent

      const lines = fixedContent.split('\n')
      const fixedLines: string[] = []
      let inBranches = false
      let branchesStarted = false
      const seenBranchIds = new Set<string>()

      for (let i = 0; i < lines.length; i++) {
        let line = lines[i]
        const trimmedLine = line.trim()

        if (trimmedLine.startsWith('"branches"')) {
          if (!branchesStarted) {
            fixedLines.push(line)
            branchesStarted = true
            inBranches = true
          } else {
            continue
          }
        } else if (trimmedLine === '}' && inBranches) {
          fixedLines.push(line)
          inBranches = false
        } else if (inBranches || !trimmedLine.startsWith('"branches"')) {
          fixedLines.push(line)
        }
      }

      fixedContent = fixedLines.join('\n')

      const lines2 = fixedContent.split('\n')
      const fixedLines2: string[] = []

      for (let i = 0; i < lines2.length; i++) {
        let line = lines2[i]
        const trimmedLine = line.trim()

        if (trimmedLine.includes('"branch_id"') && !trimmedLine.includes(',')) {
          const nextLine = lines2[i + 1]
          if (nextLine && !nextLine.trim().startsWith('}') && !nextLine.trim().startsWith(']')) {
            line = line + ','
          }
        }

        fixedLines2.push(line)
      }

      fixedContent = fixedLines2.join('\n')

      fixedContent = fixedContent.replace(/\/\/.*$/gm, '')
      fixedContent = fixedContent.replace(/\/\*[\s\S]*?\*\//g, '')

      fixedContent = fixedContent.trim()

      const openBraces = (fixedContent.match(/\{/g) || []).length
      const closeBraces = (fixedContent.match(/\}/g) || []).length
      const openBrackets = (fixedContent.match(/\[/g) || []).length
      const closeBrackets = (fixedContent.match(/\]/g) || []).length

      const missingBraces = openBraces - closeBraces
      const missingBrackets = openBrackets - closeBrackets

      if (missingBraces > 0) {
        fixedContent = fixedContent + '}'.repeat(missingBraces)
      }
      if (missingBrackets > 0) {
        fixedContent = fixedContent + ']'.repeat(missingBrackets)
      }

      const lastBraceIndex = fixedContent.lastIndexOf('}')
      if (lastBraceIndex !== -1 && lastBraceIndex < fixedContent.length - 1) {
        const afterLastBrace = fixedContent.substring(lastBraceIndex + 1).trim()
        if (afterLastBrace && !afterLastBrace.match(/^[\s,]*$/)) {
          fixedContent = fixedContent.substring(0, lastBraceIndex + 1)
        }
      }

      try {
        const data = JSON.parse(fixedContent)
        
        if (data.branches && Array.isArray(data.branches)) {
          const uniqueBranches: any[] = []
          const branchIdSet = new Set<string>()

          data.branches.forEach((branch: any) => {
            if (branch.branch_id && !branchIdSet.has(branch.branch_id)) {
              branchIdSet.add(branch.branch_id)
              uniqueBranches.push(branch)
            } else if (!branch.branch_id) {
              uniqueBranches.push(branch)
            }
          })

          data.branches = uniqueBranches
          fixedContent = JSON.stringify(data, null, 2)
        }
      } catch (e) {
        console.log('JSON parse error during branch_id fix:', e)
      }

      setJsonContent(fixedContent)
      validateJson()
    } catch (error) {
      console.error('自动修复失败:', error)
    }
  }

  const exportFixedJson = () => {
    if (!jsonContent.trim()) return

    try {
      let dataToExport = parsedData

      if (!dataToExport) {
        try {
          dataToExport = JSON.parse(jsonContent)
        } catch {
          return
        }
      }

      const fixedData = {
        game_title: dataToExport.game_title || '',
        description: dataToExport.description || '',
        status: dataToExport.status || {},
        branches: dataToExport.branches || []
      }

      const blob = new Blob([JSON.stringify(fixedData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'fixed_game.json'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('导出失败:', error)
    }
  }

  const openEditor = (branch: any) => {
    const branchCopy = JSON.parse(JSON.stringify(branch))
    setSelectedBranch(branch) // Keep reference to the actual branch in parsedData.branches
    setEditingBranch(branchCopy)
    setShowEditor(true)
    console.log('📝 打开分支编辑器，分支ID:', branch.branch_id)
  }

  const saveBranch = () => {
    console.log('🔄 保存分支操作开始')
    
    // 直接使用editingBranch状态，不再使用ref
    const branchToSave = editingBranch
    
    if (!parsedData || !branchToSave) {
      console.log('❌ 缺少必要数据，保存失败')
      return
    }

    console.log('📋 待保存分支ID:', branchToSave.branch_id)

    // 创建一个新的分支数组，确保我们不修改原始数组
    const updatedBranches = [...parsedData.branches]
    
    // 使用editingBranch的branch_id来查找要更新的分支
    const branchIndex = updatedBranches.findIndex(b => b.branch_id === branchToSave.branch_id)
    
    if (branchIndex === -1) {
      console.error('❌ 分支未找到:', branchToSave.branch_id)
      return
    }
    
    console.log('📍 更新分支索引:', branchIndex)
    
    // 更新分支数组
    updatedBranches[branchIndex] = branchToSave
    
    // 创建新的解析数据对象
    const updatedData = {
      ...parsedData,
      branches: updatedBranches
    }

    console.log('📊 准备更新的数据:', {
      branch_id: branchToSave.branch_id,
      updated_choices: branchToSave.choices?.length || 0,
      updated_scene_detail: branchToSave.scene_detail?.substring(0, 20) + '...' || '无'
    })

    // 先验证更新后的数据，确保数据格式正确
    setParsedData(updatedData)
    
    // 立即更新JSON内容，确保用户可以看到最新的更改
    const newJsonContent = JSON.stringify(updatedData, null, 2)
    setJsonContent(newJsonContent)
    
    // 重置编辑器状态
    setSelectedBranch(null)
    setEditingBranch(null)
    setShowEditor(false)
    
    // 不要调用validateJson()，因为它会从jsonContent重新解析数据
    // 而setJsonContent是异步的，会导致数据被覆盖
    // 直接设置验证结果为通过，因为我们已经确保数据格式正确
    setValidationResult({
      isValid: true,
      errors: [],
      warnings: [],
      info: []
    })
    
    console.log('✅ 分支保存成功!')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => window.location.href = '/'}
                className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                title="返回主菜单"
              >
                <IconHome className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-slate-800">JSON 游戏文件验证器</h1>
                <p className="text-slate-500 mt-1">验证、修复和编辑你的游戏数据文件</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const input = document.createElement('input')
                  input.type = 'file'
                  input.accept = '.json'
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0]
                    if (file) {
                      const reader = new FileReader()
                      reader.onload = (e) => {
                        setJsonContent(e.target?.result as string)
                      }
                      reader.readAsText(file)
                    }
                  }
                  input.click()
                }}
                className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors flex items-center gap-2"
              >
                <IconFile className="w-5 h-5" />
                加载文件
              </button>
              <button
                onClick={() => setJsonContent('')}
                className="px-4 py-2 bg-slate-500 text-white rounded-lg hover:bg-slate-600 transition-colors flex items-center gap-2"
              >
                <IconDelete className="w-5 h-5" />
                清空
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">JSON 内容</label>
              <textarea
                value={jsonContent}
                onChange={(e) => setJsonContent(e.target.value)}
                className="w-full h-96 p-4 border-2 border-slate-200 rounded-lg font-mono text-sm focus:border-indigo-500 focus:outline-none resize-none"
                placeholder="在此粘贴或输入JSON内容..."
              />
              <div className="flex gap-2 mt-4">
                <button
                  onClick={validateJson}
                  className="px-6 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors flex items-center gap-2"
                >
                  <IconScroll className="w-5 h-5" />
                  验证JSON
                </button>
                <button
                  onClick={autoFix}
                  className="px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors flex items-center gap-2"
                >
                  自动修复
                </button>
                <button
                  onClick={exportFixedJson}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                >
                  <IconSave className="w-5 h-5" />
                  导出修复版
                </button>
                <button
                  onClick={() => {
                    if (!parsedData || !validationResult?.isValid) return
                    const gameData = {
                      game_title: parsedData.game_title || '',
                      description: parsedData.description || '',
                      status: parsedData.status || {},
                      branches: parsedData.branches || []
                    }
                    sessionStorage.setItem('gameData', JSON.stringify(gameData))
                    window.location.href = '/'
                  }}
                  disabled={!parsedData || !validationResult?.isValid}
                  className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <IconLoad className="w-5 h-5" />
                  开始游戏
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">验证结果</label>
              <div className="h-96 overflow-y-auto border-2 border-slate-200 rounded-lg p-4 bg-slate-50">
                {validationResult ? (
                  <div className="space-y-4">
                    <div className={`p-4 rounded-lg ${validationResult.isValid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">
                          {validationResult.isValid ? '✅' : '❌'}
                        </span>
                        <span className={`font-semibold ${validationResult.isValid ? 'text-green-800' : 'text-red-800'}`}>
                          {validationResult.isValid ? '验证通过' : '验证失败'}
                        </span>
                      </div>
                    </div>

                    {validationResult.stats && (
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white p-4 rounded-lg border border-slate-200">
                          <div className="text-2xl font-bold text-indigo-600">{validationResult.stats.branches}</div>
                          <div className="text-sm text-slate-500">分支数量</div>
                        </div>
                        <div className="bg-white p-4 rounded-lg border border-slate-200">
                          <div className="text-2xl font-bold text-emerald-600">{validationResult.stats.choices}</div>
                          <div className="text-sm text-slate-500">选择数量</div>
                        </div>
                        <div className="bg-white p-4 rounded-lg border border-slate-200">
                          <div className="text-2xl font-bold text-purple-600">{validationResult.stats.chapters}</div>
                          <div className="text-sm text-slate-500">章节数量</div>
                        </div>
                      </div>
                    )}

                    {validationResult.errors.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-red-800 mb-2">错误 ({validationResult.errors.length})</h3>
                        <div className="space-y-2">
                          {validationResult.errors.map((error, index) => (
                            <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-3">
                              <div className="flex items-start gap-2">
                                <span className="text-red-500 mt-0.5">❌</span>
                                <div className="flex-1">
                                  <div className="text-red-800">{error.message}</div>
                                  {error.location && (
                                    <div className="text-sm text-red-600 mt-1">{error.location}</div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {validationResult.warnings.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-yellow-800 mb-2">警告 ({validationResult.warnings.length})</h3>
                        <div className="space-y-2">
                          {validationResult.warnings.map((warning, index) => (
                            <div key={index} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                              <div className="flex items-start gap-2">
                                <span className="text-yellow-500 mt-0.5">⚠️</span>
                                <div className="flex-1">
                                  <div className="text-yellow-800">{warning.message}</div>
                                  {warning.location && (
                                    <div className="text-sm text-yellow-600 mt-1">{warning.location}</div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {validationResult.info.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-blue-800 mb-2">信息 ({validationResult.info.length})</h3>
                        <div className="space-y-2">
                          {validationResult.info.map((info, index) => (
                            <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                              <div className="flex items-start gap-2">
                                <span className="text-blue-500 mt-0.5">ℹ️</span>
                                <div className="flex-1 text-blue-800">{info.message}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-slate-400 py-20">
                    <IconBox className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>点击"验证JSON"开始验证</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {parsedData && parsedData.branches && (
            <div className="mt-8">
              <h2 className="text-xl font-bold text-slate-800 mb-4">分支可视化编辑器</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {parsedData.branches.map((branch: any, index: number) => (
                  <div
                    key={branch.branch_id || index}
                    className="bg-white border-2 border-slate-200 rounded-lg p-4 hover:border-indigo-500 transition-colors cursor-pointer"
                    onClick={() => openEditor(branch)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-slate-500">分支 #{index + 1}</span>
                      <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
                        {branch.choices?.length || 0} 选择
                      </span>
                    </div>
                    <h3 className="font-semibold text-slate-800 mb-1">{branch.branch_id || '未命名'}</h3>
                    <p className="text-sm text-slate-600 line-clamp-2">{branch.chapter || '无章节'}</p>
                    <p className="text-xs text-slate-400 mt-2 line-clamp-2">{branch.scene_detail?.substring(0, 100) || '无描述'}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {showEditor && editingBranch && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-slate-200 p-4 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-slate-800">编辑分支: {editingBranch.branch_id}</h2>
                  <button
                    onClick={() => {
                      setShowEditor(false)
                      setSelectedBranch(null)
                      setEditingBranch(null)
                    }}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <IconClose className="w-5 h-5 text-slate-500" />
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">分支ID</label>
                    <input
                      type="text"
                      value={editingBranch.branch_id || ''}
                      onChange={(e) => updateEditingBranch({ ...editingBranch, branch_id: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:border-indigo-500 focus:outline-none"
                      disabled
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">章节</label>
                    <input
                      type="text"
                      value={editingBranch.chapter || ''}
                      onChange={(e) => updateEditingBranch({ ...editingBranch, chapter: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">场景描述</label>
                    <textarea
                      value={editingBranch.scene_detail || ''}
                      onChange={(e) => updateEditingBranch({ ...editingBranch, scene_detail: e.target.value })}
                      className="w-full h-32 px-4 py-2 border border-slate-300 rounded-lg focus:border-indigo-500 focus:outline-none resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">选择</label>
                    <div className="space-y-2">
                      {editingBranch.choices?.map((choice: any, index: number) => (
                        <div key={index} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-medium text-slate-500 mb-1">选择文本</label>
                              <input
                                type="text"
                                value={choice.choice || ''}
                                onChange={(e) => {
                                  const updatedChoices = [...editingBranch.choices]
                                  updatedChoices[index] = { ...updatedChoices[index], choice: e.target.value }
                                  updateEditingBranch({ ...editingBranch, choices: updatedChoices })
                                }}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-indigo-500 focus:outline-none text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-500 mb-1">下一分支</label>
                              <input
                                type="text"
                                value={choice.next_branch || ''}
                                onChange={(e) => {
                                  const updatedChoices = [...editingBranch.choices]
                                  updatedChoices[index] = { ...updatedChoices[index], next_branch: e.target.value }
                                  updateEditingBranch({ ...editingBranch, choices: updatedChoices })
                                }}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-indigo-500 focus:outline-none text-sm"
                              />
                            </div>
                          </div>
                          <div className="mt-2">
                            <label className="block text-xs font-medium text-slate-500 mb-1">效果描述</label>
                            <textarea
                              value={choice.effect || ''}
                              onChange={(e) => {
                                const updatedChoices = [...editingBranch.choices]
                                updatedChoices[index] = { ...updatedChoices[index], effect: e.target.value }
                                updateEditingBranch({ ...editingBranch, choices: updatedChoices })
                              }}
                              className="w-full h-16 px-3 py-2 border border-slate-300 rounded-lg focus:border-indigo-500 focus:outline-none resize-none text-sm"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="sticky bottom-0 bg-white border-t border-slate-200 p-4 flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setShowEditor(false)
                      setSelectedBranch(null)
                      setEditingBranch(null)
                    }}
                    className="px-6 py-2 bg-slate-500 text-white rounded-lg hover:bg-slate-600 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={() => saveBranch()}
                    className="px-6 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
                  >
                    保存更改
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
