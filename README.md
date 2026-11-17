# Exception & Log Console

Spring Boot 3 (Java 17) backend + React (Vite) frontend demonstrating:

1. **Global exception handling**: one `@RestControllerAdvice` turns every exception into the same JSON error body.
2. **Error testing**: 20+ endpoints/buttons that fail in different ways (4xx and 5xx).
3. **Structured logging**: JSON logs (console, `backend/logs/app.json`, and an in-memory buffer shown in the UI), each with a request id.
4. **Encrypted logging page**: logs are encrypted with AES-256-GCM on the server and decrypted in the browser with a passphrase.

## Run it

Requirements: JDK 17+, Maven 3.9+, Node 18+.

```bash
# terminal 1 - backend (http://localhost:8080)
cd backend
mvn spring-boot:run

# terminal 2 - frontend (http://localhost:5173)
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. The Vite dev server proxies `/api` to the backend.

## Project layout

```
backend/src/main/java/com/example/exlog
  exception/   ApiError, BusinessException, ResourceNotFoundException, GlobalExceptionHandler
  web/         ErrorTestController, RequestIdFilter (MDC request id), WebConfig (CORS), UserRequest
  logging/     InMemoryLogAppender, LogStore, LogController
  crypto/      LogCryptoService (AES-256-GCM + PBKDF2), EncryptedPayload
backend/src/main/resources
  logback-spring.xml   JSON console + JSON file + in-memory appenders
  application.yml
frontend/src
  pages/ErrorTester.jsx, LogsPage.jsx, EncryptedLogsPage.jsx
  api.js, crypto.js (Web Crypto decryption)
```

## API

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/test/errors/{type}` | Trigger an error. Types: `not-found`, `business`, `unauthorized`, `forbidden`, `conflict`, `timeout`, `illegal-argument`, `null-pointer`, `arithmetic`, `array-index`, `class-cast`, `number-format`, `unsupported`, `nested`, `runtime` |
| POST | `/api/test/validate` | Bean validation demo (`{"name","email","age"}`) |
| GET | `/api/test/number/{n}` | Type-mismatch demo (`/abc`) |
| GET | `/api/logs?level=INFO&limit=50` | Structured logs as JSON |
| GET | `/api/logs/encrypted?level=INFO&limit=50` | AES-256-GCM encrypted logs |
| DELETE | `/api/logs` | Clear the in-memory buffer |

### Error response shape

```json
{
  "timestamp": "2026-11-17T10:15:30.123Z",
  "status": 404,
  "error": "Not Found",
  "code": "RESOURCE_NOT_FOUND",
  "message": "User with id '42' was not found",
  "path": "/api/test/errors/not-found",
  "requestId": "a1b2c3d4",
  "details": null
}
```
Validation errors include a `details` array of `{field, message}`. 5xx responses never expose exception messages or stack traces; those go to the log only.

## How the encryption works

* Server: `PBKDF2-HMAC-SHA256(passphrase, random 16-byte salt, 100000 iterations)` -> 256-bit key -> `AES/GCM/NoPadding` with a random 12-byte IV. Response: `{algorithm, kdf, iterations, salt, iv, ciphertext}` (Base64; ciphertext includes the GCM tag).
* Browser (`frontend/src/crypto.js`): derives the same key from the passphrase the user types and decrypts with `crypto.subtle`. A wrong passphrase or tampered data fails GCM authentication.
* The passphrase is `app.logs.secret` in `application.yml` (default `demo-secret-change-me`). Override it with the `LOG_ENCRYPTION_SECRET` environment variable.
* Web Crypto needs a secure context: `http://localhost` works, other hosts need HTTPS.

## Production notes

* The log endpoints are unauthenticated in this demo. Protect `/api/logs/**` (e.g. Spring Security) before real use.
* Use a strong secret from a secrets manager, never the default.
* The in-memory buffer keeps the last 500 events; use the JSON file with a log shipper (ELK, Loki, etc.) for durable storage.
