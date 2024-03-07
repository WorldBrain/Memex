import React from 'react'
import PropTypes from 'prop-types'
import { PrimaryAction } from '@worldbrain/memex-common/lib/common-ui/components/PrimaryAction'
import styled from 'styled-components'

const RemovedText = (props) => {
    return (
        <RemoveContainer>
            You can always enable this feature again via the settings.
            <PrimaryAction
                type={'secondary'}
                size="medium"
                onClick={props.undo}
                label="Undo"
            />
        </RemoveContainer>
    )
}

const RemoveContainer = styled.div`
    box-shadow: 0px 0px 3px rgba(0, 0, 0, 0.1);
    color: ${(props) =>
        props.theme.variant === 'dark'
            ? props.theme.colors.greyScale7
            : props.theme.colors.greyScale7};
    padding: 20px 20px 20px 30px;
    grid-gap: 15px;
    font-size: 14px;
    border-radius: 8px;
    display: flex;
    background: ${(props) =>
        props.theme.variant === 'dark'
            ? props.theme.colors.black
            : props.theme.colors.black};
    display: flex;
    align-items: center;
    justify-content: space-between;
`

RemovedText.propTypes = {
    undo: PropTypes.func.isRequired,
}

export default RemovedText
