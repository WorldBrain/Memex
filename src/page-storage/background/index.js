import deleteDocsByUrl from 'src/page-storage/deletion'
import { makeRemotelyCallable } from 'src/util/webextensionRPC'
import { fetchPagesByUrlPattern } from 'src/pouchdb'

makeRemotelyCallable({ deleteDocsByUrl, fetchPagesByUrlPattern })
