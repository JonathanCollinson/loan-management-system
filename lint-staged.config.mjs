export default {
  'apps/api/**/*.{ts,tsx}': (files) => {
    const rel = files.map((f) => f.replace(/^apps\/api\//, ''));
    if (rel.length === 0) {
      return [];
    }
    return `pnpm --filter @lms/api exec eslint --max-warnings 0 --fix ${rel.map((f) => `"${f}"`).join(' ')}`;
  },
  'apps/web/**/*.{ts,tsx}': (files) => {
    const rel = files.map((f) => f.replace(/^apps\/web\//, ''));
    if (rel.length === 0) {
      return [];
    }
    return `pnpm --filter @lms/web exec eslint --max-warnings 0 --fix ${rel.map((f) => `"${f}"`).join(' ')}`;
  },
};
