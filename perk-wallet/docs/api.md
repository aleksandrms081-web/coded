# API Reference

Base URL: `${VITE_API_BASE_URL}` (default `http://localhost:8080`). All JSON. Authenticated routes require `Authorization: Bearer <jwt>`.

## Auth (Sign-In-With-Ethereum)

### `GET /api/auth/nonce`
Returns a one-time nonce to include in the SIWE message.
```json
{ "nonce": "a1b2c3..." }
```

### `POST /api/auth/verify`
Verify a signed SIWE message and receive a session JWT.
```json
// request
{ "message": "<EIP-4361 message>", "signature": "0x..." }
// response
{ "token": "<jwt>", "address": "0xAbc..." }
```

## Profiles

### `GET /api/profiles/:username`
Public. Fetch a profile by username.
```json
{ "address": "0xAbc...", "username": "satoshi", "displayName": "Satoshi", "bio": "hodl", "avatarUrl": "...", "socials": { "x": "..." } }
```

### `GET /api/profiles/by-address/:address`
Public. Fetch a profile by EVM address.

### `POST /api/profiles` 🔒
Create the profile for the authenticated address (called right after wallet creation).
```json
// request
{ "username": "satoshi", "displayName": "Satoshi", "bio": "hodl" }
```
Returns `409` if the username is taken.

### `PATCH /api/profiles` 🔒
Update any of `username`, `displayName`, `bio`, `avatarUrl`, `socials` for the authenticated user.

### `GET /api/profiles/check-username/:username`
Public. Username availability check.
```json
{ "available": true }
```

## Vaults (PerkLock storage)

The server stores **ciphertext only**. Encryption/decryption happens client-side.

### `GET /api/vaults` 🔒
List the authenticated user's vaults (metadata + ciphertext).

### `POST /api/vaults` 🔒
Store a new vault.
```json
{
  "label": "Cold wallet seed",
  "ciphertext": "-----BEGIN AGE ENCRYPTED FILE-----...",
  "unlockRound": 18234567,
  "unlockAt": "2030-01-01T00:00:00Z",
  "kind": "mnemonic"
}
```

### `GET /api/vaults/:id` 🔒
Fetch a single vault by id.

### `DELETE /api/vaults/:id` 🔒
Delete a vault you own.

### `GET /api/vaults/shared/:token`
Public. Resolve a shareable lock link to its ciphertext + metadata (decryptable only after unlock time).

## Errors

All errors use:
```json
{ "error": { "code": "USERNAME_TAKEN", "message": "That username is already in use." } }
```

| Code | HTTP | Meaning |
|------|------|---------|
| `UNAUTHORIZED` | 401 | Missing/invalid token |
| `USERNAME_TAKEN` | 409 | Username already exists |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION` | 422 | Bad input |
