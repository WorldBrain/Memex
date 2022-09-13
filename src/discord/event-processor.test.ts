import { setupDiscordTestContext } from './event-processor.test-setup'

describe('Discord event processor', () => {
    it('should ignore message that do not contain links and are not replies to links', async () => {
        const context = await setupDiscordTestContext({ withDefaultList: true })
        await context.postMessage({
            messageId: 1,
            content: 'Nothing to see here...',
        })
        await context.assertData({
            users: [],
            pages: [],
            replies: [],
        })
    })

    it('should create a page list entry when posting a link to a channel', async () => {
        const context = await setupDiscordTestContext({ withDefaultList: true })
        await context.postMessage({
            messageId: 1,
            content: 'Hey, check this out: https://memex.garden/',
        })
        await context.assertData({
            users: [1],
            pages: [
                {
                    userId: 1,
                    messageId: 1,
                    normalizedUrls: ['memex.garden'],
                },
            ],
            replies: [],
        })
    })

    it('should create page list entries when posting multiple links to a channel in the same message', async () => {
        const context = await setupDiscordTestContext({ withDefaultList: true })
        await context.postMessage({
            messageId: 1,
            content:
                'Hey, check this out: https://memex.garden/. Also interesting: https://notion.so/',
        })
        await context.assertData({
            users: [1],
            pages: [
                {
                    userId: 1,
                    messageId: 1,
                    normalizedUrls: ['memex.garden', 'notion.so'],
                },
            ],
            replies: [],
        })
    })

    it('should post annotations when replies are posted to a link in a channel', async () => {
        const context = await setupDiscordTestContext({ withDefaultList: true })
        await context.postMessage({
            messageId: 1,
            content: 'Hey, check this out: https://memex.garden/',
        })
        await context.postMessage({
            messageId: 2,
            replyTo: 1,
            content: `I'm replying to that`,
        })
        await context.postMessage({
            messageId: 3,
            replyTo: 2,
            content: `I'm replying to that too!`,
        })
        await context.assertData({
            users: [1],
            pages: [
                {
                    userId: 1,
                    messageId: 1,
                    normalizedUrls: ['memex.garden'],
                },
            ],
            replies: [
                {
                    messageId: 1,
                    replyIds: [2, 3],
                },
            ],
        })
    })

    it('should post annotations when replies are posted to a message with multiple links in a channel', async () => {
        const context = await setupDiscordTestContext({ withDefaultList: true })
        await context.postMessage({
            messageId: 1,
            content:
                'Hey, check this out: https://memex.garden/. Also interesting: https://notion.so/',
        })
        await context.postMessage({
            messageId: 2,
            replyTo: 1,
            content: `I'm replying to that`,
        })
        await context.postMessage({
            messageId: 3,
            replyTo: 2,
            content: `I'm replying to that too!`,
        })
        await context.assertData({
            users: [1],
            pages: [
                {
                    userId: 1,
                    messageId: 1,
                    normalizedUrls: ['memex.garden', 'notion.so'],
                },
            ],
            replies: [
                {
                    messageId: 1,
                    replyIds: [2, 3],
                },
            ],
        })
    })

    it('should post annotations when a message is posted in a thread of a message containing a link', async () => {
        const context = await setupDiscordTestContext({ withDefaultList: true })
        await context.postMessage({
            messageId: 1,
            content: 'Hey, check this out: https://memex.garden/',
        })
        await context.postMessage({
            channelId: { message: 1 },
            messageId: 2,
            content: `I'm replying to that`,
        })
        await context.postMessage({
            channelId: { message: 1 },
            messageId: 3,
            content: `I'm replying to that too!`,
        })
        await context.assertData({
            users: [1],
            pages: [
                {
                    userId: 1,
                    messageId: 1,
                    normalizedUrls: ['memex.garden'],
                },
            ],
            replies: [
                {
                    messageId: 1,
                    replyIds: [2, 3],
                },
            ],
        })
    })

    it('should post annotations when a message is posted in a thread of a message containing multiple links', async () => {
        const context = await setupDiscordTestContext({ withDefaultList: true })
        await context.postMessage({
            messageId: 1,
            content:
                'Hey, check this out: https://memex.garden/. Also interesting: https://notion.so/',
        })
        await context.postMessage({
            channelId: { message: 1 },
            messageId: 2,
            content: `I'm replying to that`,
        })
        await context.postMessage({
            channelId: { message: 1 },
            messageId: 3,
            content: `I'm replying to that too!`,
        })
        await context.assertData({
            users: [1],
            pages: [
                {
                    userId: 1,
                    messageId: 1,
                    normalizedUrls: ['memex.garden', 'notion.so'],
                },
            ],
            replies: [
                {
                    messageId: 1,
                    replyIds: [2, 3],
                },
            ],
        })
    })

    it('should create a list entry and post subsequent messages to both the thread starting link and new one when posting a link a thread', async () => {
        const context = await setupDiscordTestContext({ withDefaultList: true })
        await context.postMessage({
            messageId: 1,
            content: 'Hey, check this out: https://memex.garden/',
        })
        await context.postMessage({
            channelId: { message: 1 },
            messageId: 2,
            content: `I'm replying to that`,
        })
        await context.postMessage({
            channelId: { message: 1 },
            messageId: 3,
            content: `Posting https://another.link/, just to confuse you`,
        })
        await context.postMessage({
            channelId: { message: 1 },
            messageId: 4,
            content: `This should show up as a reply to both messages`,
        })
        await context.assertData({
            users: [1],
            pages: [
                {
                    userId: 1,
                    messageId: 1,
                    normalizedUrls: ['memex.garden'],
                },
                {
                    userId: 1,
                    messageId: 3,
                    originalMessageId: 1,
                    normalizedUrls: ['another.link'],
                },
            ],
            replies: [
                {
                    messageId: 1,
                    replyIds: [2, 3, 4],
                },
                {
                    messageId: 3,
                    replyIds: [4],
                },
            ],
        })
    })
})
