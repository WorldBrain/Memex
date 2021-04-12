import * as React from 'react'

import { AnnotationsSidebarContainer } from './AnnotationsSidebarContainer'
import { SidebarContainerOptions } from 'src/sidebar/annotations-sidebar/containers/logic'

type Props = SidebarContainerOptions & {
    refSidebar?: React.Ref<AnnotationsSidebarContainer>
}

export class AnnotationsSidebarInDashboardResults extends React.Component<
    Props
> {
    static defaultProps: Partial<Props> = {
        theme: { topOffsetPx: 45 },
        showGoToAnnotationBtn: true,
    }

    render() {
        const { refSidebar, ...props } = this.props
        return <AnnotationsSidebarContainer ref={refSidebar} {...props} />
    }
}
