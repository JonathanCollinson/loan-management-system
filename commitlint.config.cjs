/** @type {import('@commitlint/types').UserConfig} */
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    /**
     * Require a scope so messages match: type(scope): description
     * Example: feat(api): add monthly principal budget
     */
    'scope-empty': [2, 'never'],
  },
};