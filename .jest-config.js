module.exports = {
    globals: {
        'ts-jest': {
            tsConfigFile: 'tsconfig.jest.json',
        },
        browser: {},
    },
    testMatch: ['<rootDir>/src/**/*.test.(js|jsx|ts|tsx)'],
    rootDir: '.',
    transform: {
        '^.+\\.(js|jsx)$': '<rootDir>/node_modules/babel-jest',
        '^.+\\.(ts|tsx)$': '<rootDir>/node_modules/ts-jest',
    },
    modulePaths: ['<rootDir>'],
    moduleNameMapper: {
        '\\.(css|less)$': 'identity-obj-proxy',
        '^user-logic$': '<rootDir>/external/user-logic/ts',
        '^user-logic/lib/(.*)': '<rootDir>/external/user-logic/ts/$1',
        '^@worldbrain/([^/]+)$': '<rootDir>/external/@worldbrain/$1/ts',
        '^@worldbrain/([^/]+)/lib/(.+)':
            '<rootDir>/external/@worldbrain/$1/ts/$2',
        '^xxxx@worldbrain/storex$': '<rootDir>/external/@worldbrain/storex/ts',
        '^xxxx@worldbrain/memex-stemmer$':
            '<rootDir>/external/@worldbrain/memex-stemmer/ts',
        '^xxxx@worldbrain/storex/lib/(.*)':
            '<rootDir>/external/@worldbrain/storex/ts/$1',
        '^xxxx@worldbrain/storex-backend-dexie$':
            '<rootDir>/external/@worldbrain/storex-backend-dexie/ts',
        '^xxxx@worldbrain/storex-pattern-modules$':
            '<rootDir>/external/@worldbrain/storex-pattern-modules/ts',
        '^xxxx@worldbrain/storex-backend-dexie/lib/(.*)':
            '<rootDir>/external/@worldbrain/storex-backend-dexie/ts/$1',
    },
    moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx'],
    setupFiles: ['jest-webextension-mock', './setupJest.js'],
    unmockedModulePathPatterns: [
        '<rootDir>/node_modules/react',
        '<rootDir>/node_modules/react-dom',
        '<rootDir>/node_modules/react-addons-test-utils',
        '<rootDir>/node_modules/fbjs',
    ],
}
