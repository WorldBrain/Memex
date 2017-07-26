import { makeRemotelyCallable } from 'src/util/webextensionRPC'
import cleanupBlacklist from './cleanup-blacklist'

makeRemotelyCallable({ cleanupBlacklist })
