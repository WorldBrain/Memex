import React from 'react'
import styled from 'styled-components'
import { colorPrimary } from 'src/common-ui/components/design-library/colors'

const Checkmark = props => (
    <svg
        height="13"
        width="13"
        viewBox="0 0 16 16"
        color={colorPrimary}
        fill={colorPrimary}
        style={{ color: colorPrimary }}
    >
        <path d="M13.5 2l-7.5 7.5-3.5-3.5-2.5 2.5 6 6 10-10z" />
    </svg>
)

export default styled(Checkmark)`
    display: inline-block;
    vertical-align: middle;
    color: ${colorPrimary};

    svg {
        color: ${colorPrimary};
        margin-right: 10px;
    }
`
