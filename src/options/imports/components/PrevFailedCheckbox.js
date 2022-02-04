import React from 'react'
import PropTypes from 'prop-types'
import { Checkbox } from 'src/common-ui/components'
import styled from 'styled-components'

const PrevFailedCheckbox = (props) => (
    <React.Fragment>
        <Checkbox
            id="process-failed"
            handleChange={props.onChange}
            isChecked={props.checked}
        >
            <Label>
                <LabelMain htmlFor="process-failed">
                    Include previously failed urls
                </LabelMain>
                <SubLabel htmlFor="process-failed">
                    Retry also urls that have previously been unsuccessful
                </SubLabel>
            </Label>
        </Checkbox>
    </React.Fragment>
)

const Label = styled.div`
    display: grid;
    grid-gap: 5px;
    grid-auto-flow: row;
    align-items: flex-start;
    justify-content: center;
`

const LabelMain = styled.div`
    font-size: 14px;
    font-weight: 500;
    color: ${(props) => props.theme.colors.darkerText};
`

const SubLabel = styled.div`
    color: ${(props) => props.theme.colors.lighterText};
    font-size: 14px;
`

PrevFailedCheckbox.propTypes = {
    checked: PropTypes.bool.isRequired,
    onChange: PropTypes.func.isRequired,
}

export default PrevFailedCheckbox
