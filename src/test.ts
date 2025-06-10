// --- Type Definitions ---

import { sleep } from '@/utils'

// ユーザーから渡されるリクエストの型（例）
// Honoに依存しないプレーンな型定義

// 最初の応答として返されるデータの型
interface FirstResponseData {
  type: 'INITIAL_RESPONSE'
  content: string
}

// ユーザー側のロジックに渡すコンテキストオブジェクトの型
export interface InteractionContext {
  // このメソッドが呼ばれると、processInteractionのPromiseが解決される
  reply: (message: string) => void
  // このメソッドはバックグラウンドで非同期に実行される
  editReply: (message: string) => Promise<void>
}

// ユーザーが定義するハンドラ関数の型
type UserHandler = (ctx: InteractionContext) => Promise<void> | void

/**
 * インタラクションを処理し、最初の応答データを返すコア関数
 * @param interactionPayload - リクエストからパースされた生のペイロード
 * @param userHandler - ユーザーが定義したインタラクション処理ロジック
 * @returns Promise that resolves with the data for the first response.
 */
export function processInteraction(
  userHandler: UserHandler,
): Promise<FirstResponseData> {
  // このPromiseが、ユーザーが`reply()`を呼んだときに解決され、
  // 最初のレスポンスデータを返す役割を担う
  return new Promise((resolve) => {
    // ユーザーに渡すコンテキストオブジェクトを作成
    const interactionContext: InteractionContext = {
      // First Response: 最初の応答を定義するメソッド
      reply: (message: string) => {
        // First Response Dataを作成し、Promiseを解決することで呼び出し元に返す
        const responseData: FirstResponseData = {
          type: 'INITIAL_RESPONSE',
          content: message,
        }
        resolve(responseData)
      },

      // Secondary Response: 最初の応答を後から編集するメソッド（シミュレーション）
      editReply: async (message: string) => {
        // 実際のアプリケーションでは、ここで外部APIを叩くなどの非同期処理を行う
        await sleep(1000)
      },
    }

    // ユーザーのロジックの実行を開始する。
    // このPromiseの完了は待たずに、バックグラウンドで実行させる。
    Promise.resolve(userHandler(interactionContext)).catch(console.error)
  })
}
