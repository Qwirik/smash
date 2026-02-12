import os
from openai import OpenAI
from config import HF_TOKEN

client = OpenAI(
    base_url="https://router.huggingface.co/v1",
    api_key=HF_TOKEN
)

messages = []

print("Чат запущен. Введите 0 и нажмите Enter для выхода.\n")

while True:
    user_input = input("Вы: ")

    if user_input.strip() == "0":
        print("Диалог завершён.")
        break

    messages.append({
        "role": "user",
        "content": user_input
    })

    completion = client.chat.completions.create(
        model="openai/gpt-oss-120b:groq",
        messages=messages,
    )

    assistant_reply = completion.choices[0].message.content

    print("Бот:", assistant_reply)

    messages.append({
        "role": "assistant",
        "content": assistant_reply
    })
