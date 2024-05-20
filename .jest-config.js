const { jsWithTs: tsjPreset } = require('ts-jest/presets')
const externalTsModules = require('./build/external').externalTsModules

const externalTsModuleMappings = {}
for (const [alias, relPath] of Object.entries(externalTsModules)) {
    Object.assign(externalTsModuleMappings, {
        [`^${alias}$`]: `<rootDir>/external/${relPath}/ts`,
        [`^${alias}/lib/(.*)`]: `<rootDir>/external/${relPath}/ts/$1`,
    })
}

module.exports = {
    testMatch: [
        '<rootDir>/src/in-page-ui/ribbon/react/containers/ribbon/logic.test.ts',
        '<rootDir>/src/overview/onboarding/screens/onboarding/logic.test.ts',
        '<rootDir>/src/annotations/background/storage.test.ts',
        '<rootDir>/src/custom-lists/background/storage.test.ts',
        '<rootDir>/src/copy-paster/template-doc-generation.test.ts',
        '<rootDir>/src/custom-lists/ui/CollectionPicker/logic.test.ts',
        '<rootDir>/src/custom-lists/background/index.test.ts',
        '<rootDir>/src/bookmarks/background/index.test.ts',
        '<rootDir>/src/tests/subscriptionManagement/subscription-storage.test.ts',
        '<rootDir>/src/dashboard-refactor/lists-sidebar/logic.test.ts',
        '<rootDir>/src/readwise-integration/background/index.test.ts',
        '<rootDir>/src/common-ui/GenericPicker/logic.test.ts',
        '<rootDir>/src/personal-cloud/background/backend/translation-layer/page-fetch-storage-hooks.test.ts',
        '<rootDir>/src/popup/logic.test.ts',
        '<rootDir>/src/dashboard-refactor/logic.test.ts',
        '<rootDir>/src/annotations/background/index.test.ts',
        '<rootDir>/src/personal-cloud/background/index.test.ts',
        '<rootDir>/src/dashboard-refactor/logic-modals.test.ts',
        '<rootDir>/src/personal-cloud/ui/onboarding/logic.test.ts',
        '<rootDir>/src/dashboard-refactor/header/sync-status-menu/logic.test.ts',
        '<rootDir>/src/social-previews/cloud-functions.test.ts',
        '<rootDir>/src/dashboard-refactor/search-results/logic.test.ts',
        '<rootDir>/src/dashboard-refactor/logic-filters.test.ts',
        '<rootDir>/src/page-analysis/extract-page-content.test.ts',
        '<rootDir>/src/page-indexing/background/index.test.ts',
        '<rootDir>/src/backup-restore/ui/backup-pane/container.logic.test.ts',
        '<rootDir>/src/activity-indicator/background/index.test.ts',
        '<rootDir>/src/annotations/cache/index.test.ts',
        '<rootDir>/src/storage/index.test.ts',
        '<rootDir>/src/backup-restore/background/index.test.ts',
        '<rootDir>/src/search/pipeline.test.js',
        '<rootDir>/src/readwise-integration/ui/containers/readwise-settings/logic.test.ts',
        '<rootDir>/src/activity-indicator/ui/logic.test.ts',
        '<rootDir>/src/discord/event-processor.test.ts',
        '<rootDir>/src/util/transform-page-text.test.js',
        '<rootDir>/src/util/youtube-url.test.ts',
        '<rootDir>/src/imports/background/service-parsers/netscape-parser.test.ts',
        '<rootDir>/src/copy-paster/utils.test.ts',
        '<rootDir>/src/copy-paster/background/storage.test.ts',
        '<rootDir>/src/summarization-llm/background/index.test.ts',
        '<rootDir>/src/search-injection/utils.test.js',
        '<rootDir>/src/backup-restore/background/procedures/restore/index.test.ts',
        '<rootDir>/src/imports/background/state-manager.test.ts',
        '<rootDir>/src/imports/background/progress-manager.test.ts',
        '<rootDir>/src/tab-management/background/index.test.ts',
        '<rootDir>/src/tags/ui/TagPicker/index.test.tsx',
        '<rootDir>/src/sidebar/annotations-sidebar/containers/logic.test.ts',
        '<rootDir>/src/content-sharing/background/index.test.ts',
    ],
    rootDir: '.',
    transform: {
        ...tsjPreset.transform,
    },
    testEnvironment: 'node',
    transformIgnorePatterns: ['/node_modules/(?!(firebase|@firebase)/)'],
    modulePaths: ['<rootDir>'],
    moduleNameMapper: {
        '\\.(css|less)$': 'identity-obj-proxy',
        ...externalTsModuleMappings,
        'linkedom/worker': 'linkedom',
    },
    moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx'],
    setupFiles: ['jest-webextension-mock', './setupJest.js'],
    resolver: '<rootDir>/jest.resolver.js',
    unmockedModulePathPatterns: [
        '<rootDir>/node_modules/react',
        '<rootDir>/node_modules/react-dom',
        '<rootDir>/node_modules/react-addons-test-utils',
        '<rootDir>/node_modules/fbjs',
    ],
    globals: {
        'ts-jest': {
            // This apparently speeds things up, at the expense of type-checking
            // https://github.com/kulshekhar/ts-jest/issues/259#issuecomment-888978737
            isolatedModules: true,
        },
    },
    // Enable this to get type-checking back (maybe when we get CI set up again)
    // maxWorkers: 1,
}
