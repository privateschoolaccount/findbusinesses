from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    google_places_api_key: str = ''
    database_path: str = 'data/findbusinesses.db'
    port: int = 8000

    model_config = {'env_file': '.env', 'extra': 'ignore'}


settings = Settings()
