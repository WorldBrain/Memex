import { User, Tweet } from '../types'

export const tweetA: Tweet = {
    serviceId: '12',
    text: 'This is a tweet',
    userId: 1,
    hashtags: [],
    createdAt: new Date(1556025857000),
    createdWhen: new Date('2019-04-29T10:02Z'),
}

export const tweetB: Tweet = {
    serviceId: '123',
    text: 'This is a tweet with hashtags #hashtag #test',
    userId: 2,
    hashtags: ['#hashtag', '#test'],
    createdAt: new Date(1555578729000),
    createdWhen: new Date('2019-04-29T10:03Z'),
}

export const hashTagA = 'tagA'
export const hashTagB = 'tagB'
export const tagA = 'tagA'
export const tagB = 'tagB'
export const customListNameA = 'testA'

export const userA: User = {
    id: 1,
    name: 'Test Acc',
    type: 'twitter',
    username: 'tester',
}
