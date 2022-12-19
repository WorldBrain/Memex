import React from 'react'
import styled from 'styled-components'
import * as icons from 'src/common-ui/components/design-library/icons'
import {
    AnnotationSearchCopyPaster,
    PageSearchCopyPaster,
} from 'src/copy-paster'
import { SearchType } from '../types'
import { BackgroundSearchParams } from 'src/search/background/types'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import { PopoutBox } from '@worldbrain/memex-common/lib/common-ui/components/popout-box'
import { TooltipBox } from '@worldbrain/memex-common/lib/common-ui/components/tooltip-box'

export interface Props {
    searchType?: SearchType
    isCopyPasterShown?: boolean
    isCopyPasterBtnShown?: boolean
    searchParams?: BackgroundSearchParams
    hideCopyPaster?: React.MouseEventHandler
    toggleCopyPaster?: React.MouseEventHandler
}

function renderCopyPaster(props: Props) {
    const CopyPaster =
        props.searchType === 'notes'
            ? AnnotationSearchCopyPaster
            : PageSearchCopyPaster

    return (
        <CopyPaster
            searchParams={props.searchParams}
            onClickOutside={props.hideCopyPaster}
        />
    )
}

function renderCopyPasterBox(props, copypasterButtonRef) {
    if (props.isCopyPasterShown) {
        return (
            <PopoutBox
                placement={'bottom-end'}
                offsetX={10}
                closeComponent={props.toggleCopyPaster}
                targetElementRef={copypasterButtonRef.current}
            >
                {renderCopyPaster(props)}
            </PopoutBox>
        )
    } else {
        return null
    }
}

export default function SearchCopyPaster(props: Props) {
    const copypasterButtonRef = React.useRef<HTMLDivElement>(null)

    return (
        <Container>
            <TooltipBox tooltipText={'Copy Search Results'} placement="bottom">
                <Icon
                    filePath={icons.copy}
                    heightAndWidth="22px"
                    onClick={props.toggleCopyPaster}
                    active={props.isCopyPasterShown}
                    padding={'6px'}
                    containerRef={copypasterButtonRef}
                />
            </TooltipBox>
            {renderCopyPasterBox(props, copypasterButtonRef)}
        </Container>
    )
}

// TODO: inheirits from .nakedSquareButton

const Container = styled.div``
const ActionBtn = styled.button`
    border-radius: 3px;
    padding: 2px;
    width: 24px;
    height: 24px;
    padding: 3px;
    border-radius: 3px;
    background-repeat: no-repeat;
    background-position: center;
    border: none;
    background-color: transparent;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
        background-color: #e0e0e0;
    }

    &:active {
    }

    &:focus {
        outline: none;
    }

    &:disabled {
        opacity: 0.4;
        background-color: transparent;
    }
`

const ActionIcon = styled.img`
    height: 90%;
    width: auto;
`
