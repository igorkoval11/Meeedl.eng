import asyncio
import logging

import uvicorn
from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from aiogram.exceptions import TelegramNetworkError

from backend.api import create_api_app
from backend.bot_handlers import create_router
from backend.config import get_settings


def setup_logging(log_level: str) -> None:
    logging.basicConfig(
        level=getattr(logging, log_level.upper(), logging.INFO),
        format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    )


async def run_polling_forever(dispatcher: Dispatcher, bot: Bot) -> None:
    delay = 1
    while True:
        try:
            await dispatcher.start_polling(bot)
            return
        except TelegramNetworkError as exc:
            logging.getLogger(__name__).warning(
                "Polling temporary network error: %s. Retry in %s sec",
                exc,
                delay,
            )
            await asyncio.sleep(delay)
            delay = min(delay * 2, 30)
        except asyncio.CancelledError:
            raise


async def run() -> None:
    settings = get_settings()
    setup_logging(settings.log_level)

    bot = Bot(
        token=settings.bot_token,
        default=DefaultBotProperties(parse_mode=ParseMode.HTML),
    )
    dispatcher = Dispatcher()
    dispatcher.include_router(create_router(settings))

    api_app = create_api_app(settings=settings)
    uvicorn_config = uvicorn.Config(
        app=api_app,
        host=settings.api_host,
        port=settings.api_port,
        log_level=settings.log_level,
    )
    uvicorn_server = uvicorn.Server(uvicorn_config)

    polling_task = asyncio.create_task(
        run_polling_forever(dispatcher, bot),
        name="telegram-polling",
    )
    api_task = asyncio.create_task(
        uvicorn_server.serve(),
        name="fastapi-server",
    )

    try:
        done, pending = await asyncio.wait(
            {polling_task, api_task},
            return_when=asyncio.FIRST_COMPLETED,
        )

        for task in pending:
            task.cancel()
        await asyncio.gather(*pending, return_exceptions=True)

        for task in done:
            error = task.exception()
            if error:
                raise error
    finally:
        await bot.session.close()


if __name__ == "__main__":
    try:
        asyncio.run(run())
    except KeyboardInterrupt:
        pass
