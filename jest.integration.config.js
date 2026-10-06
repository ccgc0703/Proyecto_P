/** Jest para los tests de integracion: requieren PostgreSQL (DATABASE_URL). */
module.exports = {
    rootDir: 'src',
    testMatch: ['**/*.integration.spec.ts'],
    moduleFileExtensions: ['js', 'json', 'ts'],
    transform: {
        '^.+\\.(t|j)s$': 'ts-jest',
    },
    testEnvironment: 'node',
    testTimeout: 60000,
    maxWorkers: 1,
};
