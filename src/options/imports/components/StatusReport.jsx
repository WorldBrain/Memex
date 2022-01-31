import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import * as icons from 'src/common-ui/components/design-library/icons'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'

const StatusReport = ({
    successCount,
    failCount,
    changeShowDetails,
    showDownloadDetails,
    children,
}) => (
    <div>
        <ProgressRowContainer>
            <InfoBlock>
                <Progress>
                    <Number>{successCount}</Number>
                </Progress>
                <SubTitle>Successful</SubTitle>
            </InfoBlock>
            <InfoBlock>
                <Number>{failCount}</Number>
                <SubTitle>Failed</SubTitle>
            </InfoBlock>
            <ViewFailedItems onClick={changeShowDetails}>
                View Failed Items
                <Icon
                    filePath={icons.triangle}
                    rotation={!showDownloadDetails ? '-90' : '0'}
                    heightAndWidth={'16px'}
                />
            </ViewFailedItems>
        </ProgressRowContainer>

        {/* <div className={localStyles.reportDetails}>
            <p>{`Succeeded (${successCount})`}</p>
            <p>
                {`Failed (${failCount})`} (
                <a target="_blank" href="https://worldbrain.io/import_bug">
                    ?
                </a>
                )
            </p>
            <p>{`Total (${successCount + failCount})`}</p>
            {children && (
                <TypographyHeadingSmall className={localStyles.showDetails}>
                    <a onClick={changeShowDetails}>{children}</a>
                </TypographyHeadingSmall>
            )}
        </div> */}
    </div>
)

StatusReport.propTypes = {
    successCount: PropTypes.number.isRequired,
    failCount: PropTypes.number.isRequired,
    changeShowDetails: PropTypes.func.isRequired,
    children: PropTypes.string,
    showDownloadDetails: PropTypes.bool,
}

const ViewFailedItems = styled.div`
    color: ${(props) => props.theme.colors.normalText};
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
    grid-gap: 3px;
    align-items: center;
`

const Number = styled.div`
    color: ${(props) => props.theme.colors.darkerText};
    font-size: 22px;
    font-weight: bold;
`

const SubTitle = styled.div`
    color: ${(props) => props.theme.colors.lighterText};
    font-size: 16px;
    font-weight: normal;
`

export default StatusReport
