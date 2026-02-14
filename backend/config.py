from functools import lru_cache

from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    bot_token: str = Field(..., alias="BOT_TOKEN")
    owner_chat_id: int = Field(..., alias="OWNER_CHAT_ID")

    app_base_url: str = Field("https://example.com", alias="APP_BASE_URL")
    webapp_path: str = Field("/app", alias="WEBAPP_PATH")

    api_host: str = Field("0.0.0.0", alias="API_HOST")
    api_port: int = Field(
        8000,
        validation_alias=AliasChoices("API_PORT", "PORT"),
    )
    log_level: str = Field("info", alias="LOG_LEVEL")

    frontend_dist_dir: str = Field("frontend/dist", alias="FRONTEND_DIST_DIR")
    support_username: str = Field("@youdaew", alias="SUPPORT_USERNAME")

    tribute_url_lite: str = Field("", alias="TRIBUTE_URL_LITE")
    tribute_url_plus: str = Field("", alias="TRIBUTE_URL_PLUS")
    tribute_url_pro: str = Field("", alias="TRIBUTE_URL_PRO")
    tribute_url_default: str = Field(
        "https://t.me/tribute", alias="TRIBUTE_URL_DEFAULT"
    )

    @property
    def normalized_webapp_base(self) -> str:
        return self.app_base_url.rstrip("/")

    def build_webapp_url(self) -> str:
        path = (
            self.webapp_path
            if self.webapp_path.startswith("/")
            else f"/{self.webapp_path}"
        )
        return f"{self.normalized_webapp_base}{path}"

    def tribute_url_for_plan(self, plan_id: str) -> str:
        mapping = {
            "lite": self.tribute_url_lite,
            "plus": self.tribute_url_plus,
            "pro": self.tribute_url_pro,
        }
        value = mapping.get(plan_id, "")
        if value and value.strip():
            return value.strip()
        return self.tribute_url_default.strip()


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
