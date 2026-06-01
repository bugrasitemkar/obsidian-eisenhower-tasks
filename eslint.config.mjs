import tseslint from 'typescript-eslint';

export default tseslint.config(
	{
		ignores: ['node_modules/', 'main.js'],
	},
	{
		files: ['src/**/*.ts'],
		extends: [
			...tseslint.configs.recommended,
		],
		rules: {
			'no-console': ['error', { allow: ['warn', 'error', 'debug'] }],
			'@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
			'@typescript-eslint/no-explicit-any': 'warn',
			'@typescript-eslint/explicit-function-return-type': 'off',
		},
	}
);
