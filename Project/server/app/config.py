from pydantic_settings import BaseSettings , SettingsConfigDict

class Settings(BaseSettings):
    jwt_secret_key:str
    database_url:str
    algoritham:str
    
    
    model_config=SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")
    
    
