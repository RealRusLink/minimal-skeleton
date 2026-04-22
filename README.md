# Web Application Skeleton

A minimal skeleton for building web services with **Hono** + **PostgreSQL**. 

##  To Start:

### 1. Prerequisites
- Node.js 18+
- PostgreSQL 12+
- npm or yarn

### 2. Setup

```bash
# Clone/copy project
git clone <repo> && cd <project>

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your values
nano .env

# Build TypeScript
npm run build

# Create database & tables (see Database Setup section)
psql -U postgres -d app_db < schema.sql

# Run
npm start
```

The server will start on `http://localhost:3000` (or port from .env).

## Project Structure

```
src/
├── app.ts                 # Main entry point with initialization chain
├── config.ts              # Environment configuration with validation
├── server.ts              # HTTP server setup
│
├── routes/
│   ├── index.ts           # Route registry with middleware registration
│   ├── middleware.ts      # Middleware base class and implementations
│   ├── api.ts             # API routes
│   └── web.ts             # Static file serving
│
├── db/
│   ├── config.ts          # Database pool configuration
│   └── adapter.ts         # Database query interface
│
├── errors/
│   ├── types.ts           # Error hierarchy and HTTP status mapping
│   └── translators.ts     # Error transformation (Proxy-based)
│
└── public/                # Static files (configured via WEB_PATH)                               
```

## Configuration

All configuration is loaded from environment variables (`.env` file), except logger configuration.

### Required Variables

| Variable | Type | Description |
|----------|------|-------------|
| `WEB_PATH` | string | Path to static files directory |
| `LISTEN_PORT` | number | HTTP server port |
| `DB_HOST` | string | PostgreSQL host |
| `DB_PORT` | number | PostgreSQL port |
| `DB_NAME` | string | Database name |
| `DB_USER` | string | Database user |
| `DB_PASSWORD` | string | Database password |
| `USERS_TABLE` | string | Users table name |


See `.env.example` for a template.

## Database Setup

### Create Database
```bash
createdb app_db -U postgres
```

### Create Users Table
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    secret TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_username ON users(username);
```

##  API Endpoints

### `GET /api`
Returns a test message.

**Response:**
```json
{ "message": "hello" }
```

### `POST /api/secret`
Retrieves a user's secret (credentials-protected).

**Request:**
```bash
curl -X POST http://localhost:3000/api/secret \
  -H "Content-Type: application/json" \
  -d '{"username": "alice", "password": "secret123"}'
```

**Response (200):**
```json
{ "secret": "some_secret_value" }
```

**Response (422 - Invalid Input):**
```
Missing username or password
```

**Response (401 - Auth Failed):**
```
Wrong password
```

## Development

### npm Scripts

```json
{
   "build": "tsc -p tsconfig.json",
   "start": "node ./dist/app.js",
   "clear": "powershell -Command \"Get-ChildItem -Path ./src -Include *.js -Recurse | Remove-Item -Force\""
}
```

### Building & Running

```bash
# Build TypeScript to JavaScript
npm run build

# Run production
npm run start

# Clean compiled files
npm run clean
```

### Code Style
- TypeScript with strict mode enabled
- No external linters configured (add ESLint/Prettier as needed)

## Architecture 

### 1. Builder Pattern for Initialization

Create objects with optional transformations in a fluent way:

```typescript
const db = init(DBConnector, "DB connected", config)
    .addTranslator(DBErrorTranslator)  // Transform errors
    .addLogger();                        // Enable logging
```


### 2. Declarative Middleware Registration

Register middleware once in `app.ts`:

```typescript
const middlewareDeclaration: MiddlewareDeclaration = [
    { middlewareClass: LoggerMiddleware, path: "*" },
    // Add more middleware here
];
```

Then use in `Routes`:
```typescript
for (let m of middlewareList) {
    this.use(m.path, m.middlewareClass.handler);
}
```

Benefits:
- All middleware visible in one place
- Easy to add/remove/reorder
- Middleware is testable (just classes)

### 3. Error Hierarchy

Errors are translated to HTTP status codes automatically:

```
AppError (base class)
├── BusinessError (422)           ← Invalid business logic
├── InfrastructureError (500)     ← Server issue
│   └── DBError (503)             ← DB unavailable
└── Unknown (500)                 ← Unexpected error
```

Usage:
```typescript
if (!username) {
    throw new BusinessError();  // → HTTP 422
}

// Or handle in handler:
if (!success) {
    return c.json({ error: "Invalid credentials" }, 401);
}
```

### 4. Proxy-Based Error Translation

Database errors are automatically caught and translated:

```typescript
// In db/adapter.ts
const translated = DBErrorTranslator(instance);

// Any DatabaseError thrown by postgres library
// is automatically caught and converted to DBError
```

The proxy intercepts all method calls and wraps them with try-catch.

## Extending the Skeleton

### Adding an API Endpoint

1. **Add method to `Api` class:**
```typescript
// src/routes/api.ts
async getUserProfile(c: Context) {
    const { id } = c.req.param();
    
    // Use database
    const user = await this.DBApi.getUserById(id);
    
    // Return response
    return c.json(user);
}
```

2. **Register in `setupRoutes()`:**
```typescript
setupRoutes() {
    this.get("/", (c) => this.sendHello(c));
    this.get("/profile/:id", (c) => this.getUserProfile(c));  // ← Add this
}
```

3. **Done!** The global error handler will catch any errors.

### Adding a Middleware

1. **Create middleware class:**
```typescript
// src/routes/middleware.ts
export class AuthMiddleware extends Middleware {
    protected async execute(c: Context, next: Next) {
        const token = c.req.header("Authorization");
        
        if (!token) {
            return c.json({ error: "Unauthorized" }, 401);
        }
        
        // Validate token...
        await next();
    }
}
```

2. **Register in `app.ts`:**
```typescript
const middlewareDeclaration: MiddlewareDeclaration = [
    { middlewareClass: LoggerMiddleware, path: "*" },
    { middlewareClass: AuthMiddleware, path: "/api/*" },  // ← Add this
];
```

### Adding a Database Method

1. **Add to `DBAdapter`:**
```typescript
// src/db/adapter.ts
async createUser(username: string, password: string): Promise<createUserFeedback> {
    // Uses parameterized queries
    const queryResult = await this.connection.pool.query(
        `INSERT INTO ${this.config.db.tables.users} (username, password) 
         VALUES ($1, $2) 
         ON CONFLICT (username) DO NOTHING 
         RETURNING id`,
        [username, password]
    );
    
    if (queryResult.rows.length === 0) {
        return { success: false, reason: "User already exists" };
    }
    
    return { success: true, id: queryResult.rows[0].id };
}
```

The error translator automatically handles any database errors.

## Security Considerations

This skeleton is **not production-ready as-is** for sensitive operations. 

Before production set custom log levels for modules with sensitive data.

## TypeScript Configuration

The skeleton uses TypeScript with strict mode enabled:

```json
{
   "compilerOptions": {
      "rootDir": "./src",
      "outDir": "./dist",
      "module": "nodenext",
      "moduleResolution": "nodenext",
      "target": "esnext",
      "lib": [
         "esnext"
      ],
      "types": [
         "node"
      ],
      "sourceMap": true,
      "declaration": true,
      "declarationMap": true,
      "noUncheckedIndexedAccess": true,
      "exactOptionalPropertyTypes": true,
      "strict": true,
      "jsx": "react-jsx",
      "verbatimModuleSyntax": true,
      "isolatedModules": true,
      "noUncheckedSideEffectImports": true,
      "moduleDetection": "force",
      "skipLibCheck": true
   }
}
```


