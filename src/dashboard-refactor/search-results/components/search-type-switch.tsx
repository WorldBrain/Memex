import React, { PureComponent } from 'react'
import styled from 'styled-components'

import colors from 'src/dashboard-refactor/colors'
import { SearchType } from '../types'
import * as icons from 'src/common-ui/components/design-library/icons'
import { Icon } from 'src/dashboard-refactor/styled-components'
import { PrimaryAction } from '@worldbrain/memex-common/lib/common-ui/components/PrimaryAction'

export interface Props {
    onNotesSearchSwitch: React.MouseEventHandler<HTMLButtonElement>
    onPagesSearchSwitch: React.MouseEventHandler<HTMLButtonElement>
    onVideosSearchSwitch: React.MouseEventHandler<HTMLButtonElement>
    onTwitterSearchSwitch: React.MouseEventHandler<HTMLButtonElement>
    onPDFSearchSwitch: React.MouseEventHandler<HTMLButtonElement>
    searchType: SearchType
}

export default class SearchTypeSwitch extends PureComponent<Props> {
    render() {
        return (
            <SearchTypeSwitchContainer>
                <PrimaryAction
                    icon={'cursor'}
                    type={'tertiary'}
                    label={'Web'}
                    onClick={this.props.onPagesSearchSwitch}
                    active={this.props.searchType === 'pages'}
                    size={'small'}
                />
                <PrimaryAction
                    icon={'highlight'}
                    type={'tertiary'}
                    label={'Highlights'}
                    onClick={this.props.onNotesSearchSwitch}
                    active={this.props.searchType === 'notes'}
                    size={'small'}
                />
                <PrimaryAction
                    icon={'play'}
                    type={'tertiary'}
                    label={'Videos'}
                    onClick={this.props.onVideosSearchSwitch}
                    active={this.props.searchType === 'videos'}
                    size={'small'}
                />
                <PrimaryAction
                    icon={'twitter'}
                    type={'tertiary'}
                    label={'Tweets'}
                    onClick={this.props.onTwitterSearchSwitch}
                    active={this.props.searchType === 'twitter'}
                    size={'small'}
                />
                <PrimaryAction
                    icon={'filePDF'}
                    type={'tertiary'}
                    label={'PDFs'}
                    onClick={this.props.onPDFSearchSwitch}
                    active={this.props.searchType === 'pdf'}
                    size={'small'}
                />
            </SearchTypeSwitchContainer>
        )
    }
}

const SearchTypeSwitchContainer = styled.div`
    display: flex;
    grid-gap: 3px;
`
