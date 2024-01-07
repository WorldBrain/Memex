import expect from 'expect'
import {
    signToken,
    verifyToken,
} from '@worldbrain/memex-common/lib/utils/secure-tokens'
import { setupBackgroundIntegrationTest } from 'src/tests/background-integration-tests'

describe('PDF uploads', () => {
    it('should work', async () => {
        // const setup = await setupBackgroundIntegrationTest()
        const token = await signToken({
            data: { bla: 'test' },
            secret: new TextEncoder().encode('blabla'),
            expiration: '2s',
        })
        await verifyToken({ token, secret: new TextEncoder().encode('blab') })
    })
})
