import { makeRemotelyCallable } from 'src/util/webextensionRPC'
import deleteDocsByUrl, { calcMatchingDocs } from 'src/page-storage/deletion'

makeRemotelyCallable({ deleteDocsByUrl, calcMatchingDocs })
