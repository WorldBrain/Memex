import React from 'react'
import styled from 'styled-components'
import ButtonTooltip from '@worldbrain/memex-common/lib/common-ui/components/button-tooltip'

import { HoverBox } from 'src/common-ui/components/design-library/HoverBox'
import * as icons from 'src/common-ui/components/design-library/icons'
import {
    AnnotationSearchCopyPaster,
    PageSearchCopyPaster,
} from 'src/copy-paster'
import { SearchType } from '../types'
import { BackgroundSearchParams } from 'src/search/background/types'
import { Icon } from 'src/dashboard-refactor/styled-components'

export interface Props {
    searchType: SearchType
    isCopyPasterShown: boolean
    isCopyPasterBtnShown: boolean
    searchParams: BackgroundSearchParams
    hideCopyPaster: React.MouseEventHandler
    toggleCopyPaster: React.MouseEventHandler
}

export default function SearchCopyPaster(props: Props) {
    if (!props.isCopyPasterBtnShown) {
        return null
    }

    const CopyPaster =
        props.searchType === 'notes'
            ? AnnotationSearchCopyPaster
            : PageSearchCopyPaster

    return (
        <>
            <ButtonTooltip tooltipText="Copy Search Results" position="bottom">
                <Icon
                    path={icons.copy}
                    heightAndWidth="16px"
                    onClick={props.toggleCopyPaster}
                />
            </ButtonTooltip>
            {props.isCopyPasterShown && (
                <HoverBox
                    position={'absolute'}
                    withRelativeContainer
                    top="25px"
                    left="-155px"
                    padding={'0px'}
                >
                    <CopyPaster
                        searchParams={props.searchParams}
                        onClickOutside={props.hideCopyPaster}
                    />
                </HoverBox>
            )}
        </>
    )
}

// TODO: inheirits from .nakedSquareButton
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
