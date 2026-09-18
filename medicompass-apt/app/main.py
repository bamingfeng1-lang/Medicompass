from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.routes import admin, applications, auth, inquiries, register

app = FastAPI(title="Medicompass API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(applications.router)
app.include_router(inquiries.router)
app.include_router(register.router)
app.include_router(auth.router)
app.include_router(admin.router)


@app.get("/health", tags=["meta"])
def health():
    return {"ok": True}
