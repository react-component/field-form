import type { Config } from 'jest';

const config: Config = {
  setupFilesAfterEnv: ['<rootDir>/tests/setupAfterEnv.ts'],
};

export default config;
