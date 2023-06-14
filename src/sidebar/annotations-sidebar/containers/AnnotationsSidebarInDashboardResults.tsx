import * as React from 'react'

import { AnnotationsSidebarContainer } from './AnnotationsSidebarContainer'
import { SidebarContainerOptions } from 'src/sidebar/annotations-sidebar/containers/logic'

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
        showGoToAnnotationBtn: true,
        sidebarContext: 'dashboard',
    }

    constructor(props) {
        super({
            ...props,
            theme: {
                ...props.theme,
                topOffsetPx: 60,
            },
        })
    }

    render() {
        const { refSidebar, ...props } = this.props
        return <AnnotationsSidebarContainer ref={refSidebar} {...props} />
    }
}
