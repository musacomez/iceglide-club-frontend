import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTypeScript from 'eslint-config-next/typescript';

const config = [
  { ignores: ['.next/**', '.open-next/**', '.wrangler/**', 'next-env.d.ts'] },
  ...nextVitals,
  ...nextTypeScript,
  {
    rules: {
      // Keep the existing data-loading effects and flag them for follow-up.
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
];

export default config;
