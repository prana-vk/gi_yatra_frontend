# API Usage Guide — Frontend Handoff

Date: 2025-10-21

This one-page guide summarizes the API surface, authentication, and frontend display rules your team should rely on.

## Base
- API base path: `/api`
- Production base URL: `https://backend-k4x8.onrender.com/api`


## Authentication (Token-based)
All auth endpoints live under `/auth/`.

- Signup
  - Method: POST
  - Path: `/api/auth/signup/`
  - Body: { username (required), password (required), email (optional, must be unique if provided) }
  - Returns: { token }

- Login
  - Method: POST
  - Path: `/api/auth/login/`
  - Body: { username, password }
  - Returns: { token }

- Logout
  - Method: POST
  - Path: `/api/auth/logout/`
  - Headers: `Authorization: Token <token>`
  - Behavior: Revokes the current token

- Current user
  - Method: GET
  - Path: `/api/auth/me/`
  - Headers: `Authorization: Token <token>`
  - Returns: { id, username, email }

Frontend notes for auth:
- After signup/login store the token securely (localStorage/sessionStorage or a secure store) and send `Authorization: Token <token>` on subsequent authenticated requests.
- Public read-only endpoints do not require a token.


## GI Locations (read-only)
- List
  - Method: GET
  - Path: `/api/gi-locations/`
  - Query params:
    - `district` (exact match, optional)
    - `search` (searches name, description, district, optional)
    - `ordering` (`name|district|created_at`, prefix with `-` for desc, optional)
  - Each item includes: `sellable_quantity` (number or null), `image_url` (absolute URL string or null)

- Detail
  - Method: GET
  - Path: `/api/gi-locations/{id}/`
  - Includes `sellable_quantity`

- Districts
  - Method: GET
  - Path: `/api/gi-locations/districts/`
  - Returns: array of district names (string[])

- Grouped by district
  - Method: GET
  - Path: `/api/gi-locations/by_district/`
  - Returns: object keyed by district name; each value is an array of GI location objects (each includes `sellable_quantity`)

Display rules for `sellable_quantity` (important):
- If `sellable_quantity` is `null` or not present → show badge: "Not for sale" (treat as not sellable)
- If `sellable_quantity` is `0` or any non-negative integer → show badge: "X available" (0 must display exactly as "0 available")

Change impact:
- New field `sellable_quantity` is surfaced in list/detail/grouped endpoints.
- Frontend should display a simple badge/label per the rules above. No write actions required.


## Ad Locations (read-only)
- List
  - Method: GET
  - Path: `/api/ad-locations/`
  - Query params:
    - `district` (optional)
    - `service_type` (single, optional)
    - `service_types` (CSV list, optional; e.g., `Hotel,Guide`)
    - `search` (optional)
    - `ordering` (`name|district|service_type|created_at`, optional)

- Detail
  - Method: GET
  - Path: `/api/ad-locations/{id}/`

- Service types enum
  - Method: GET
  - Path: `/api/ad-locations/service_types/`
  - Returns: list of available service types (`{ value, label }[]`)

- Grouped by service type
  - Method: GET
  - Path: `/api/ad-locations/by_service_type/`
  - Returns: object keyed by service type with label and locations


## Trips (requires auth)
All trip endpoints require header: `Authorization: Token <token>`

- List (my trips)
  - Method: GET
  - Path: `/api/trips/`

- Detail
  - Method: GET
  - Path: `/api/trips/{id}/`

- Create
  - Method: POST
  - Path: `/api/trips/`

- Add location to a trip
  - Method: POST
  - Path: `/api/trips/{id}/add_location/`
  - Body: { gi_location_id | ad_location_id }

- Remove location
  - Method: DELETE
  - Path: `/api/trips/{id}/remove_location/`
  - Body / payload: { selected_location_id }


## Summary of backend changes you can rely on
- Token-based auth enabled; endpoints under `/api/auth/`.
- GI endpoints now include `sellable_quantity` for each location.
- `image_url` remains available; no change to how images are consumed.
- Admin/web URLs are unchanged and not needed by the frontend.


## Implementation checklist for frontend
- [ ] Persist auth token after login/signup and include `Authorization: Token <token>` for protected endpoints.
- [ ] Surface `sellable_quantity` in GI listings/detail/grouped UI using the display rules above.
- [ ] No write operations are required for GI/ad endpoints; trips endpoints are available and require auth.


## Optional: Export to PDF
If you want a PDF brief, you can convert this markdown to PDF locally. Example using Pandoc (if installed):

```powershell
pandoc docs/API_USAGE_GUIDE.md -o docs/API_USAGE_GUIDE.pdf
```

Or use any markdown-to-PDF converter in your editor.


---
If you want, I can also produce a 1-page PDF with embedded screenshots and example JSON responses—tell me which endpoints you'd like examples for and I’ll add them.
