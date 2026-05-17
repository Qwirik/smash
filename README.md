# Smart Home

Smart Home dashboard with backend API.

## Запуск проекта

### Backend

Бэкенд работает на порту 3000 и также содержит WebSocket сервер на порту 8080.

```bash
cd backend
npm install
node index.js
```

### Frontend

Фронтенд построен с использованием React и Vite.

```bash
cd frontend
npm install
npm run dev
```

## Документация API (Swagger / OpenAPI формат)

```yaml
openapi: 3.0.0
info:
  title: Smart Home API
  version: 1.0.0
servers:
  - url: http://127.0.0.1:3000/api
paths:
  /auth/login:
    post:
      summary: Авторизация пользователя
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                login:
                  type: string
                  example: "admin"
                password:
                  type: string
                  example: "password"
      responses:
        '200':
          description: Успешный вход
          content:
            application/json:
              schema:
                type: object
                properties:
                  token:
                    type: string
        '401':
          description: Неверный логин или пароль

  /auth/update-credentials:
    post:
      summary: Обновление логина и пароля
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                newLogin:
                  type: string
                newPassword:
                  type: string
      responses:
        '200':
          description: Данные успешно обновлены
        '400':
          description: Пустые поля логина или пароля
```
