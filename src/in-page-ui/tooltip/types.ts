import type { AnnotationFunctions } from '@worldbrain/memex-common/lib/in-page-ui/types'
import type { AnnotationInterface } from 'src/annotations/background/types'
import type { PageAnnotationsCache } from 'src/annotations/cache'
import type { ContentSharingInterface } from 'src/content-sharing/background/types'
import type { ImageSupportInterface } from 'src/image-support/background/types'
import type { AuthRemoteFunctionsInterface } from 'src/authentication/background/types'
import type { RemoteCollectionsInterface } from 'src/custom-lists/background/types'
import type { RemotePageActivityIndicatorInterface } from 'src/page-activity-indicator/background/types'
import type { AnalyticsCoreInterface } from '@worldbrain/memex-common/lib/analytics/types'
import type { RemoteBGScriptInterface } from 'src/background-script/types'
import type { Storage } from 'webextension-polyfill'
import type { SharedInPageUIState } from '../shared-state/shared-in-page-ui-state'

export interface TooltipDependencies extends AnnotationFunctions {
    inPageUI: SharedInPageUIState
    annotationsBG: AnnotationInterface<'caller'>
    annotationsCache: PageAnnotationsCache
    contentSharingBG: ContentSharingInterface
    imageSupportBG: ImageSupportInterface<'caller'>
    authBG: AuthRemoteFunctionsInterface
    spacesBG: RemoteCollectionsInterface
    bgScriptsBG: RemoteBGScriptInterface<'caller'>
    analyticsBG: AnalyticsCoreInterface
    pageActivityIndicatorBG: RemotePageActivityIndicatorInterface
    localStorageAPI: Storage.LocalStorageArea
}
