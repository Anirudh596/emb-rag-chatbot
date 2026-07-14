from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.services.vector_store import init_vector_store
from app.routes.chat import router as chat_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        import sys
        import os
        parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        if parent_dir not in sys.path:
            sys.path.append(parent_dir)
        from import_orders import main as import_orders_main
        import_orders_main()
    except Exception as e:
        print(f"Failed to import orders: {e}")
        
    init_vector_store()
    yield

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router, prefix="/api")
