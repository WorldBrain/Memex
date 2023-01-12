import styled from 'styled-components'
import React from 'react'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import * as icons from 'src/common-ui/components/design-library/icons'
import Placeholder from '@tiptap/extension-placeholder'

interface Props {
    children?: any
    onClick: () => void
    header?: string
    showAutoSaved?: boolean
}

export const BackContainer = (props: Props) => (
    <Container>
        <IconBoxBox>
            <IconBox>
                <Icon
                    filePath={icons.arrowLeft}
                    onClick={props.onClick}
                    heightAndWidth="22px"
                />
            </IconBox>
        </IconBoxBox>
        <Header>{props.header}</Header>
        <Placeholder />
        {props.showAutoSaved ? (
            <AutoSaveNote>
                <Icon
                    color={'prime1'}
                    heightAndWidth="20px"
                    hoverOff
                    icon={'check'}
                />
                Autosaved
            </AutoSaveNote>
        ) : undefined}
    </Container>
)

const IconBoxBox = styled.div`
    display: flex;
    justify-content: flex-start;
    width: 60px;
`

const IconBox = styled.div`
    width: fit-content;
`

const Header = styled.div`
    color: ${(props) => props.theme.colors.greyScale4};
    font-weight: 400;
    font-size: 14px;
`

const Container = styled.div`
    height: 50px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 15px;
    margin-bottom: -10px;
`

const AutoSaveNote = styled.div`
    font-weight: 400;
    font-size: 12px;
    color: ${(props) => props.theme.colors.greyScale6};
    display: flex;
    align-items: center;
    right: 20px;
    position: absolute;
`
const Placeholder = styled.div`
    width: 70px;
`
