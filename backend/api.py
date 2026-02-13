import logging
from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from backend.config import Settings
from backend.plans import serialize_all_plans

logger = logging.getLogger(__name__)


def create_api_app(
    settings: Settings,
) -> FastAPI:
    app = FastAPI(title="Meeedl.Eng Mini App API", version="0.2.0")

    @app.get("/")
    async def root() -> dict[str, str]:
        return {
            "service": "Meeedl.Eng mini app backend",
            "health": "/health",
            "mini_app": "/app",
        }

    @app.get("/health")
    async def health() -> dict[str, str]:
        return {"status": "ok"}

    @app.get("/api/plans")
    async def get_plans() -> dict[str, object]:
        plans_payload = serialize_all_plans()
        for plan_data in plans_payload:
            plan_id = str(plan_data.get("id", "")).lower()
            plan_data["payment_url"] = settings.tribute_url_for_plan(plan_id)
        return {"plans": plans_payload}

    logo_path = Path("logo.jpg").resolve()
    if logo_path.exists():

        @app.get("/logo.jpg", include_in_schema=False)
        async def get_logo() -> FileResponse:
            return FileResponse(logo_path)

    frontend_dist_path = Path(settings.frontend_dist_dir).resolve()
    if frontend_dist_path.exists():
        app.mount(
            "/app",
            StaticFiles(directory=frontend_dist_path, html=True),
            name="miniapp",
        )
    else:
        logger.warning(
            "Frontend build not found at %s. Run 'cd frontend && npm run build'.",
            frontend_dist_path,
        )

    return app
