from pydantic import BaseModel


class InitializeRequest(BaseModel):
    plan: str
