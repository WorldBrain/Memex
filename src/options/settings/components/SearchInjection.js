import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import * as icons from 'src/common-ui/components/design-library/icons'

import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'

const SearchInjection = ({ children }) => {
    return (
        <Section>
            <SectionCircle>
                <Icon
                    filePath={icons.searchIcon}
                    heightAndWidth="34px"
                    color="purple"
                    hoverOff
                />
            </SectionCircle>
            <SectionTitle>Search Engine Integration</SectionTitle>
            <InfoText>
                Show Memex results alongside your web search results
            </InfoText>
            {children}
        </Section>
    )
}

SearchInjection.propTypes = {
    children: PropTypes.arrayOf(PropTypes.element).isRequired,
}

const Section = styled.div`
    background: #ffffff;
    box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.05);
    border-radius: 12px;
    padding: 50px;
    margin-bottom: 30px;
`

const SectionCircle = styled.div`
    background: ${(props) => props.theme.colors.backgroundHighlight};
    border-radius: 100px;
    height: 80px;
    width: 80px;
    margin-bottom: 30px;
    display: flex;
    justify-content: center;
    align-items: center;
`

const SectionTitle = styled.div`
    color: ${(props) => props.theme.colors.darkerText};
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 10px;
`

const InfoText = styled.div`
    color: ${(props) => props.theme.colors.normalText};
    font-size: 14px;
    margin-bottom: 40px;
    font-weight: 500;
`

export default SearchInjection
