import { normalizeGameData } from '@/lib/utils'

describe('normalizeGameData', () => {
  test('兼容 chapter/scene_detail/choices 字段并输出 branch_title/content/options', () => {
    const raw = {
      game_title: '测试游戏',
      description: '描述',
      branches: [
        {
          branch_id: 'b1',
          chapter: '第一章',
          scene_detail: '内容1',
          choices: [
            { option_id: 'c1', choice: '去右边', next_branch: 'b2' },
            { id: 'c2', option_text: '去左边', target_branch_id: 'b3' },
          ],
        },
      ],
    }

    const normalized = normalizeGameData(raw)

    expect(normalized.game_title).toBe('测试游戏')
    expect(normalized.title).toBe('测试游戏')
    expect(normalized.branches).toHaveLength(1)

    const b1 = normalized.branches[0]
    expect(b1.branch_id).toBe('b1')
    expect(b1.branch_title).toBe('第一章')
    expect(b1.chapter).toBe('第一章')
    expect(b1.content).toBe('内容1')
    expect(b1.scene_detail).toBe('内容1')
    expect(Array.isArray(b1.options)).toBe(true)
    expect(Array.isArray(b1.choices)).toBe(true)
    expect(b1.options).toHaveLength(2)

    expect(b1.options[0]).toMatchObject({
      id: 'c1',
      option_id: 'c1',
      option_text: '去右边',
      choice: '去右边',
      target_branch_id: 'b2',
      next_branch: 'b2',
    })
    expect(b1.options[1]).toMatchObject({
      id: 'c2',
      option_id: 'c2',
      option_text: '去左边',
      choice: '去左边',
      target_branch_id: 'b3',
      next_branch: 'b3',
    })
  })

  test('当 raw 使用 options/text/target 字段时也能归一化', () => {
    const raw = {
      title: '另一个游戏',
      branches: [
        {
          id: 'branchA',
          title: '场景A',
          text: '文本A',
          options: [{ optionId: 'o1', text: '下一步', target: 'branchB' }],
        },
      ],
    }

    const normalized = normalizeGameData(raw)
    expect(normalized.game_title).toBe('另一个游戏')
    expect(normalized.branches[0]).toMatchObject({
      branch_id: 'branchA',
      branch_title: '场景A',
      content: '文本A',
    })
    expect(normalized.branches[0].options[0]).toMatchObject({
      id: 'o1',
      option_id: 'o1',
      option_text: '下一步',
      target_branch_id: 'branchB',
    })
  })
})

