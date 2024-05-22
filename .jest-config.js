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
    testMatch: ['<rootDir>/src/**/*.test.(js|jsx|ts|tsx)'],
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
