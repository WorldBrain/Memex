import { makeRemotelyCallable } from 'src/util/webextensionRPC'
import deleteDocsByUrl from 'src/page-storage/deletion'

makeRemotelyCallable({ cleanupBlacklist: deleteDocsByUrl })
