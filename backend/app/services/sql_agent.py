import os
import sqlite3
from app.services.llm_client import get_model, generate_content_with_retry

current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(os.path.dirname(current_dir))
db_path = os.path.join(project_root, "app", "data", "orders.db")

def generate_sql_query(user_query: str) -> str:
    model = get_model()
    prompt = f"""You are a SQLite database assistant.
The current date is 15 June 2026. Any calculations for relative times must be computed relative to this date: 2026-06-15.

The database has a table named 'orders' with the following schema:
- order_id: TEXT (Primary Key, e.g., 'ORD-1001')
- customer: TEXT (Customer's name)
- product: TEXT (Product purchased)
- amount: INTEGER (Order amount in Rupees)
- status: TEXT (One of: 'pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned')
- order_date: TEXT (Date format YYYY-MM-DD)

Write a single valid SQLite query to answer the user's question.
Output only the raw SQLite query. Do not wrap it in markdown block, do not write explanations.

User Question: {user_query}
"""
    response = generate_content_with_retry(model, prompt)
    return response.text

def execute_sql(query_text: str):
    query_text = query_text.strip()
    if not query_text:
        return {"error": "Empty SQL query"}
    
    if query_text.startswith("```"):
        lines = query_text.split("\n")
        if "```" in lines[0]:
            lines = lines[1:]
        if lines and "```" in lines[-1]:
            lines = lines[:-1]
        query_text = "\n".join(lines).strip()
        
    if not query_text.lower().startswith("select"):
        return {"error": "Only SELECT queries are permitted"}
        
    try:
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute(query_text)
        rows = cursor.fetchall()
        results = [dict(r) for r in rows]
        conn.close()
        return {"results": results, "query": query_text}
    except Exception as e:
        return {"error": str(e), "query": query_text}
