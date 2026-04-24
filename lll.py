from openai import OpenAI

client = OpenAI(
    api_key="AIzaSyAcuN7HbjV7aWWSv3LurA04Q_t7K4lYwRE",
    base_url="https://api.aitunnel.ru/v1/"
)

response = client.chat.completions.create(
    model="gemini-3-flash-preview",
    messages=[
        {"role": "user", "content": "Привет! Как дела?"}
    ]
)

print(response.choices[0].message.content)