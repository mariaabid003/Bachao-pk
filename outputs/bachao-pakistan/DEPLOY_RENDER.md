# Deploy Bachao Pakistan on Render

This project is ready for Render Blueprint deploys with `render.yaml`.

## What Render Will Create

- `bachao-pakistan-api`: FastAPI backend.
- `bachao-pakistan-web`: React/Vite web dashboard.
- `bachao-pakistan-mobile-web`: Expo web build of the mobile app.

Native Android/iOS still deploy through Expo/EAS. Render hosts the web version of the mobile app.

## Deploy Steps

1. Push `outputs/bachao-pakistan` to GitHub as the repository root.
2. In Render, choose **New > Blueprint** and select the repo.
3. Render will detect `render.yaml`.
4. Fill the prompted secret environment variables.
5. Deploy the Blueprint.

## Required Backend Secrets

- `FIREBASE_PROJECT_ID`
- `FIREBASE_PRIVATE_KEY`
- `FIREBASE_CLIENT_EMAIL`
- `ANTHROPIC_API_KEY`
- `AT_USERNAME`
- `AT_API_KEY`

Firebase private keys often contain escaped newlines. Paste them as one value with `\n`; the backend converts them at startup.

## Required Web Secrets

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

## Important

The frontend API URL is set to:

```text
https://bachao-pakistan-api.onrender.com
```

If Render says that service name is unavailable and gives the API a different URL, update `VITE_API_URL` and `EXPO_PUBLIC_API_URL` in the Render dashboard to match the final backend URL.

## Manual Service Settings

If you deploy manually instead of using the Blueprint:

- Backend root: `backend`
- Backend build: `pip install --upgrade pip && pip install -r requirements.txt`
- Backend start: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Web build: `cd web && npm install && npm run build`
- Web publish directory: `web/dist`
- Mobile web build: `cd mobile && npm install && npm run build:web`
- Mobile web publish directory: `mobile/dist`
