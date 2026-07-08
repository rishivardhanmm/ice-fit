# Ice Fit

Premium mobile-first PWA for local iPhone testing with a backend API on the Windows laptop.

## Local Run

```powershell
npm.cmd install
npm.cmd run dev -- --hostname 0.0.0.0
```

Open on the laptop at [http://localhost:3000](http://localhost:3000).

For iPhone testing, find the laptop IPv4 address:

```powershell
ipconfig
```

Then open `http://<laptop-ip>:3000` in iPhone Safari. Do not use `localhost` on the iPhone.

## Architecture

The browser only calls relative API routes:

```ts
fetch("/api/workout/today");
```

MSSQL and OpenAI calls happen only in the Express backend. Database host, Windows Authentication settings and `OPENAI_API_KEY` must stay in `.env` and never enter frontend code.

## AI Endpoint

The backend supports OpenAI-compatible Azure AI Foundry endpoints:

```powershell
OPENAI_BASE_URL=https://behaviourchangefoundry.services.ai.azure.com/openai/v1
OPENAI_MODEL=gpt-4o-mini
OPENAI_API_KEY=your-server-side-key
```

AI parsing is normalized on the server before planning so friendly model output becomes app-safe values such as `knee_pain`, `dumbbells`, and `bench`.

The app does not assume body weight. Height, current weight, and fat-loss target weight are asked in onboarding. BMI is shown only when the user provides both height and weight, and it is treated as general context rather than medical advice.

## MSSQL

Create `.env` from `.env.example`, then create the database `ice_training_dev` locally. Apply the schema with:

```powershell
npm.cmd run db:schema
```

The app can run with in-memory data when MSSQL is unavailable, which keeps the first iPhone UI test fast.

For Windows Authentication, install a local SQL Server ODBC driver and match `.env`:

```powershell
DB_ODBC_DRIVER=ODBC Driver 18 for SQL Server
```
