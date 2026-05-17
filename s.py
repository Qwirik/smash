import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from google import genai


app = FastAPI()

client = genai.Client()

class QueryRequest(BaseModel):
    prompt: str

@app.post("/generate")
async def generate_intellect(request: QueryRequest):
    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash", 
            contents=request.prompt
        )
        return {"status": "success", "text": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
