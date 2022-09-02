async function setupTestContext() {
    return {
        postMessage: async (params) => {},
        assertPages: async (params) => {},
        assertReplies: async (params) => {},
    }
}

describe('Discord event processor', () => {
    it('should ignore message that do not contain links and are not replies to links', async () => {
        const context = await setupTestContext()
    })

    it('should create a page list entry when posting a link to a channel', async () => {
        const context = await setupTestContext()
        await context.postMessage({
            messageId: 'msg-1',
            content: 'Hey, check this out: https://memex.garden/',
        })
        await context.assertPages({
            messageId: 'msg-1',
            links: ['https://memex.garden/'],
        })
    })

    it('should create page list entres when posting multiple links to a channel in the same message', async () => {
        const context = await setupTestContext()
        await context.postMessage({
            messageId: 'msg-1',
            content:
                'Hey, check this out: https://memex.garden/. Also interesting: https://notion.so/',
        })
        await context.assertPages({
            messageId: 'msg-1',
            links: ['https://memex.garden/', 'https://notion.so/'],
        })
    })

    it('should post annotations when replies are posted to a link in a channel', async () => {
        const context = await setupTestContext()
        await context.postMessage({
            messageId: 'msg-1',
            content: 'Hey, check this out: https://memex.garden/',
        })
        await context.postMessage({
            messageId: 'msg-2',
            replyTo: 'msg-1',
            content: `I'm replying to that`,
        })
        await context.postMessage({
            messageId: 'msg-3',
            replyTo: 'msg-2',
            content: `I'm replying to that too!`,
        })
        await context.assertReplies({
            messageId: 'msg-1',
            replies: ['msg-2', 'msg-3'],
        })
    })

    it('should post annotations when replies are posted to a message with multiple links in a channel', async () => {
        const context = await setupTestContext()
        await context.postMessage({
            messageId: 'msg-1',
            content:
                'Hey, check this out: https://memex.garden/. Also interesting: https://notion.so/',
        })
        await context.postMessage({
            messageId: 'msg-2',
            replyTo: 'msg-1',
            content: `I'm replying to that`,
        })
        await context.postMessage({
            messageId: 'msg-3',
            replyTo: 'msg-2',
            content: `I'm replying to that too!`,
        })
        await context.assertReplies({
            messageId: 'msg-1',
            replies: ['msg-2', 'msg-3'],
        })
    })

    it('should post annotations when a message is posted in a thread of a message containing a link', async () => {
        const context = await setupTestContext()
        await context.postMessage({
            messageId: 'msg-1',
            content: 'Hey, check this out: https://memex.garden/',
        })
        await context.postMessage({
            channelId: 'msg-1',
            messageId: 'msg-2',
            content: `I'm replying to that`,
        })
        await context.postMessage({
            channelId: 'msg-1',
            messageId: 'msg-3',
            content: `I'm replying to that too!`,
        })
        await context.assertReplies({
            messageId: 'msg-1',
            replies: ['msg-2', 'msg-3'],
        })
    })

    it('should post annotations when a message is posted in a thread of a message containing multiple links', async () => {
        const context = await setupTestContext()
        await context.postMessage({
            messageId: 'msg-1',
            content:
                'Hey, check this out: https://memex.garden/. Also interesting: https://notion.so/',
        })
        await context.postMessage({
            channelId: 'msg-1',
            messageId: 'msg-2',
            content: `I'm replying to that`,
        })
        await context.postMessage({
            channelId: 'msg-1',
            messageId: 'msg-3',
            content: `I'm replying to that too!`,
        })
        await context.assertReplies({
            messageId: 'msg-1',
            replies: ['msg-2', 'msg-3'],
        })
    })

    it('should create a list entry and post subsequent messages to both the thread starting link and new one when posting a link a thread', async () => {
        const context = await setupTestContext()
        await context.postMessage({
            messageId: 'msg-1',
            content: 'Hey, check this out: https://memex.garden/',
        })
        await context.postMessage({
            channelId: 'msg-1',
            messageId: 'msg-2',
            content: `I'm replying to that`,
        })
        await context.postMessage({
            channelId: 'msg-1',
            messageId: 'msg-3',
            content: `Posting https://another.link/, just to confuse you`,
        })
        await context.postMessage({
            channelId: 'msg-1',
            messageId: 'msg-4',
            content: `This should show up as a reply to both messages`,
        })
        await context.assertReplies({
            messageId: 'msg-1',
            replies: ['msg-2', 'msg-3', 'msg-4'],
        })
        await context.assertReplies({
            messageId: 'msg-3',
            replies: ['msg-4'],
        })
    })
})
