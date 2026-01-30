import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function normalizeGameData(raw: any) {
  const title =
    (typeof raw?.game_title === "string" && raw.game_title.trim())
      ? raw.game_title
      : (typeof raw?.title === "string" && raw.title.trim())
        ? raw.title
        : "未命名游戏"

  const branches = Array.isArray(raw?.branches)
    ? raw.branches.map((b: any, branchIndex: number) => {
        const rawOptions = Array.isArray(b?.options)
          ? b.options
          : Array.isArray(b?.choices)
            ? b.choices
            : []

        const options = rawOptions.map((c: any, choiceIndex: number) => {
          const optId =
            c?.option_id ||
            c?.id ||
            c?.optionId ||
            `choice_${branchIndex}_${choiceIndex}_${Date.now()}`
          const optText = c?.option_text ?? c?.choice ?? c?.text ?? ""
          const targetId = c?.target_branch_id ?? c?.next_branch ?? c?.target ?? ""
          return {
            ...c,
            id: optId,
            option_id: optId,
            choice: optText,
            option_text: optText,
            target_branch_id: targetId,
            next_branch: targetId,
            end_game: !!c?.end_game,
          }
        })

        const branchId = b?.branch_id ?? b?.id ?? `branch_${branchIndex}`
        const branchTitle = b?.branch_title ?? b?.chapter ?? b?.title ?? ""
        const content = b?.content ?? b?.scene_detail ?? b?.text ?? ""

        return {
          ...b,
          branch_id: branchId,
          branch_title: branchTitle,
          chapter: branchTitle,
          content,
          scene_detail: content,
          options,
          choices: options,
        }
      })
    : []

  const description = typeof raw?.description === "string" ? raw.description : ""
  const game_states = Array.isArray(raw?.game_states) ? raw.game_states : []

  return {
    ...raw,
    title,
    game_title: title,
    description,
    game_states,
    branches,
  }
}
