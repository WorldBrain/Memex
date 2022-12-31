import * as React from 'react'

import { AnnotationsSidebarContainer } from './AnnotationsSidebarContainer'
import { SidebarContainerOptions } from 'src/sidebar/annotations-sidebar/containers/logic'
import { theme } from 'src/common-ui/components/design-library/theme'
import { YoutubePlayer } from '@worldbrain/memex-common/lib/services/youtube/types'

type Props = SidebarContainerOptions & {
    refSidebar?: React.Ref<AnnotationsSidebarContainer>
    setLoginModalShown: (isShown: boolean) => void
    setDisplayNameModalShown: (isShown: boolean) => void
    onNotesSidebarClose?: () => void
}

export class AnnotationsSidebarInDashboardResults extends React.Component<
    Props
> {
    static defaultProps: Partial<Props> = {
        theme: { ...theme, topOffsetPx: 60 },
        showGoToAnnotationBtn: true,
        sidebarContext: 'dashboard',
    }

    render() {
        const { refSidebar, ...props } = this.props
        return <AnnotationsSidebarContainer ref={refSidebar} {...props} />
    }
}
