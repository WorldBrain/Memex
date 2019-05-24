import { Tweet } from '../types'

export const tweet: Tweet = {
    id: 12,
    serviceId: '12',
    text: 'This is a tweet',
    userId: 1,
    hashtags: [],
    createdAt: new Date(1556025857000),
    createdWhen: new Date('2019-04-29T10:02Z'),
}

export const tweet2: Tweet = {
    id: 123,
    serviceId: '123',
    text: 'This is a tweet with hashtags #hashtag #test',
    userId: 2,
    hashtags: ['#hashtag', '#test'],
    createdAt: new Date(1555578729000),
    createdWhen: new Date('2019-04-29T10:03Z'),
}
