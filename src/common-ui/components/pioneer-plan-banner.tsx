import * as React from 'react'
import styled from 'styled-components'

import { PrimaryAction } from 'src/common-ui/components/design-library/actions/PrimaryAction'
import { SecondaryAction } from 'src/common-ui/components/design-library/actions/SecondaryAction'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import ButtonTooltip from '@worldbrain/memex-common/lib/common-ui/components/button-tooltip'

const PioneerPlanContainer = styled.div`
    display: flex;
    padding: 15px 15px;
    justify-content: space-between;
    align-items: center;
    background: #f0f0f0;
    border-radius: 3px;
    margin-bottom: 30px;
    width: ${(props) => props.width ?? '760px'};
    flex-direction: ${(props) => props.direction ?? 'row'};
    font-family: 'Poppins',
`
const PioneerPlanContentBox = styled.div`
    display: flex;
    flex-direction: column;
    padding-bottom: ${(props) => (props.direction === 'column' ? '15px' : '0')};
    text-align: ${(props) => (props.direction === 'column' ? 'center' : 'unset')};
`

const PioneerPlanTitle = styled.div`
    font-weight: bold;
    font-size: 14px;
    padding-bottom: ${(props) => (props.direction === 'column' ? '5px' : '0')};
`

const PioneerPlanDescription = styled.div`
    font-size: 12px;
`

const PioneerPlanButtonBox = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    margin-right: -5px;
`

const PioneerPlanLearnMoreButton = styled(SecondaryAction)``

const PioneerPlanUpgradeButton = styled(PrimaryAction)``

export interface Props {
    width?: string
    upgradeUrl?: string
    moreInfoUrl?: string
    onHideClick?: React.MouseEventHandler
    direction?: string
}

const PioneerPlanBanner = ({
    moreInfoUrl = 'https://worldbrain.io/announcements/pioneer-plan',
    upgradeUrl = process.env.NODE_ENV === 'production'
        ? 'https://worldbrain.io/links/pioneer-upgrade-extension'
        : 'https://buy.stripe.com/test_8wMdU4cm4frH4SY144',
    ...props
}: Props) => (
    <PioneerPlanContainer width={props.width} direction={props.direction}>
        <PioneerPlanContentBox direction={props.direction}>
            <PioneerPlanTitle direction={props.direction}>
                Support Memex with the Pioneer Plan
            </PioneerPlanTitle>
            <PioneerPlanDescription>
                Memex is about to evolve significantly. <br /> Become an early supporter and get a
                37% discount.
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
            {props.onHideClick && (
                <ButtonTooltip
                    position="bottom"
                    tooltipText="Find this message again in your account settings."
                >
                    <Icon
                        icon="removeX"
                        height="12px"
                        onClick={props.onHideClick}
                    />
                </ButtonTooltip>
            )}
        </PioneerPlanButtonBox>
    </PioneerPlanContainer>
)

export default PioneerPlanBanner
