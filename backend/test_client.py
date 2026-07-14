import json
import time
import urllib.request

def send_query(message: str):
    print(f"\nQuery: {message}")
    print("-" * 50)
    
    url = "http://127.0.0.1:8000/api/chat"
    payload = json.dumps({"message": message}).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=payload,
        headers={"Content-Type": "application/json"}
    )
    
    try:
        with urllib.request.urlopen(req) as response:
            for line in response:
                if not line:
                    continue
                decoded_line = line.decode("utf-8").strip()
                if decoded_line.startswith("data: "):
                    try:
                        event_data = json.loads(decoded_line[6:])
                        event_type = event_data.get("event")
                        data = event_data.get("data")
                        
                        if event_type == "route":
                            print(f"[Route]: {data.get('route')} ({data.get('reason')})")
                        elif event_type == "sql":
                            print(f"[SQL Query]: {data}")
                        elif event_type == "sql_result":
                            print(f"[SQL Results]: {len(data) if isinstance(data, list) else data}")
                        elif event_type == "citations":
                            print(f"[Citations]: {data}")
                        elif event_type == "content":
                            print(data, end="", flush=True)
                        elif event_type == "sql_error":
                            print(f"[SQL Error]: {data}")
                        elif event_type == "error":
                            print(f"[LLM Error]: {data}")
                        elif event_type == "done":
                            print("\n[Done]")
                    except Exception as e:
                        print(f"\n[Parsing Error]: {e} on line {decoded_line}")
    except Exception as e:
        print(f"\n[Connection Error]: {e}")

def main():
    queries = [
        "What is the refund window?",
        "What is the total amount of orders that are pending?",
        "Our policy allows 30-day returns. Did order ORD-1207 qualify for return?",
        "What is the capital of France?"
    ]
    for idx, query in enumerate(queries):
        if idx > 0:
            time.sleep(2)
        send_query(query)

if __name__ == "__main__":
    main()
