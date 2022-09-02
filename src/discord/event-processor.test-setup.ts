import { createDiscordEventProcessor } from '@worldbrain/memex-common/lib/discord/event-processor'
import { DiscordMessageCreateInfo } from '@worldbrain/memex-common/lib/discord/types'
import { createLazyMemoryServerStorage } from 'src/storage/server'

export async function setupDiscordTestContext() {
    const getServerStorage = createLazyMemoryServerStorage()
    const serverStorage = await getServerStorage()
    const eventProcessor = createDiscordEventProcessor()

    const messages: { [messageId: string]: DiscordMessageCreateInfo } = {}
    return {
        postMessage: async (params: {
            messageId: string
            content: string
            guildId?: string
            channelId?: string
            replyTo?: string
        }) => {
            const repliedToInfo = params.replyTo && messages[params.replyTo]
            const info: DiscordMessageCreateInfo = {
                reference: {
                    guildId: params.guildId ?? 'gld-1',
                    channelId: params.channelId ?? 'chl-1',
                    messageId: params.messageId,
                },
                author: {
                    id: 'usr-1',
                    avatar: 'avt-1',
                    username: 'User 1',
                },
                content: params.content,
                replyTo: repliedToInfo && repliedToInfo.reference,
                repliedToUser: repliedToInfo && repliedToInfo.author,
            }
            messages[info.reference.messageId] = info
            await eventProcessor.processMessageCreate(info)
        },
        assertPages: async (params) => {},
        assertReplies: async (params) => {},
    }
}
