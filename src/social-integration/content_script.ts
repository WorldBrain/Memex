import AnnotationsManager from 'src/annotations/annotations-manager'
import initTwitterIntegration from 'src/social-integration/twitter'

export default function initSocialIntegration({
    annotationsManager,
}: {
    annotationsManager: AnnotationsManager
}) {
    const { hostname } = new URL(location.href)

    if (hostname === 'twitter.com') {
        initTwitterIntegration({ annotationsManager })
    }
}
