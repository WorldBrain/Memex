import expect from 'expect'
import { createDiscordEventProcessor } from '@worldbrain/memex-common/lib/discord/event-processor'
import { DiscordMessageCreateInfo } from '@worldbrain/memex-common/lib/discord/types'
import { createLazyMemoryServerStorage } from 'src/storage/server'
import { TEST_USER } from '@worldbrain/memex-common/lib/authentication/dev'

export async function setupDiscordTestContext(options: {
    withDefaultList: boolean
}) {
    const makeId = (type: string, id: number) => `${type}-${id}`
    const messages: { [messageId: number]: DiscordMessageCreateInfo } = {}
    const sharedLists: { [listId: number]: number | string } = {}

    const getServerStorage = createLazyMemoryServerStorage()
    const serverStorage = await getServerStorage()
    if (options.withDefaultList) {
        const listReference = await serverStorage.storageModules.contentSharing.createSharedList(
            {
                userReference: { type: 'user-reference', id: TEST_USER.id },
                listData: {
                    title: 'Channel 1',
                },
            },
        )
        sharedLists[1] = listReference.id
        await serverStorage.storageManager.operation(
            'createObject',
            'discordList',
            {
                guildId: makeId('gld', 1),
                channelId: makeId('chl', 1),
                channelName: 'Channel 1',
                enabled: true,
                sharedList: listReference.id,
            },
        )
    }

    const eventProcessor = createDiscordEventProcessor({
        storage: { manager: serverStorage.storageManager },
        getNow: () => Date.now(),
    })

    return {
        postMessage: async (params: {
            messageId: number
            content: string
            userId?: number
            guildId?: number
            channelId?: number
            replyTo?: number
        }) => {
            const repliedToInfo = params.replyTo && messages[params.replyTo]
            const info: DiscordMessageCreateInfo = {
                reference: {
                    guildId: makeId('gld', params.guildId ?? 1),
                    channelId: makeId('chl', params.channelId ?? 1),
                    messageId: makeId('msg', params.messageId),
                },
                author: {
                    id: makeId('usr', params.userId ?? 1),
                    avatar: makeId('avt', params.userId ?? 1),
                    username: `User ${params.userId ?? 1}`,
                },
                content: params.content,
                replyTo: repliedToInfo && repliedToInfo.reference,
                repliedToUser: repliedToInfo && repliedToInfo.author,
            }
            messages[params.messageId] = info
            await eventProcessor.processMessageCreate(info)
        },
        assertData: async (data: {
            users: number[]
            pages: Array<{
                userId: number
                messageId: number
                normalizedUrls: string[]
            }>
            replies: any[]
        }) => {
            const sharedListId = sharedLists[1]
            const storedUsers = await serverStorage.storageManager.operation(
                'findObjects',
                'user',
                {},
            )
            expect(storedUsers).toEqual(
                data.users.map((id) => ({
                    id: `discord:usr-${id}`,
                    displayName: `User ${id}`,
                    platform: 'discord',
                    platformId: `usr-${id}`,
                })),
            )

            const storedMessages: any[] = await serverStorage.storageManager.operation(
                'findObjects',
                'discordMessage',
                {},
            )

            const expectedLinkMessages: any[] = []
            for (const page of data.pages) {
                const msg = messages[page.messageId]
                for (const normalizedPageUrl of page.normalizedUrls) {
                    expectedLinkMessages.push({
                        id: expect.anything(),
                        type: 'link',
                        guildId: msg.reference.guildId,
                        channelId: msg.reference.channelId,
                        messageId: msg.reference.messageId,
                        originalChannelId: msg.reference.channelId,
                        originalMessageId: msg.reference.messageId,
                        normalizedPageUrl,
                        sharedList: sharedListId,
                    })
                }
            }
            expect(storedMessages.filter((msg) => msg.type === 'link')).toEqual(
                expectedLinkMessages,
            )

            const expectedReplyMessages: any[] = []
            expect(
                storedMessages.filter((msg) => msg.type === 'reply'),
            ).toEqual(expectedReplyMessages)

            const storedListEntries = await serverStorage.storageManager.operation(
                'findObjects',
                'sharedListEntry',
                {},
            )
            const expectedListEntres: any[] = []
            for (const page of data.pages) {
                for (const normalizedPageUrl of page.normalizedUrls) {
                    expectedListEntres.push({
                        id: expect.anything(),
                        creator: `discord:usr-${page.userId}`,
                        createdWhen: expect.any(Number),
                        updatedWhen: expect.any(Number),
                        entryTitle: normalizedPageUrl,
                        normalizedUrl: normalizedPageUrl,
                        originalUrl: `https://${normalizedPageUrl}/`,
                        sharedList: sharedListId,
                    })
                }
            }
            expect(storedListEntries).toEqual(expectedListEntres)

            const storedAnnotationEntries = await serverStorage.storageManager.operation(
                'findObjects',
                'sharedAnnotationListEntry',
                {},
            )
            expect(storedAnnotationEntries).toEqual([])

            const storedAnnotations = await serverStorage.storageManager.operation(
                'findObjects',
                'sharedAnnotation',
                {},
            )
            expect(storedAnnotations).toEqual([])
        },
    }
}
