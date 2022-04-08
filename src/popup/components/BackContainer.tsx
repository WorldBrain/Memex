import styled from 'styled-components'
import React from 'react'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import * as icons from 'src/common-ui/components/design-library/icons'

interface Props {
    children?: any
    onClick: () => void
    header?: string
}

export const BackContainer = (props: Props) => (
    <Container>
        <IconBoxBox>
            <IconBox>
                <Icon
                    filePath={icons.arrowRight}
                    onClick={props.onClick}
                    heightAndWidth="16px"
                />
            </IconBox>
        </IconBoxBox>
        <Header>{props.header}</Header>
        <AutoSaveNote>Autosaved</AutoSaveNote>
    </Container>
)

const IconBoxBox = styled.div`
    display: flex;
    justify-content: flex-start;
    width: 60px;
`

const IconBox = styled.div`
    transform: rotate(-180deg);
    width: fit-content;
`

const Header = styled.div`
    color: ${(props) => props.theme.colors.darkerText};
    font-weight: 700;
    font-size: 16px;
`

const Container = styled.div`
    height: 50px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid ${(props) => props.theme.colors.lineGrey};
    padding: 0 20px;
`

const AutoSaveNote = styled.div`
    font-weight: 400;
    font-size: 12px;
    color: ${(props) => props.theme.colors.lighterText};
    width: 60px;
`
