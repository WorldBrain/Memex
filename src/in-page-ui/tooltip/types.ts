import type { SharedInPageUIInterface } from 'src/in-page-ui/shared-state/types'
import type { AnnotationFunctions } from '@worldbrain/memex-common/lib/in-page-ui/types'
import { AnnotationInterface } from 'src/annotations/background/types'
import { PageAnnotationsCache } from 'src/annotations/cache'
import { ContentSharingInterface } from 'src/content-sharing/background/types'
import { ImageSupportInterface } from 'src/image-support/background/types'
import { AuthRemoteFunctionsInterface } from 'src/authentication/background/types'
import { RemoteCollectionsInterface } from 'src/custom-lists/background/types'
import { RemotePageActivityIndicatorInterface } from 'src/page-activity-indicator/background/types'
import { AnalyticsCoreInterface } from '@worldbrain/memex-common/lib/analytics/types'
import { RemoteBGScriptInterface } from 'src/background-script/types'
import { Storage } from 'webextension-polyfill'

export interface TooltipDependencies extends AnnotationFunctions {
    inPageUI: SharedInPageUIInterface
    annotationsBG: AnnotationInterface<'caller'>
    annotationsCache: PageAnnotationsCache
    contentSharingBG: ContentSharingInterface
    imageSupportBG: ImageSupportInterface<'caller'>
    authBG: AuthRemoteFunctionsInterface
    spacesBG: RemoteCollectionsInterface
    bgScriptsBG: RemoteBGScriptInterface
    analyticsBG: AnalyticsCoreInterface
    pageActivityIndicatorBG: RemotePageActivityIndicatorInterface
    localStorageAPI: Storage.LocalStorageArea
}
