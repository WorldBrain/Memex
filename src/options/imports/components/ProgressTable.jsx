import React from 'react'
import PropTypes from 'prop-types'
import { IMPORT_TYPE as TYPE } from '../constants'
import styled from 'styled-components'
import * as icons from 'src/common-ui/components/design-library/icons'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'

const ProgressRow = ({
    label,
    total,
    complete,
    success,
    fail,
    changeShowDetails,
    showDownloadDetails,
}) => (
    <ProgressRowContainer>
        <InfoBlock>
            <Progress>
                <Number>{complete}</Number>
                <NumberSmall>/{total}</NumberSmall>
            </Progress>
            <SubTitle>Progress</SubTitle>
        </InfoBlock>
        <InfoBlock>
            <Number>{success}</Number>
            <SubTitle>Successful</SubTitle>
        </InfoBlock>
        <InfoBlock>
            <Number>{fail}</Number>
            <SubTitle>Failed</SubTitle>
        </InfoBlock>
        {fail > 0 && (
            <ViewFailedItems onClick={changeShowDetails}>
                View Failed Items
                <Icon
                    filePath={icons.arrowDown}
                    rotation={!showDownloadDetails ? '-90' : '0'}
                    heightAndWidth={'16px'}
                />
            </ViewFailedItems>
        )}
    </ProgressRowContainer>
)

ProgressRow.propTypes = {
    label: PropTypes.string.isRequired,
    total: PropTypes.number.isRequired,
    complete: PropTypes.number.isRequired,
    success: PropTypes.number.isRequired,
    fail: PropTypes.number.isRequired,
    changeShowDetails: PropTypes.func,
    showDownloadDetails: PropTypes.bool,
}

const ProgressTable = ({
    progress,
    allowTypes,
    changeShowDetails,
    showDownloadDetails,
}) => (
    <>
        <ProgressRow
            label="Bookmarks"
            total={progress[TYPE.OTHERS].total + progress[TYPE.BOOKMARK].total}
            complete={
                progress[TYPE.OTHERS].complete +
                progress[TYPE.BOOKMARK].complete
            }
            success={
                progress[TYPE.OTHERS].success + progress[TYPE.BOOKMARK].success
            }
            fail={progress[TYPE.OTHERS].fail + progress[TYPE.BOOKMARK].fail}
            changeShowDetails={changeShowDetails}
            showDownloadDetails={showDownloadDetails}
        />
    </>
)

const progressShape = PropTypes.shape({
    total: PropTypes.number.isRequired,
    complete: PropTypes.number.isRequired,
    success: PropTypes.number.isRequired,
    fail: PropTypes.number.isRequired,
})

ProgressTable.propTypes = {
    // State
    progress: PropTypes.shape({
        [TYPE.HISTORY]: progressShape.isRequired,
        [TYPE.BOOKMARK]: progressShape.isRequired,
        [TYPE.OTHERS]: progressShape.isRequired,
    }).isRequired,
    allowTypes: PropTypes.object.isRequired,
}

const ViewFailedItems = styled.div`
    color: ${(props) => props.theme.colors.white};
    font-size: 16px;
    display: grid;
    grid-gap: 10px;
    grid-auto-flow: column;
    align-items: center;
    cursor: pointer;
`

const ProgressRowContainer = styled.div`
    display: grid;
    grid-auto-flow: column;
    grid-gap: 50px;
    justify-content: flex-start;
    align-items: center;
    margin-top: 50px;
    margin-bottom: 50px;
    padding-left: 20px;
`

const InfoBlock = styled.div`
    display: grid;
    grid-gap: 5px;
    grid-auto-flow: row;
    justify-content: flex-start;
    align-items: center;
    width: 100px;
`

const Progress = styled.div`
    display: grid;
    grid-auto-flow: column;
    grid-gap: 5px;
    align-items: flex-end;
`

const Number = styled.div`
    color: ${(props) => props.theme.colors.white};
    font-size: 22px;
    font-weight: bold;
    line-height: 28px;
`

const NumberSmall = styled.div`
    color: ${(props) => props.theme.colors.greyScale5};
    font-size: 18px;
    font-weight: bold;
`
const SubTitle = styled.div`
    color: ${(props) => props.theme.colors.greyScale5};
    font-size: 16px;
    font-weight: normal;
`

export default ProgressTable
