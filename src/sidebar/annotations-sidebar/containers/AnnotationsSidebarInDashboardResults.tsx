import * as React from 'react'

import { AnnotationsSidebarContainer } from './AnnotationsSidebarContainer'
import { SidebarContainerOptions } from 'src/sidebar/annotations-sidebar/containers/logic'
import { MemexTheme } from '@worldbrain/memex-common/lib/common-ui/styles/types'
import { ImageSupportInterface } from 'src/image-support/background/types'
import styled from 'styled-components'

type Props = SidebarContainerOptions & {
    refSidebar?: React.Ref<AnnotationsSidebarContainer>
    setLoginModalShown: (isShown: boolean) => void
    setDisplayNameModalShown: (isShown: boolean) => void
    onNotesSidebarClose?: () => void
    theme: MemexTheme
    imageSupport?: ImageSupportInterface<'caller'>
    saveHighlightColor: (color, id, unifiedId) => void
    saveHighlightColorSettings: (newState) => void
    getHighlightColorSettings: () => void
    highlightColorSettings: string
    inPageMode?: boolean
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
        return (
            <SlideInWrapper id="memex-annotations-sidebar">
                <AnnotationsSidebarContainer
                    {...props}
                    theme={props.theme}
                    ref={refSidebar}
                />
            </SlideInWrapper>
        )
    }
}

const SlideInWrapper = styled.div`
    transition: width 200ms ease-in-out, opacity 200ms ease-in-out;

    display: flex;
    justify-content: flex-start;
    position: relative; /* Adjust as needed */
`
