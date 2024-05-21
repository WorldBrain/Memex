import { createAnnotationFromMessage } from '@worldbrain/memex-common/lib/chat-bots/utils'
import { setupDiscordTestContext } from './event-processor.test-setup'

const createDiscordLink = (messageId: number) =>
    `https://discord.com/channels/1027/1028/${messageId}`

describe('Discord event processor', () => {
    it('should ignore messages that do not contain links', async () => {
        const context = await setupDiscordTestContext({
            withDefaultList: true,
            defaultListEnabled: true,
        })
        await context.postMessage({
            messageId: 1,
            content: 'Nothing to see here...',
            messageLink: createDiscordLink(1),
        })
        await context.assertData({
            users: [],
            pages: [],
            annotations: [],
        })
    })

    it('should create a page list entry and annotation containing a Discord link + original message content when posting a link to a channel', async () => {
        const context = await setupDiscordTestContext({
            withDefaultList: true,
            defaultListEnabled: true,
        })
        const message = {
            messageId: 1,
            service: 'Discord' as 'Discord',
            content: 'Hey, check this out: https://memex.garden/',
            messageLink: createDiscordLink(1),
        }
        await context.postMessage(message)
        await context.assertData({
            users: [1],
            pages: [
                {
                    userId: 1,
                    pageId: 1,
                    messageId: 1,
                    normalizedUrl: 'memex.garden',
                },
            ],
            annotations: [
                {
                    pageId: 1,
                    comment: createAnnotationFromMessage(message),
                },
            ],
        })
    })

    it('should not create duplicate page list entries and annotations when posting multiple of the same links in the same message', async () => {
        const context = await setupDiscordTestContext({
            withDefaultList: true,
            defaultListEnabled: true,
        })
        const message = {
            messageId: 1,
            service: 'Discord' as 'Discord',
            content:
                'Hey, check this out: https://memex.garden/ and here it is again: https://memex.garden/ and again: https://memex.garden/',
            messageLink: createDiscordLink(1),
        }
        await context.postMessage(message)
        await context.assertData({
            users: [1],
            pages: [
                {
                    userId: 1,
                    pageId: 1,
                    messageId: 1,
                    normalizedUrl: 'memex.garden',
                },
            ],
            annotations: [
                {
                    pageId: 1,
                    comment: createAnnotationFromMessage(message),
                },
            ],
        })
    })

    it('should do nothing when posting a message with a link to a disabled channel', async () => {
        const context = await setupDiscordTestContext({
            withDefaultList: true,
            defaultListEnabled: false,
        })
        const message = {
            messageId: 1,
            content: 'Hey, check this out: https://memex.garden/',
            messageLink: createDiscordLink(1),
        }
        await context.postMessage(message)
        await context.assertData({
            users: [],
            pages: [],
            annotations: [],
        })
    })

    it('should create page list entries and annotations containing the same message content when posting multiple links to a channel in the same message', async () => {
        const context = await setupDiscordTestContext({
            withDefaultList: true,
            defaultListEnabled: true,
        })
        const message = {
            messageId: 1,
            service: 'Discord' as 'Discord',
            content:
                'Hey, check this out: https://memex.garden/. Also interesting: https://notion.so/',
            messageLink: createDiscordLink(1),
        }
        await context.postMessage(message)
        await context.assertData({
            users: [1],
            pages: [
                {
                    userId: 1,
                    pageId: 1,
                    messageId: 1,
                    normalizedUrl: 'memex.garden',
                },
                {
                    userId: 1,
                    pageId: 2,
                    messageId: 1,
                    normalizedUrl: 'notion.so',
                },
            ],
            annotations: [
                {
                    pageId: 1,
                    comment: createAnnotationFromMessage(message),
                },
                {
                    pageId: 2,
                    comment: createAnnotationFromMessage(message),
                },
            ],
        })
    })

    it('should create a page list entry and annotation containing a Discord link + original message content when posting a link inside a thread of another message', async () => {
        const context = await setupDiscordTestContext({
            withDefaultList: true,
            defaultListEnabled: true,
        })
        await context.postMessage({
            content: 'nothing here',
            messageId: 1,
            messageLink: createDiscordLink(1),
        })
        const linkMessage = {
            messageId: 2,
            service: 'Discord' as 'Discord',
            content: 'Hey, check this out: https://memex.garden/',
            messageLink: createDiscordLink(2),
            replyTo: 1,
        }
        await context.postMessage(linkMessage)
        await context.assertData({
            users: [1],
            pages: [
                {
                    userId: 1,
                    pageId: 1,
                    messageId: 2,
                    normalizedUrl: 'memex.garden',
                },
            ],
            annotations: [
                {
                    pageId: 1,
                    comment: createAnnotationFromMessage(linkMessage),
                },
            ],
        })
    })

    // TODO: Fix this test
    it.skip("should add another annotation to existing page list entry when posting a link that's already been posted in the same channel", async () => {
        return
        const context = await setupDiscordTestContext({
            withDefaultList: true,
            defaultListEnabled: true,
        })
        const messageA = {
            messageId: 1,
            service: 'Discord' as 'Discord',
            content: 'Hey, check this out: https://memex.garden/',
            messageLink: createDiscordLink(1),
        }
        const messageB = {
            messageId: 2,
            service: 'Discord' as 'Discord',
            content: 'Hey, this is the same link: https://memex.garden/',
            messageLink: createDiscordLink(2),
        }

        await context.postMessage(messageA)
        await context.assertData({
            users: [1],
            pages: [
                {
                    userId: 1,
                    pageId: 1,
                    messageId: 1,
                    normalizedUrl: 'memex.garden',
                },
            ],
            annotations: [
                {
                    pageId: 1,
                    comment: createAnnotationFromMessage(messageA),
                },
            ],
        })

        await context.postMessage(messageB)
        await context.assertData({
            users: [1],
            pages: [
                {
                    userId: 1,
                    pageId: 1,
                    messageId: 1,
                    normalizedUrl: 'memex.garden',
                    hasBeenUpdated: true,
                },
                {
                    userId: 1,
                    pageId: 2,
                    messageId: 2,
                    normalizedUrl: 'memex.garden',
                    doesNotExistInDB: true,
                },
            ],
            annotations: [
                {
                    pageId: 1,
                    comment: createAnnotationFromMessage(messageA),
                },
                {
                    pageId: 2,
                    comment: createAnnotationFromMessage(messageB),
                },
            ],
        })
    })

    // Below are tests for the original implementation plan incorporating replies
    // it.skip('should post annotations when replies are posted to a link in a channel', async () => {
    //     const context = await setupDiscordTestContext({
    //         withDefaultList: true,
    //         defaultListEnabled: true,
    //     })
    //     await context.postMessage({
    //         messageId: 1,
    //         content: 'Hey, check this out: https://memex.garden/',
    //         messageLink: createDiscordLink(1),
    //     })
    //     await context.postMessage({
    //         messageId: 2,
    //         replyTo: 1,
    //         content: `I'm replying to that`,
    //         messageLink: createDiscordLink(2),
    //     })
    //     await context.postMessage({
    //         messageId: 3,
    //         replyTo: 2,
    //         content: `I'm replying to that too!`,
    //         messageLink: createDiscordLink(3),
    //     })
    //     await context.assertData({
    //         users: [1],
    //         pages: [
    //             {
    //                 userId: 1,
    //                 messageId: 1,
    //                 normalizedUrl: 'memex.garden',
    //             },
    //         ],
    //         annotations: [
    //             {
    //                 messageId: 1,
    //                 replyIds: [2, 3],
    //             },
    //         ],
    //     })
    // })

    // it.skip('should post annotations when replies are posted to a message with multiple links in a channel', async () => {
    //     const context = await setupDiscordTestContext({
    //         withDefaultList: true,
    //         defaultListEnabled: true,
    //     })
    //     await context.postMessage({
    //         messageId: 1,
    //         content:
    //             'Hey, check this out: https://memex.garden/. Also interesting: https://notion.so/',
    //         messageLink: createDiscordLink(1),
    //     })
    //     await context.postMessage({
    //         messageId: 2,
    //         replyTo: 1,
    //         content: `I'm replying to that`,
    //         messageLink: createDiscordLink(2),
    //     })
    //     await context.postMessage({
    //         messageId: 3,
    //         replyTo: 2,
    //         content: `I'm replying to that too!`,
    //         messageLink: createDiscordLink(3),
    //     })
    //     await context.assertData({
    //         users: [1],
    //         pages: [
    //             {
    //                 userId: 1,
    //                 messageId: 1,
    //                 normalizedUrl: ['memex.garden', 'notion.so'],
    //             },
    //         ],
    //         annotations: [
    //             {
    //                 messageId: 1,
    //                 replyIds: [2, 3],
    //             },
    //         ],
    //     })
    // })

    // it.skip('should post annotations when a message is posted in a thread of a message containing a link', async () => {
    //     const context = await setupDiscordTestContext({
    //         withDefaultList: true,
    //         defaultListEnabled: true,
    //     })
    //     await context.postMessage({
    //         messageId: 1,
    //         content: 'Hey, check this out: https://memex.garden/',
    //         messageLink: createDiscordLink(1),
    //     })
    //     await context.postMessage({
    //         channelId: { message: 1 },
    //         messageId: 2,
    //         content: `I'm replying to that`,
    //         messageLink: createDiscordLink(2),
    //     })
    //     await context.postMessage({
    //         channelId: { message: 1 },
    //         messageId: 3,
    //         content: `I'm replying to that too!`,
    //         messageLink: createDiscordLink(3),
    //     })
    //     await context.assertData({
    //         users: [1],
    //         pages: [
    //             {
    //                 userId: 1,
    //                 messageId: 1,
    //                 normalizedUrl: ['memex.garden'],
    //             },
    //         ],
    //         annotations: [
    //             {
    //                 messageId: 1,
    //                 replyIds: [2, 3],
    //             },
    //         ],
    //     })
    // })

    // it.skip('should post annotations when a message is posted in a thread of a message containing multiple links', async () => {
    //     const context = await setupDiscordTestContext({
    //         withDefaultList: true,
    //         defaultListEnabled: true,
    //     })
    //     await context.postMessage({
    //         messageId: 1,
    //         content:
    //             'Hey, check this out: https://memex.garden/. Also interesting: https://notion.so/',
    //         messageLink: createDiscordLink(1),
    //     })
    //     await context.postMessage({
    //         channelId: { message: 1 },
    //         messageId: 2,
    //         content: `I'm replying to that`,
    //         messageLink: createDiscordLink(2),
    //     })
    //     await context.postMessage({
    //         channelId: { message: 1 },
    //         messageId: 3,
    //         content: `I'm replying to that too!`,
    //         messageLink: createDiscordLink(3),
    //     })
    //     await context.assertData({
    //         users: [1],
    //         pages: [
    //             {
    //                 userId: 1,
    //                 messageId: 1,
    //                 normalizedUrl: ['memex.garden', 'notion.so'],
    //             },
    //         ],
    //         annotations: [
    //             {
    //                 messageId: 1,
    //                 replyIds: [2, 3],
    //             },
    //         ],
    //     })
    // })

    // it.skip('should create a list entry and post subsequent messages to both the thread starting link and new one when posting a link in a thread', async () => {
    //     const context = await setupDiscordTestContext({
    //         withDefaultList: true,
    //         defaultListEnabled: true,
    //     })
    //     await context.postMessage({
    //         messageId: 1,
    //         content: 'Hey, check this out: https://memex.garden/',
    //         messageLink: createDiscordLink(1),
    //     })
    //     await context.postMessage({
    //         channelId: { message: 1 },
    //         messageId: 2,
    //         content: `I'm replying to that`,
    //         messageLink: createDiscordLink(2),
    //     })
    //     await context.postMessage({
    //         channelId: { message: 1 },
    //         messageId: 3,
    //         content: `Posting https://another.link/, just to confuse you`,
    //         messageLink: createDiscordLink(3),
    //     })
    //     await context.postMessage({
    //         channelId: { message: 1 },
    //         messageId: 4,
    //         content: `This should show up as a reply to both messages`,
    //         messageLink: createDiscordLink(4),
    //     })
    //     await context.assertData({
    //         users: [1],
    //         pages: [
    //             {
    //                 userId: 1,
    //                 messageId: 1,
    //                 normalizedUrl: ['memex.garden'],
    //             },
    //             {
    //                 userId: 1,
    //                 messageId: 3,
    //                 originalMessageId: 1,
    //                 normalizedUrl: ['another.link'],
    //             },
    //         ],
    //         annotations: [
    //             {
    //                 messageId: 1,
    //                 replyIds: [2, 3, 4],
    //             },
    //             {
    //                 messageId: 3,
    //                 replyIds: [4],
    //             },
    //         ],
    //     })
    // })
})
