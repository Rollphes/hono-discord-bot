import {
  APIInteraction,
  InteractionResponseType,
  InteractionType,
} from 'discord-api-types/v10'

import { hex2bin, sleep } from '@/utils'

export interface InteractionHandlerOptions {
  environment?: DiscordEnv
}
export type DiscordEnv = Partial<
  Record<DiscordEnvKeys, string | ((...args: unknown[]) => string)>
>
enum DiscordEnvKeys {
  APPLICATION_ID = 'applicationId',
  PUBLIC_KEY = 'publicKey',
  TOKEN = 'token',
}

// test
type UserHandler = (
  interaction: Interaction,
  ...args: unknown[]
) => Promise<void> | void

// ユーザー側のロジックに渡すコンテキストオブジェクトの型
export interface Interaction {
  // このメソッドが呼ばれると、processInteractionのPromiseが解決される
  reply: (message: string) => void
  // このメソッドはバックグラウンドで非同期に実行される
  editReply: (message: string) => Promise<void>
}

export class InteractionHandler {
  private readonly options: InteractionHandlerOptions = {}
  constructor(options?: InteractionHandlerOptions) {
    if (options) this.options = options
  }

  public interactionHandle = async (
    req: Request,
    ...args: unknown[]
  ): Promise<Response> => {
    if (req.method !== 'POST')
      return new Response('Method Not Allowed', { status: 405 })

    const body = await req.text()
    const signature = req.headers.get('x-signature-ed25519')
    const timestamp = req.headers.get('x-signature-timestamp')
    const publicKey = this.getEnvValue(DiscordEnvKeys.PUBLIC_KEY, ...args)
    const isValidRequest = await this.verify(
      body,
      signature,
      timestamp,
      publicKey,
    )
    if (!isValidRequest) return new Response('Bad Request', { status: 401 })

    const interaction = JSON.parse(body) as APIInteraction
    console.log('Received interaction:', JSON.stringify(interaction))
    switch (interaction.type) {
      case InteractionType.Ping:
        return Response.json({ type: InteractionResponseType.Pong })
      // TODO: Add other interaction types handling
      case InteractionType.ApplicationCommand:
      case InteractionType.MessageComponent:
      case InteractionType.ApplicationCommandAutocomplete:
      case InteractionType.ModalSubmit:
        return Response.json({ error: 'Not Implemented' }, { status: 501 })
    }
    return Response.json({ error: 'Unknown Type' }, { status: 400 })
  }

  private async verify(
    body: string,
    signature: string | null,
    timestamp: string | null,
    publicKey: string,
  ): Promise<boolean> {
    if (!body || !signature || !timestamp) return false

    const cryptoObj: Crypto | undefined =
      typeof window !== 'undefined'
        ? window.crypto
        : typeof globalThis !== 'undefined'
          ? globalThis.crypto
          : typeof crypto !== 'undefined'
            ? crypto
            : undefined
    const { subtle } = cryptoObj ?? {}

    if (subtle === undefined) throw new Error('SubtleCrypto not supported')
    return await subtle.verify(
      { name: 'Ed25519' },
      await subtle.importKey(
        'raw',
        hex2bin(publicKey),
        { name: 'Ed25519' },
        false,
        ['verify'],
      ),
      hex2bin(signature),
      new TextEncoder().encode(timestamp + body),
    )
  }

  private getEnvValue(key: DiscordEnvKeys, ...args: unknown[]): string {
    const envValue = this.options.environment?.[key]
    if (!envValue) throw new Error(`Environment variable ${key} is not set`)

    return typeof envValue === 'function' ? envValue(...args) : envValue
  }

  private async processInteraction(
    userHandler: UserHandler,
  ): Promise<Response> {
    return new Promise((resolve) => {
      const interaction: Interaction = {
        reply: (message: string) => {
          resolve(
            new Response(
              JSON.stringify({
                type: InteractionResponseType.ChannelMessageWithSource,
                data: {
                  content: message,
                },
              }),
            ),
          )
        },

        editReply: async (message: string) => {
          await sleep(1000)
        },
      }

      Promise.resolve(userHandler(interaction)).catch(console.error)
    })
  }
}
