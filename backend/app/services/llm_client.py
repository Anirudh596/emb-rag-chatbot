import os
from dotenv import load_dotenv
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

load_dotenv()

PROVIDER = os.getenv("LLM_PROVIDER", "gemini")

class GroqChunk:
    def __init__(self, text):
        self.text = text

class GroqResponse:
    def __init__(self, text):
        self.text = text

if PROVIDER == "groq":
    from groq import Groq
    import groq
    groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
    _rate_limit_errors = (
        groq.RateLimitError,
        groq.InternalServerError,
        groq.APIConnectionError,
    )
else:
    import google.generativeai as genai
    import google.api_core.exceptions
    genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
    _rate_limit_errors = (
        google.api_core.exceptions.ResourceExhausted,
        google.api_core.exceptions.ServiceUnavailable,
    )


def get_model(model_name=None):
    if PROVIDER == "groq":
        if not model_name:
            model_name = os.getenv("MODEL_NAME", "llama-3.3-70b-specdec")
        return model_name
    else:
        import google.generativeai as genai
        if not model_name:
            model_name = os.getenv("MODEL_NAME", "gemini-2.0-flash")
        return genai.GenerativeModel(model_name)


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=2, min=3, max=20),
    retry=retry_if_exception_type(_rate_limit_errors),
)
def generate_content_with_retry(model, prompt, **kwargs):
    if PROVIDER == "groq":
        extra_args = {}
        generation_config = kwargs.get("generation_config")
        if isinstance(generation_config, dict):
            if generation_config.get("response_mime_type") == "application/json":
                extra_args["response_format"] = {"type": "json_object"}
        
        stream = kwargs.get("stream", False)
        
        if stream:
            def stream_generator():
                completion = groq_client.chat.completions.create(
                    model=model,
                    messages=[{"role": "user", "content": prompt}],
                    stream=True,
                    **extra_args
                )
                for chunk in completion:
                    if chunk.choices and chunk.choices[0].delta.content is not None:
                        yield GroqChunk(chunk.choices[0].delta.content)
            return stream_generator()
        else:
            completion = groq_client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": prompt}],
                stream=False,
                **extra_args
            )
            text = completion.choices[0].message.content or ""
            return GroqResponse(text)
    else:
        return model.generate_content(prompt, **kwargs)


def get_embedding(text, model="models/gemini-embedding-2"):
    if PROVIDER == "groq":
        raise NotImplementedError("Embeddings are not supported when using Groq. Please use a local embedding function.")
    import google.generativeai as genai
    result = genai.embed_content(
        model=model,
        content=text,
        task_type="retrieval_document",
    )
    return result["embedding"]


def get_embeddings(texts, model="models/gemini-embedding-2"):
    if PROVIDER == "groq":
        raise NotImplementedError("Embeddings are not supported when using Groq. Please use a local embedding function.")
    import google.generativeai as genai
    result = genai.embed_content(
        model=model,
        content=texts,
        task_type="retrieval_document",
    )
    return result["embedding"]
