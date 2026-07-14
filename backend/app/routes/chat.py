import json
import time

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from app.services.router_agent import route_query
from app.services.sql_agent import generate_sql_query, execute_sql
from app.services.vector_store import query_vector_store
from app.services.llm_client import get_model, generate_content_with_retry

router = APIRouter()


class ChatRequest(BaseModel):
    message: str


def stream_chat(message: str):
    route_data = route_query(message)
    yield f"data: {json.dumps({'event': 'route', 'data': route_data})}\n\n"
    time.sleep(0.01)

    route = route_data.get("route", "none")
    sql_query = None
    sql_result = None
    rag_context = ""

    if route in ("sql", "both"):
        try:
            sql_query = generate_sql_query(message)
            yield f"data: {json.dumps({'event': 'sql', 'data': sql_query})}\n\n"

            sql_execution = execute_sql(sql_query)
            sql_result = sql_execution.get("results")
            err = sql_execution.get("error")

            if err:
                yield f"data: {json.dumps({'event': 'sql_error', 'data': err})}\n\n"
            else:
                yield f"data: {json.dumps({'event': 'sql_result', 'data': sql_result})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'event': 'error', 'data': f'Database query failed: {str(e)}'})}\n\n"
            yield f"data: {json.dumps({'event': 'done', 'data': {}})}\n\n"
            return

    if route in ("rag", "both"):
        try:
            rag_results = query_vector_store(message)
            citations = list(set([res["source"] for res in rag_results]))
            yield f"data: {json.dumps({'event': 'citations', 'data': citations})}\n\n"
            rag_context = "\n\n".join(
                [f"Source: {res['source']}\nContent: {res['text']}" for res in rag_results]
            )
        except Exception as e:
            yield f"data: {json.dumps({'event': 'error', 'data': f'Document search failed: {str(e)}'})}\n\n"
            yield f"data: {json.dumps({'event': 'done', 'data': {}})}\n\n"
            return

    if route == "none":
        fallback_msg = "I don't have that information."
        for char in fallback_msg:
            yield f"data: {json.dumps({'event': 'content', 'data': char})}\n\n"
            time.sleep(0.01)
    else:
        model = get_model()
        system_prompt = f"""You are a helpful company assistant for Northwind Gadgets.
The current date is 15 June 2026. Any calculations for relative times must be computed relative to this date: 2026-06-15.
Answer the user's question accurately using only the provided database results and document contexts.
If the information to answer is not present in the provided contexts, do not make it up, simply say: "I don't have that information."
Do not hallucinate policy text or SQL columns.

User Question: {message}
"""
        if sql_query and sql_result is not None:
            system_prompt += f"\n\nGenerated SQLite Query: {sql_query}\nDatabase Query Result:\n{json.dumps(sql_result, indent=2)}"

        if rag_context:
            system_prompt += f"\n\nDocument Context:\n{rag_context}"

        system_prompt += "\n\nProvide a concise and helpful response. If you used policies, cite the document names (e.g. returns_policy.pdf) where appropriate, but focus on answering the question directly."

        try:
            response_stream = generate_content_with_retry(model, system_prompt, stream=True)
            for chunk in response_stream:
                try:
                    text = chunk.text
                    if text:
                        yield f"data: {json.dumps({'event': 'content', 'data': text})}\n\n"
                except ValueError:
                    pass
        except Exception as e:
            yield f"data: {json.dumps({'event': 'error', 'data': str(e)})}\n\n"

    yield f"data: {json.dumps({'event': 'done', 'data': {}})}\n\n"


@router.post("/chat")
async def chat_endpoint(request: ChatRequest):
    return StreamingResponse(stream_chat(request.message), media_type="text/event-stream")
