import * as React from 'react'
import styled from 'styled-components'

import niceTime from 'src/util/nice-time'
import { AnnotationMode } from 'src/sidebar/annotations-sidebar/types'
// import { CrowdfundingBox } from 'src/common-ui/crowdfunding'
import AnnotationView from 'src/annotations/components/AnnotationView'
import AnnotationFooter, {
    AnnotationFooterEventProps,
} from 'src/annotations/components/AnnotationFooter'
import AnnotationEdit, {
    AnnotationEditGeneralProps,
    AnnotationEditEventProps,
} from 'src/annotations/components/AnnotationEdit'
import TextTruncated from 'src/annotations/components/parts/TextTruncated'
import { GenericPickerDependenciesMinusSave } from 'src/common-ui/GenericPicker/logic'

const getTruncatedTextObject: (
    text: string,
) => { isTextTooLong: boolean; text: string } = (text) => {
    if (text.length > 280) {
        const truncatedText = text.slice(0, 280)
        return {
            isTextTooLong: true,
            text: truncatedText,
        }
    }

    for (let i = 0, newlineCount = 0; i < text.length; ++i) {
        if (text[i] === '\n') {
            newlineCount++
            if (newlineCount > 4) {
                const truncatedText = text.slice(0, i)
                return {
                    isTextTooLong: true,
                    text: truncatedText,
                }
            }
        }
    }

    return {
        isTextTooLong: false,
        text,
    }
}

export interface AnnotationEditableGeneralProps {
    // displayCrowdfunding: boolean
}

export interface AnnotationEditableProps {
    /** Required to decide how to go to an annotation when it's clicked. */
    url: string
    className?: string
    isActive?: boolean
    isHovered?: boolean
    createdWhen: number
    lastEdited: number
    body?: string
    comment?: string
    tags: string[]
    hasBookmark?: boolean
    mode: AnnotationMode
    tagPickerDependencies: GenericPickerDependenciesMinusSave
    annotationEditDependencies: AnnotationEditGeneralProps &
        AnnotationEditEventProps
    annotationFooterDependencies: AnnotationFooterEventProps
}

export interface AnnotationEditableEventProps {
    onGoToAnnotation: (url: string) => void
    onMouseEnter?: (url: string) => void
    onMouseLeave?: (url: string) => void
}

export type Props = AnnotationEditableGeneralProps &
    AnnotationEditableProps &
    AnnotationEditableEventProps

export default class AnnotationEditable extends React.Component<Props> {
    private boxRef: HTMLDivElement = null
    private removeEventListeners?: () => void

    static defaultProps: Partial<Props> = {
        mode: 'default',
    }

    componentDidMount() {
        this.setupEventListeners()
    }

    componentWillUnmount() {
        if (this.boxRef && this.removeEventListeners) {
            this.removeEventListeners()
        }
    }

    private get isEdited(): boolean {
        return (
            this.props.lastEdited &&
            this.props.lastEdited !== this.props.createdWhen
        )
    }

    private get isClickable(): boolean {
        // TODO (sidebar-refactor) remove env usage
        return this.props.body != null // && this.props.env !== 'overview'
    }

    private setupEventListeners = () => {
        if (this.boxRef) {
            const handleMouseEnter = () =>
                this.props.onMouseEnter(this.props.url)
            const handleMouseLeave = () =>
                this.props.onMouseLeave(this.props.url)

            this.boxRef.addEventListener('mouseenter', handleMouseEnter)
            this.boxRef.addEventListener('mouseleave', handleMouseLeave)

            this.removeEventListeners = () => {
                this.boxRef.removeEventListener('mouseenter', handleMouseEnter)
                this.boxRef.removeEventListener('mouseleave', handleMouseLeave)
            }
        }
    }

    private setBoxRef = (ref: HTMLDivElement) => {
        this.boxRef = ref
    }

    private getFormattedTimestamp = () =>
        niceTime(this.props.lastEdited ?? this.props.createdWhen)

    private handleGoToAnnotation = () => {
        if (!this.isClickable) {
            return
        }

        this.props.onGoToAnnotation(this.props.url)
    }

    private renderHighlightBody() {
        if (!this.props.body) {
            return
        }

        return (
            <HighlightStyled>
                <HighlightTextStyled>
                    <TextTruncated
                        text={this.props.body}
                        getTruncatedTextObject={getTruncatedTextObject}
                    />
                </HighlightTextStyled>
            </HighlightStyled>
        )
    }

    private renderFooter() {
        const {
            annotationFooterDependencies,
            onGoToAnnotation,
            ...props
        } = this.props

        return <AnnotationFooter {...props} {...annotationFooterDependencies} />
    }

    private renderMainAnnotation() {
        const {
            mode,
            annotationEditDependencies,
            tagPickerDependencies,
        } = this.props

        if (mode === 'edit') {
            return (
                <AnnotationEdit
                    {...this.props}
                    {...annotationEditDependencies}
                    tagPickerDependencies={tagPickerDependencies}
                    rows={2}
                />
            )
        }

        return (
            <AnnotationView
                {...this.props}
                getTruncatedTextObject={getTruncatedTextObject}
                isEdited={this.isEdited}
                timestamp={this.getFormattedTimestamp()}
                hasBookmark={!!this.props.hasBookmark}
            />
        )
    }

    render() {
        // if (this.props.displayCrowdfunding) {
        //     return (
        //         <CrowdfundingBox
        //             onClose={() => console.log('close')}
        //         />
        //     )
        // }

        return (
            <AnnotationStyled
                {...this.props}
                id={this.props.url} // Focusing on annotation relies on this ID.
                ref={this.setBoxRef}
                onClick={this.handleGoToAnnotation}
            >
                {this.renderHighlightBody()}
                {this.renderMainAnnotation()}
                {this.renderFooter()}
            </AnnotationStyled>
        )
    }
}

const HighlightTextStyled = styled.span`
    background-color: #00d88b;
    padding: 2px 0;
    line-height: 25px;
    font-style: normal;
    color: #3a2f45;
`

const HighlightStyled = styled.div`
    font-weight: 400;
    font-size: 14px;
    letter-spacing: 0.5px;
    margin: 0 0 5px 0;
    padding: 15px 15px 7px 15px;
    line-height: 20px;
    text-align: left;
`

const AnnotationStyled = styled.div`
    border-radius: 3px;

    color: rgb(54, 54, 46);

    box-shadow: rgba(15, 15, 15, 0.1) 0px 0px 0px 1px,
        rgba(15, 15, 15, 0.1) 0px 2px 4px;
    transition: background 120ms ease-in 0s;

    &:hover {
        transition: background 120ms ease-in 0s;
        background-color: rgba(55, 53, 47, 0.03);
    }

    box-sizing: border-box;
    width: 100%;
    display: flex;
    flex-direction: column;
    font-size: 14px;
    margin: 10px 0 5px 0;
    cursor: pointer;
    animation: onload 0.3s cubic-bezier(0.65, 0.05, 0.36, 1);

    ${(props: Props) =>
        props.isActive &&
        `
        box-shadow: 0px 0px 5px 1px #00000080;
    `}

    // TODO (sidebar-refactor) remove env usage
    // (props: Props) =>
    //     props.body &&
    //     props.env === 'overview' &&
    //
    //     cursor: pointer;
    // }

    ${(props: Props) =>
        props.mode === 'edit' &&
        `
        background-color: white;
        cursor: default;
    `}
`
