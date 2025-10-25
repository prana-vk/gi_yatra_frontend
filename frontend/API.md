# Frontend API Integration Guide (local testing)

This document describes the exact endpoints and instructions to test the frontend against a local backend at http://127.0.0.1:8000.

Base URL for local testing

- Use: http://127.0.0.1:8000
- You can set this in the frontend by creating a `.env` file in the project root with:

```
REACT_APP_API_URL=http://127.0.0.1:8000
REACT_APP_FRONTEND_API_KEY=
```

If `REACT_APP_API_URL` is set, the frontend axios client will use it directly. If not set, the dev build uses CRA proxy (package.json `proxy`) when `NODE_ENV` is `development`.

API endpoints (relative to base URL, adjust prefix `/api/` depending on your server routing)

- Signup (classic): POST /api/auth/signup/
- OTP Signup request: POST /api/auth/api/signup/request-otp/
- OTP Signup confirm: POST /api/auth/api/signup/confirm-otp/
- Login: POST /api/auth/login/
- Logout: POST /api/auth/logout/ (requires Authorization: Token <token>)
- Current user: GET /api/auth/me/ (requires Authorization header)
- Password reset (token-link): POST /api/auth/password-reset/ and POST /api/auth/password-reset/confirm/
- Password reset (OTP): POST /api/auth/api/password-reset/request-otp/ and POST /api/auth/api/password-reset/confirm-otp/

Headers

- For JSON bodies: `Content-Type: application/json`
- For authenticated endpoints: `Authorization: Token <token>`
- For SPA OTP endpoints (if the server has `FRONTEND_API_KEY` configured): include `X-API-KEY: <REACT_APP_FRONTEND_API_KEY>`

Notes on SPA OTP behavior

- OTP is 6-digit numeric, TTL 5 minutes. If request-otp is called again during TTL, the same OTP is reused.
- Max 5 wrong attempts per OTP then block for 2 hours from first_failed_at.
- Request endpoints return neutral messages to avoid account enumeration.

Frontend setup checklist

1. Ensure backend is running locally:

```powershell
# from backend project root (where manage.py exists)
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py runserver 127.0.0.1:8000
```

2. In the frontend project root, create `.env` with:

```
REACT_APP_API_URL=http://127.0.0.1:8000
# If your backend requires a frontend API key for SPA endpoints, set it here.
REACT_APP_FRONTEND_API_KEY=your_frontend_api_key_here
```

3. Restart the frontend dev server (`npm start`). The frontend will use the explicit `REACT_APP_API_URL` instead of CRA proxy.

4. Test flows:
- Signup OTP: open signup page → request code → check backend console (if DEBUG) for OTP or the email sent.
- Confirm OTP: enter OTP + password → on success token is stored in localStorage as `auth_token`.
- Password reset token-link: request reset → open the link from email (or server console) and POST new password.
- Password reset OTP: request OTP → confirm OTP + new password.

Troubleshooting

- If the frontend gets a 4xx/5xx response, inspect the response body in DevTools Network tab — server usually returns `error` or `detail` field.
- Make sure the backend `CORS_ALLOWED_ORIGINS` includes `http://localhost:3000` if not using CRA proxy.
- If tests show an empty `X-API-KEY` header being sent, set `REACT_APP_FRONTEND_API_KEY` in `.env` or leave it blank; the frontend will only send the header when non-empty.

Contact

If you need the exact backend `urls.py` mapping, or want me to add small helper snippets for axios calls, tell me and I'll add them here.
