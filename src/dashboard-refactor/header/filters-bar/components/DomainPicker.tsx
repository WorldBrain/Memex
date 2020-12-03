// import React, { PureComponent } from 'react'

// import { IndexDropdown } from 'src/common-ui/containers'

// import { FilterPickerProps } from './types'

// export default class DomainPicker extends PureComponent<FilterPickerProps> {
//     render() {
//         const {
//             env,
//             addIncDomainFilter,
//             delIncDomainFilter,
//             addExcDomainFilter,
//             delExcDomainFilter,
//             domainsInc,
//             domainsExc,
//             suggestedDomains,
//         } = this.props
//         return (
//             <IndexDropdown
//                 env={env}
//                 onFilterAdd={addIncDomainFilter}
//                 onFilterDel={delIncDomainFilter}
//                 onExcFilterAdd={addExcDomainFilter}
//                 onExcFilterDel={delExcDomainFilter}
//                 initFilters={domainsInc}
//                 initExcFilters={domainsExc}
//                 initSuggestions={suggestedDomains.map(({ value }) => value)}
//                 source="domain"
//                 isForSidebar
//                 isForRibbon={env === 'inpage'}
//             />
//         )
//     }
// }
