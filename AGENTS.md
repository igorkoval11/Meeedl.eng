# Agent Instructions for Meeedl.Eng

This is a Telegram Mini App for selling access to a closed channel via Tribute payment.

## Project Structure

- **Backend**: Python 3.11+, FastAPI, aiogram (Telegram bot), Pydantic settings
- **Frontend**: React 18 + Vite, no additional UI libraries
- **Config**: `.env` file (see `.env.example`)

## Commands

### Backend
```bash
# Install dependencies
pip install -r requirements.txt

# Run development server (bot + API)
python main.py

# Validate Python syntax
python -m compileall backend main.py

# Type check (if mypy installed)
mypy backend main.py --ignore-missing-imports
```

### Frontend
```bash
cd frontend

# Install dependencies
npm install

# Development server
npm run dev

# Production build (required for backend static files)
npm run build

# Preview production build
npm run preview
```

### Full Setup
```bash
# 1. Setup environment
copy .env.example .env  # Edit with your values

# 2. Backend
pip install -r requirements.txt

# 3. Frontend
cd frontend && npm install && npm run build && cd ..

# 4. Run
python main.py
```

## Code Style Guidelines

### Python (Backend)

#### Imports
- Standard library first, third-party second, local imports last
- Use absolute imports from `backend.` prefix
- Group with blank lines between sections

```python
import logging
from pathlib import Path

from fastapi import FastAPI
from aiogram import Router

from backend.config import Settings
from backend.plans import serialize_all_plans
```

#### Naming Conventions
- `snake_case` for variables, functions, modules
- `PascalCase` for classes (Pydantic models, dataclasses)
- `UPPER_CASE` for constants at module level
- Private functions: `_leading_underscore`

#### Types
- Use type hints on all function signatures
- Use `from __future__ import annotations` for Python 3.9+ compatibility
- Prefer explicit return types even when obvious

```python
def create_api_app(settings: Settings) -> FastAPI:
    ...

async def health() -> dict[str, str]:
    ...
```

#### Pydantic Settings
- Use `Field(..., alias="ENV_VAR_NAME")` for environment variables
- Use `@lru_cache` for settings singleton
- Provide sensible defaults for non-sensitive config

```python
class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    
    bot_token: str = Field(..., alias="BOT_TOKEN")
    api_port: int = Field(8000, alias="API_PORT")
```

#### Error Handling
- Use specific exceptions, avoid bare `except:`
- Log errors with context using `logging.getLogger(__name__)`
- Return fallback values for non-critical failures (e.g., payment URL resolution)

#### Async Patterns
- Use `async/await` consistently (aiogram and FastAPI are async)
- Avoid `asyncio.run()` inside the main loop
- Prefer `asyncio.gather()` for parallel operations

### React (Frontend)

#### Style
- Functional components with hooks
- `camelCase` for variables/functions, `PascalCase` for components
- Destructure props in component signature

```jsx
function PlanCard({ plan, active, onSelect }) {
  return <button className={active ? "active" : ""} onClick={() => onSelect(plan.id)}>...
}
```

#### API Calls
- Use `fetch()` with async/await
- Implement loading and error states
- Provide fallback data for graceful degradation

```javascript
const [plans, setPlans] = useState(FALLBACK_PLANS);
const [state, setState] = useState("loading");
```

#### CSS Classes
- Use semantic class names in `kebab-case`
- Prefer composition over dynamic class strings when possible

## Testing

This project has no test suite configured. When adding tests:

```bash
# Install test dependencies
pip install pytest pytest-asyncio httpx

# Run all tests
pytest

# Run single test file
pytest tests/test_api.py

# Run single test
pytest tests/test_api.py::test_health_endpoint

# With coverage
pytest --cov=backend --cov-report=term-missing
```

## Environment Variables

Critical variables that must be set in `.env`:

| Variable | Purpose | Example |
|----------|---------|---------|
| `BOT_TOKEN` | Telegram bot token | `123456:ABC...` |
| `APP_BASE_URL` | Public HTTPS URL for Mini App | `https://your-domain.com` |
| `TRIBUTE_URL_LITE` | 1-month payment link | `https://t.me/tribute/app?...` |
| `TRIBUTE_URL_PLUS` | 3-month payment link | `https://t.me/tribute/app?...` |
| `TRIBUTE_URL_PRO` | 6-month payment link | `https://t.me/tribute/app?...` |

## Common Tasks

- **Add new tariff**: Edit `backend/plans.py` and add corresponding `TRIBUTE_URL_*` in `.env`
- **Change support contact**: Update `SUPPORT_USERNAME` in `.env`
- **Modify Mini App UI**: Edit `frontend/src/App.jsx` and `styles.css`
- **Add new API endpoint**: Add route in `backend/api.py`
- **Update bot behavior**: Modify `backend/bot_handlers.py`

## Notes

- No linting tools are currently configured; use `python -m compileall` for syntax checks
- Frontend build output goes to `frontend/dist/` and is served statically by FastAPI
- The bot and API run in the same process (see `main.py`)
- All payment processing is handled externally by Tribute
