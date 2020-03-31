import { ContentScriptComponent } from '../types'
import { RemoteFunction } from 'src/util/webextensionRPC'

export interface ContentScriptsInterface<Role extends 'provider' | 'caller'> {
    injectContentScriptComponent: RemoteFunction<
        Role,
        { component: ContentScriptComponent }
    >
}
