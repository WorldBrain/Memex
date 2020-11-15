import React from 'react'
import styled from 'styled-components'

import {
    MarkdownPreview,
    Props as MarkdownPreviewProps,
} from './markdown-preview'

interface MenuItemProps {
    name: string
    getTextToInsert: () => string
}

export interface Props extends MarkdownPreviewProps {
    menuItems: MenuItemProps[]
    updateInputValue: (value: string) => void
}

interface State {
    isOpen: boolean
}

export class MarkdownPreviewAnnotationInsertMenu extends React.Component<
    Props,
    State
> {
    markdownPreviewRef = React.createRef<MarkdownPreview>()

    state: State = { isOpen: false }

    private toggleOpenState = () =>
        this.setState((state) => ({ isOpen: !state.isOpen }))

    private handleItemClick: (
        getTextToInsert: MenuItemProps['getTextToInsert'],
    ) => React.MouseEventHandler = (getTextToInsert) => (e) => {
        const newValue = getTextInsertedAtInputSelection(
            getTextToInsert(),
            this.markdownPreviewRef.current.mainInputRef.current,
        )

        this.props.updateInputValue(newValue)
    }

    private renderInsertMenu = () => (
        <MenuContainer>
            <MenuBtn onClick={this.toggleOpenState}>Insert</MenuBtn>
            {this.state.isOpen && (
                <Menu>
                    {this.props.menuItems.map((props, i) => (
                        <MenuItem
                            key={i}
                            onClick={this.handleItemClick(
                                props.getTextToInsert,
                            )}
                        >
                            {props.name}
                        </MenuItem>
                    ))}
                </Menu>
            )}
        </MenuContainer>
    )

    render() {
        return (
            <MarkdownPreview
                ref={this.markdownPreviewRef}
                {...this.props}
                renderSecondaryBtn={this.renderInsertMenu}
            />
        )
    }
}

const MenuContainer = styled.div``
const MenuItem = styled.li``
const MenuBtn = styled.button``
const Menu = styled.ul``

export const annotationMenuItems: MenuItemProps[] = [
    {
        name: 'YouTube Timestamp',
        getTextToInsert() {
            const videoEl = document.querySelector<HTMLVideoElement>(
                '.video-stream',
            )

            const timestampSecs = Math.trunc(videoEl?.currentTime ?? 0)
            const humanTimestamp = `${Math.floor(timestampSecs / 60)}:${(
                timestampSecs % 60
            )
                .toString()
                .padStart(2, '0')}`

            // TODO: Derive properly
            const videoId = 'TESTID'

            return `[${humanTimestamp}](https://youtu.be/${videoId}?t=${timestampSecs})`
        },
    },
    {
        name: 'Link',
        getTextToInsert() {
            return document.location.href
        },
    },
]

// TODO: Move this somewhere where it can be more useful
export const getTextInsertedAtInputSelection = (
    toInsert: string,
    {
        value,
        selectionStart,
        selectionEnd,
    }: HTMLInputElement | HTMLTextAreaElement,
): string =>
    value.substring(0, selectionStart) +
    toInsert +
    value.substring(selectionEnd, value.length)
