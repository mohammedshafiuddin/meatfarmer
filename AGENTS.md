# Agent Instructions for Meat Farmer Monorepo

## Important instructions
- Don't try to build the code or run or compile it. Just make changes and leave the rest for the user.
- Don't run any drizzle migrations. User will handle it. 

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
- imports from /packages/ui are aliased as `common-ui` in apps/user-ui and apps/admin-ui

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

## Important Notes
- **Do not run build, compile, or migration commands** - These should be handled manually by developers
- Avoid running `npm run build`, `tsc`, `drizzle-kit generate`, or similar compilation/migration commands
- Schema changes should be committed and migrations generated manually