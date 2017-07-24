import { makeRemotelyCallable } from 'src/util/webextensionRPC'
import quickBlacklistConfirm from './quick-blacklist-confirm'

makeRemotelyCallable({ quickBlacklistConfirm })
