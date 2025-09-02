const path = require('path');

module.exports = {
  webpack: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@/components': path.resolve(__dirname, 'src/components'),
      '@/hooks': path.resolve(__dirname, 'src/hooks'),
      '@/store': path.resolve(__dirname, 'src/store'),
      '@/types': path.resolve(__dirname, 'src/types'),
      '@/utils': path.resolve(__dirname, 'src/utils'),
      '@/services': path.resolve(__dirname, 'src/services'),
    },
  },
  jest: {
    configure: (jestConfig) => {
      jestConfig.moduleNameMapping = {
        ...jestConfig.moduleNameMapping,
        '^@/(.*)$': '<rootDir>/src/$1',
      };
      return jestConfig;
    },
  },
};

