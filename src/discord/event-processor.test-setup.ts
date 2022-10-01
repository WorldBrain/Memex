import flatten from 'lodash/flatten'
import fromPairs from 'lodash/fromPairs'
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
        const listReference = await serverStorage.modules.contentSharing.createSharedList(
            {
                userReference: { type: 'user-reference', id: TEST_USER.id },
                listData: {
                    title: 'Channel 1',
                },
            },
        )
        sharedLists[1] = listReference.id
        await serverStorage.manager.operation('createObject', 'discordList', {
            guildId: makeId('gld', 1),
            channelId: makeId('chl', 1),
            channelName: 'Channel 1',
            enabled: true,
            sharedList: listReference.id,
        })
    }

    const eventProcessor = createDiscordEventProcessor({
        storage: { manager: serverStorage.manager },
        getNow: () => Date.now(),
    })

    return {
        postMessage: async (params: {
            messageId: number
            content: string
            userId?: number
            guildId?: number
            channelId?: { channel: number } | { message: number }
            replyTo?: number
        }) => {
            const repliedToInfo = params.replyTo && messages[params.replyTo]
            const info: DiscordMessageCreateInfo = {
                reference: {
                    guildId: makeId('gld', params.guildId ?? 1),
                    channelId: params.channelId
                        ? 'channel' in params.channelId
                            ? makeId('chl', params.channelId.channel)
                            : makeId('msg', params.channelId.message)
                        : makeId('chl', 1),
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
                originalMessageId?: number
                normalizedUrls: string[]
            }>
            replies: Array<{
                messageId: number
                replyIds: number[]
            }>
        }) => {
            const sharedListId = sharedLists[1]
            const storedUsers = await serverStorage.manager.operation(
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

            const storedMessages: any[] = await serverStorage.manager.operation(
                'findObjects',
                'discordMessage',
                {},
                { sort: [['createdWhen', 'asc']] },
            )

            const expectedLinkMessages: any[] = flatten(
                data.pages.map((page) => {
                    const msg = messages[page.messageId]
                    const origMsg =
                        messages[page.originalMessageId ?? page.messageId]
                    return page.normalizedUrls.map((normalizedPageUrl) => ({
                        id: expect.anything(),
                        createdWhen: expect.any(Number),
                        type: 'link',
                        guildId: msg.reference.guildId,
                        channelId: msg.reference.channelId,
                        messageId: msg.reference.messageId,
                        originalChannelId: origMsg.reference.channelId,
                        originalMessageId: origMsg.reference.messageId,
                        normalizedPageUrl,
                        sharedList: sharedListId,
                    }))
                }),
            )
            expect(storedMessages.filter((msg) => msg.type === 'link')).toEqual(
                expectedLinkMessages,
            )

            const expectedReplyMessages: any[] = flatten(
                data.replies.map((reply) => {
                    const origMsg = messages[reply.messageId]
                    return reply.replyIds.map((replyId) => {
                        const replyMsg = messages[replyId]
                        return {
                            id: expect.anything(),
                            createdWhen: expect.any(Number),
                            type: 'reply',
                            guildId: replyMsg.reference.guildId,
                            channelId: replyMsg.reference.channelId,
                            messageId: replyMsg.reference.messageId,
                            originalChannelId: origMsg.reference.channelId,
                            originalMessageId: origMsg.reference.messageId,
                            sharedList: sharedListId,
                        }
                    })
                }),
            )
            expect(
                storedMessages.filter((msg) => msg.type === 'reply'),
            ).toEqual(expectedReplyMessages)

            const storedListEntries = await serverStorage.manager.operation(
                'findObjects',
                'sharedListEntry',
                {},
                { sort: [['createdWhen', 'asc']] },
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

            const storedAnnotations = await serverStorage.manager.operation(
                'findObjects',
                'sharedAnnotation',
                {},
                { sort: [['createdWhen', 'asc']] },
            )
            expect(storedAnnotations).toEqual(
                flatten(
                    flatten(
                        data.replies.map((reply) =>
                            reply.replyIds.map((replyId) => {
                                const page = data.pages.find(
                                    (page) =>
                                        page.messageId === reply.messageId,
                                )
                                return page.normalizedUrls.map(
                                    (normalizedUrl) => ({
                                        id: expect.anything(),
                                        creator: `discord:usr-${page.userId}`,
                                        normalizedPageUrl: normalizedUrl,
                                        createdWhen: expect.any(Number),
                                        uploadedWhen: expect.any(Number),
                                        updatedWhen: expect.any(Number),
                                        comment: messages[replyId].content,
                                    }),
                                )
                            }),
                        ),
                    ),
                ),
            )

            const storedAnnotationEntries = await serverStorage.manager.operation(
                'findObjects',
                'sharedAnnotationListEntry',
                {},
                { sort: [['createdWhen', 'asc']] },
            )
            let annotationCounter = 0
            expect(storedAnnotationEntries).toEqual(
                flatten(
                    flatten(
                        data.replies.map((reply) =>
                            reply.replyIds.map((replyId) => {
                                const page = data.pages.find(
                                    (page) =>
                                        page.messageId === reply.messageId,
                                )
                                return page.normalizedUrls.map(
                                    (normalizedUrl) => ({
                                        id: expect.anything(),
                                        creator: `discord:usr-${page.userId}`,
                                        normalizedPageUrl: normalizedUrl,
                                        createdWhen: expect.any(Number),
                                        uploadedWhen: expect.any(Number),
                                        updatedWhen: expect.any(Number),
                                        sharedList: sharedListId,
                                        sharedAnnotation:
                                            storedAnnotations[
                                                annotationCounter++
                                            ].id,
                                    }),
                                )
                            }),
                        ),
                    ),
                ),
            )
        },
    }
}
