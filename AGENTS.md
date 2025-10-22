# Agent Instructions for Meat Farmer Monorepo

## Build/Lint/Test Commands
- **Build all apps**: `npm run build` (Turbo pipeline)
- **Lint all apps**: `npm run lint` (Turbo pipeline)
- **Test all apps**: `npm run test` (Turbo pipeline) - Note: No tests currently configured
- **Dev servers**: `npm run dev` (Turbo parallel dev)
- **Single app dev**: `cd apps/{app-name} && npm run start`

## Code Style Guidelines

### TypeScript & React Native
- **Strict TypeScript**: `strict: true` enabled in tsconfig
- **Path aliases**: Use `@/*` for local imports, `common-ui` for shared UI package
- **Component naming**: PascalCase (e.g., `MyButton`, `ImageCarousel`)
- **Function naming**: camelCase (e.g., `handleSubmit`, `getCurrentUserId`)
- **Interface naming**: PascalCase with `Props` suffix (e.g., `ButtonProps`)

### Imports
- React imports first
- Third-party libraries second
- Local imports last
- Use absolute imports with path aliases when possible

### Error Handling
- API errors handled via axios interceptors
- Use `DeviceEventEmitter` for cross-component communication
- Throw custom errors with descriptive messages
- Avoid try-catch blocks unless necessary

### Formatting & Linting
- ESLint with Expo config
- No Prettier configured - follow consistent indentation (2 spaces)
- No semicolons at end of statements
- Single quotes for strings

### Testing
- No test framework currently configured
- When adding tests, use Jest + React Native Testing Library
- Test files: `*.test.tsx` or `*.spec.tsx`

### Architecture
- Monorepo with Turbo
- Shared UI components in `packages/ui`
- Apps: `user-ui`, `admin-ui`, `inspiration-ui`, `inspiration-backend`
- Database: Drizzle ORM with PostgreSQL