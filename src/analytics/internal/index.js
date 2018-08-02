import Analytics from './analytics'
import { remoteFunction } from 'src/util/webextensionRPC'

const analytics = new Analytics({
    remoteFunction,
})

export default analytics
