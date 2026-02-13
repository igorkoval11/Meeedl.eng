from aiogram import Router
from aiogram.enums import ParseMode
from aiogram.filters import CommandStart
from aiogram.types import (
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    Message,
    WebAppInfo,
)

from backend.config import Settings
from backend.emoji import EMOJI, EMOJI_FALLBACK, tg_emoji


def _emoji(name: str) -> str:
    return tg_emoji(EMOJI[name], EMOJI_FALLBACK[name])


def _normalize_support_username(value: str) -> str:
    username = value.strip()
    if not username:
        return "@youdaew"
    return username if username.startswith("@") else f"@{username}"


def _support_link(username: str) -> str:
    cleaned = username.lstrip("@")
    if not cleaned:
        return "https://t.me/youdaew"
    return f"https://t.me/{cleaned}"


def build_start_keyboard(
    settings: Settings, support_username: str
) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="Открыть Meeedl.Pack",
                    web_app=WebAppInfo(url=settings.build_webapp_url()),
                )
            ],
            [
                InlineKeyboardButton(
                    text=f"Вопросы: {support_username}",
                    url=_support_link(support_username),
                )
            ],
        ]
    )


def _start_text(support_username: str) -> str:
    return (
        f"{_emoji('fire')} <b>Meeedl.Pack</b> — закрытое пространство для роста в английском.\n\n"
        f"{_emoji('gift')} Внутри: материалы, практика, комьюнити и понятная структура.\n"
        f"{_emoji('key')} Нажмите кнопку ниже, чтобы открыть mini app и выбрать тариф.\n\n"
        f"{_emoji('message')} По вопросам: {support_username}"
    )


def create_router(settings: Settings) -> Router:
    router = Router()
    support_username = _normalize_support_username(settings.support_username)
    keyboard = build_start_keyboard(settings, support_username)

    @router.message(CommandStart())
    async def handle_start(message: Message) -> None:
        await message.answer(
            _start_text(support_username),
            reply_markup=keyboard,
            parse_mode=ParseMode.HTML,
        )

    @router.message()
    async def handle_fallback(message: Message) -> None:
        await message.answer(
            "Откройте Meeedl.Pack через кнопку ниже.",
            reply_markup=keyboard,
            parse_mode=ParseMode.HTML,
        )

    return router
