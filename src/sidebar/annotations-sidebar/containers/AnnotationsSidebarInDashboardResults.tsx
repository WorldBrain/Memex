import * as React from 'react'

import { AnnotationsSidebarContainer } from './AnnotationsSidebarContainer'
import { SidebarContainerOptions } from 'src/sidebar/annotations-sidebar/containers/logic'

type Props = SidebarContainerOptions & {
    refSidebar?: React.Ref<AnnotationsSidebarContainer>
    setLoginModalShown: (isShown: boolean) => void
    setDisplayNameModalShown: (isShown: boolean) => void
}

export class AnnotationsSidebarInDashboardResults extends React.Component<
    Props
> {
    static defaultProps: Partial<Props> = {
        theme: { topOffsetPx: 60 },
        showGoToAnnotationBtn: true,
        sidebarContext: 'dashboard',
    }

    render() {
        const { refSidebar, ...props } = this.props
        return <AnnotationsSidebarContainer ref={refSidebar} {...props} />
    }
}
