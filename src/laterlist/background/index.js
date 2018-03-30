import removeLaterlistByUrl from './deletion'
import { createLaterlistByUrl } from './addition'
import { makeRemotelyCallable } from 'src/util/webextensionRPC'

makeRemotelyCallable({ createLaterlistByUrl })
makeRemotelyCallable({ removeLaterlistByUrl })
