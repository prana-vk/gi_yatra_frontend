# Authentication & Password Reset (backend integration notes)

This frontend supports multiple backend auth flows. Configure the backend endpoints and optionally set the `REACT_APP_FRONTEND_API_KEY` environment variable when the server requires an `X-API-KEY` header for SPA OTP endpoints.

- Token-based login: `POST /api/auth/login/` (returns `token`) — the app stores the token in `localStorage` as `auth_token` and sends `Authorization: Token <token>` on protected requests.
- Token-link password reset (recommended):
  - Request: `POST /api/auth/password-reset/` with `{ email }` — server emails a link to the frontend `FRONTEND_URL` containing `uid` and `token`.
  - Confirm: `POST /api/auth/password-reset/confirm/` with `{ uid, token, new_password }`.
- SPA OTP flows (optional):
  - Signup OTP request: `POST /api/auth/api/signup/request-otp/` with `{ email }` and optional `X-API-KEY` header.
  - Signup OTP confirm: `POST /api/auth/api/signup/confirm-otp/` with `{ email, otp, password }`.
  - Password reset OTP request: `POST /api/auth/api/password-reset/request-otp/` with `{ email }` and optional `X-API-KEY` header.
  - Password reset OTP confirm: `POST /api/auth/api/password-reset/confirm-otp/` with `{ email, otp, new_password }`.

Set `REACT_APP_FRONTEND_API_KEY` in `.env` to have the frontend include the `X-API-KEY` header automatically for SPA OTP endpoints. In development the header is optional if the server is not configured with a key.

Example `.env` entry:

```bash
REACT_APP_FRONTEND_API_KEY=6f2d9e5a8c4b3f1a2d7e9c0b5a1f3e7b
REACT_APP_API_URL=https://backend-k4x8.onrender.com
```

If you plan to use OTP signup or OTP password reset flows, use the helpers exported from `src/services/giyatraApi.js`:

- `signupRequestOtp(email)`
- `signupConfirmOtp(email, otp, password)`
- `passwordResetRequestOtp(email)`
- `passwordResetConfirmOtp(email, otp, newPassword)`
