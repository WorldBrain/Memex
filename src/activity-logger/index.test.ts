import { isLoggable } from '.'

describe('URL loggability tests', () => {
    it('isLoggable function should match desired URLs', () => {
        interface TestCase {
            url: string
            shouldPass: boolean
        }

        const testCases: TestCase[] = [
            { url: 'https://worldbrain.io', shouldPass: true },
            { url: 'https://worldbrain.io/test', shouldPass: true },
            { url: 'http://worldbrain.io/test', shouldPass: true },
            { url: 'http://worldbrain.io/@test', shouldPass: true },
            { url: 'http://worldbrain.io/@test$', shouldPass: true },
            { url: 'http://worldbrain.io/test#', shouldPass: true },
            { url: 'http://worldbrain.io/test/test_(test)', shouldPass: true },
            { url: 'http://worldbrain.io/test/test+test', shouldPass: true },
            { url: 'http://worldbrain.io/test/test:test', shouldPass: true },
            { url: 'http://worldbrain.io:550505/test/test', shouldPass: true },
            {
                url:
                    'https://en.wikipedia.org/wiki/Theater_District,_Manhattan',
                shouldPass: true,
            },
            { url: 'http://worldbrain.io/test/', shouldPass: true },
            {
                url: 'http://worldbrain-werwer.sdf.sdf.wer.wr.sdf.io/test',
                shouldPass: true,
            },
            { url: 'https://worldbrain.io/test#hash', shouldPass: true },
            {
                url: 'https://worldbrain.io/test?query=ok',
                shouldPass: true,
            },
            {
                url: 'https://worldbrain.io/test?query=ok&other=ok',
                shouldPass: true,
            },
            { url: 'https://', shouldPass: false },
            { url: 'http://', shouldPass: false },
            { url: '', shouldPass: false },
            { url: 'https://worldbrain.io/test.jpg', shouldPass: false },
            { url: 'https://worldbrain.io/test.png', shouldPass: false },
            { url: 'https://worldbrain.io/test.svg', shouldPass: false },
            { url: 'https://worldbrain.io/test.gif', shouldPass: false },
            { url: 'about:config', shouldPass: false },
            { url: 'mailto:test@worldbrain.io', shouldPass: false },
            { url: 'test@worldbrain.io', shouldPass: false },
            { url: 'chrome://extensions', shouldPass: false },
            { url: 'worldbrain.com', shouldPass: false },
            { url: 'ftp://worldbrain.com', shouldPass: false },
        ]

        for (const { url, shouldPass } of testCases) {
            expect([url, isLoggable({ url })]).toEqual([url, shouldPass])
        }
    })
})
