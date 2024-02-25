import * as React from 'react'
import styled from 'styled-components'

import { PrimaryAction } from '@worldbrain/memex-common/lib/common-ui/components/PrimaryAction'
import { SecondaryAction } from 'src/common-ui/components/design-library/actions/SecondaryAction'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import { colorDarkText } from 'src/common-ui/components/design-library/colors'
import DismissibleResultsMessage from 'src/dashboard-refactor/search-results/components/dismissible-results-message'
import { TooltipBox } from '@worldbrain/memex-common/lib/common-ui/components/tooltip-box'

const PioneerPlanContainer = styled.div`
    display: flex;
    padding: 15px 15px;
    justify-content: space-between;
    align-items: center;
    border-radius: 3px;
    margin-bottom: 30px;
    width: 100%;
    flex-direction: column;
    font-family: 'Satoshi', sans-serif;
    font-feature-settings: 'pnum' on, 'lnum' on, 'case' on, 'ss03' on, 'ss04' on,
        'liga' off;
`
const PioneerPlanContentBox = styled.div`
    display: flex;
    flex-direction: column;
    padding-bottom: 15px;
    text-align: center;
`

const PioneerPlanTitle = styled.div`
    font-weight: bold;
    font-size: 16px;
    text-align: center;
    padding-bottom: 5px;
    color: ${colorDarkText};
`

const PioneerPlanDescription = styled.div`
    font-size: 14px;
    text-align: center;
    color: ${colorDarkText};
`

const PioneerPlanButtonBox = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
`

const PioneerPlanLearnMoreButton = styled(SecondaryAction)``

const PioneerPlanUpgradeButton = styled(PrimaryAction)``

export interface Props {
    width?: string
    upgradeUrl?: string
    moreInfoUrl?: string
    onHideClick?: React.MouseEventHandler
    direction?: string
    showCloseButton?: boolean
}

const PioneerPlanBanner = ({
    moreInfoUrl = 'https://worldbrain.io/announcements/back-to-beta',
    upgradeUrl = process.env.NODE_ENV === 'production'
        ? 'https://worldbrain.io/links/pioneer-upgrade-extension'
        : 'https://buy.stripe.com/test_8wMdU4cm4frH4SY144',
    ...props
}: Props) => (
    <DismissibleResultsMessage onDismiss={props.onHideClick}>
        <PioneerPlanContentBox>
            <PioneerPlanTitle>Get a 60% early bird discount</PioneerPlanTitle>
            <PioneerPlanDescription>
                Memex is currently in beta and free to use.
                <br />
                Support a 'Venture Capital'-free business & get an early bird
                discount on our upcoming subscriptions.
            </PioneerPlanDescription>
        </PioneerPlanContentBox>
        <PioneerPlanButtonBox>
            <PioneerPlanLearnMoreButton
                label="Learn More"
                onClick={() => window.open(moreInfoUrl)}
            />
            <PioneerPlanUpgradeButton
                label="Upgrade"
                onClick={() => window.open(upgradeUrl)}
            />
            {props.showCloseButton && (
                <TooltipBox
                    placement="bottom"
                    tooltipText="Find this message again in your account settings."
                    getPortalRoot={null}
                >
                    <Icon
                        icon="removeX"
                        height="12px"
                        onClick={props.onHideClick}
                    />
                </TooltipBox>
            )}
        </PioneerPlanButtonBox>
    </DismissibleResultsMessage>
)

const SectionTitle = styled.div`
    color: ${(props) => props.theme.colors.darkerText};
    font-size: 20px;
    font-weight: bold;
    margin-bottom: 10px;
`

const InfoText = styled.div`
    color: ${(props) => props.theme.colors.white};
    font-size: 14px;
    font-weight: 500;
    margin-bottom: 20px;
`

export default PioneerPlanBanner
