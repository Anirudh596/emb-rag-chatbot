import os
import pypdf
import chromadb
from chromadb.utils import embedding_functions

current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(os.path.dirname(current_dir))
docs_dir = os.path.join(project_root, "app", "data", "docs")
db_dir = os.path.join(project_root, "app", "data", "chroma")

client = chromadb.PersistentClient(path=db_dir)
collection = client.get_or_create_collection(
    name="documents",
    embedding_function=embedding_functions.ONNXMiniLM_L6_V2()
)

def init_vector_store():
    if collection.count() > 0:
        return

    if not os.path.exists(docs_dir):
        return

    files = [f for f in os.listdir(docs_dir) if f.endswith(".pdf")]
    for filename in files:
        file_path = os.path.join(docs_dir, filename)
        reader = pypdf.PdfReader(file_path)
        
        full_text = ""
        for page in reader.pages:
            text = page.extract_text()
            if text:
                full_text += text + "\n"
        
        paragraphs = [p.strip() for p in full_text.split("\n\n") if p.strip()]
        
        chunks = []
        metadatas = []
        ids = []
        
        for idx, para in enumerate(paragraphs):
            chunks.append(para)
            metadatas.append({"source": filename})
            ids.append(f"{filename}_{idx}")
            
        if chunks:
            collection.add(
                documents=chunks,
                metadatas=metadatas,
                ids=ids
            )

def query_vector_store(query_text: str, n_results: int = 3):
    results = collection.query(
        query_texts=[query_text],
        n_results=n_results
    )
    
    formatted_results = []
    if results and "documents" in results and results["documents"]:
        documents = results["documents"][0]
        metadatas = results["metadatas"][0] if "metadatas" in results else []
        distances = results["distances"][0] if "distances" in results else []
        
        for idx, doc in enumerate(documents):
            meta = metadatas[idx] if idx < len(metadatas) else {}
            dist = distances[idx] if idx < len(distances) else 0.0
            formatted_results.append({
                "text": doc,
                "source": meta.get("source", "unknown"),
                "distance": dist
            })
            
    return formatted_results
