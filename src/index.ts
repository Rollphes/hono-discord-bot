import { Hono } from 'hono'
import { logger } from 'hono/logger'

import { InteractionHandler } from '@/InteractionHandler'

const app = new Hono()
const interactionHandler = new InteractionHandler({
  environment: {
    publicKey: (env): string => {
      console.log('env', env)
      const environment = env as Record<string, string | undefined>
      console.log('DISCORD_PUBLIC_KEY', environment.DISCORD_PUBLIC_KEY)
      return environment.DISCORD_PUBLIC_KEY ?? ''
    },
  },
})

app.get('/', (c) => {
  return c.text('Discord Interaction Handler is running')
})
// app.get('/test', async (c) => {
//   const firstResponseData = await processInteraction(myInteractionLogic)
//   console.log('First response data:', firstResponseData)

//   return c.json(firstResponseData)
// })
app.use('*', logger())
app.mount('/interactions', interactionHandler.interactionHandle)
app.notFound((c) => {
  return c.text('Not Found', 404)
})
export default app
