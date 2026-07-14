import json
import sys
import re
from app.services.llm_client import get_model, generate_content_with_retry

SQL_KEYWORDS = [
    "how many", "total", "count", "sum", "revenue", "orders", "pending",
    "delivered", "cancelled", "shipped", "processing", "returned", "amount",
    "last month", "this month", "last week", "order id", "ord-", "customer",
    "product", "average", "avg", "min", "max", "date", "when was", "status of"
]

DOC_KEYWORDS = [
    "policy", "policies", "refund", "return", "warranty", "leave", "faq",
    "delivery time", "payment", "cash on delivery", "cod", "how long",
    "eligible", "terms", "conditions", "rules", "allowed", "days", "window",
    "exchange", "damaged", "defective", "what is the", "qualify"
]


def _keyword_route(query: str) -> str | None:
    q = query.lower()
    has_sql = any(kw in q for kw in SQL_KEYWORDS)
    has_doc = any(kw in q for kw in DOC_KEYWORDS)
    if has_sql and has_doc:
        return "both"
    if has_sql:
        return "sql"
    if has_doc:
        return "rag"
    return None


def route_query(user_query: str) -> dict:
    fast_route = _keyword_route(user_query)

    model = get_model()
    prompt = f"""You are an intelligent router for a company assistant.
Classify the user's question into one of the following routes:
1. "sql": Questions about customer orders, sales data, revenue, product orders, status, or date of specific orders.
2. "rag": Questions about company policies, leave policies, refunds/returns rules, warranty conditions, payment methods, delivery times, or general FAQs.
3. "both": Questions that require querying specific order data AND checking company policies.
4. "none": Out-of-scope, generic, or off-topic questions not related to the company's policies or orders database.

Return a JSON object with this exact structure:
{{
    "route": "sql" | "rag" | "both" | "none",
    "reason": "A brief explanation of why this route was selected."
}}

User Question: {user_query}
"""
    try:
        response = generate_content_with_retry(
            model,
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        result = json.loads(response.text)
        return result
    except Exception as e:
        print(f"Routing error: {e}", file=sys.stderr)
        if fast_route:
            return {
                "route": fast_route,
                "reason": "Classified by keyword matching (LLM unavailable)."
            }
        return {"route": "none", "reason": "Failed to classify route"}
