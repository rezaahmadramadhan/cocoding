# Cocoding API Documentation

## Models :

_User_
- fullName: string (required)
- email: string, unique (required)
- password: string (required)
- role: string, default 'customer'

_Category_
- catName: string (required)
- progLang: string (required)

_Course_
- title: string (required)
- price: integer (required)
- rating: float
- totalEnrollment: integer
- startDate: date
- desc: string (required)
- courseImg: string
- durationHours: integer
- code: string
- CategoryId: integer (required, references Category model)

_Order_
- userId: integer (required, references User model)
- totalPrice: integer (required)
- status: string, default 'pending'

_OrderDetail_
- orderId: integer (required, references Order model)
- courseId: integer (required, references Course model)
- price: integer (required)

## Endpoints:

List of available endpoints:
- `GET /`
- `POST /register`
- `POST /login`
- `DELETE /delete-account`
- `GET /courses`
- `GET /courses/:id`

And routes below need authentication:
- `POST /orders/checkout`
- `POST /gemini/generate-quiz`

&nbsp;

## 1. GET /

Description:
  Home endpoint to check if server is running.

_Response (200 - OK)_
```json
{
  "message": "Welcome to the home page!"
}
```

&nbsp;

## 2. POST /register

Description:
  Register a new user account.

Request:

- body:
```json
{
  "fullName": "string",
  "email": "string",
  "password": "string"
}
```

_Response (201 - Created)_
```json
{
  "id": "integer",
  "fullName": "string",
  "email": "string",
  "role": "string",
  "createdAt": "date",
  "updatedAt": "date"
}
```

_Response (400 - Bad Request)_
```json
{
  "message": "Email is required"
}
OR
{
  "message": "Invalid email format"
}
OR
{
  "message": "Password is required"
}
OR
{
  "message": "Full name is required"
}
OR
{
  "message": "Email has already been registered"
}
```

&nbsp;

## 3. POST /login

Description:
  Login to existing account and receive access token.

Request:

- body:
```json
{
  "email": "string",
  "password": "string"
}
```

_Response (200 - OK)_
```json
{
  "access_token": "string",
  "id": "integer",
  "email": "string",
  "role": "string"
}
```

_Response (400 - Bad Request)_
```json
{
  "message": "Email is required"
}
OR
{
  "message": "Password is required"
}
```

_Response (401 - Unauthorized)_
```json
{
  "message": "Invalid email/password"
}
```

&nbsp;

## 4. DELETE /delete-account

Description:
  Delete current logged in user account. Requires authentication.

Request:

- headers:
```json
{
  "Authorization": "Bearer <access_token>"
}
```

_Response (200 - OK)_
```json
{
  "message": "Your account has been deleted successfully"
}
```

_Response (401 - Unauthorized)_
```json
{
  "message": "Invalid token"
}
```

&nbsp;

## 5. GET /courses

Description:
  Get all available courses with optional filtering, sorting, and pagination.

Request:

- query parameters (all optional):
```
search: string (filter by course title)
filter: integer (filter by category ID)
sort: string (sort by field name, prefix with - for descending)
page: integer (default: 1)
limit: integer (default: 10)
```

_Response (200 - OK)_
```json
{
  "data": [
    {
      "id": "integer",
      "title": "string",
      "price": "integer",
      "rating": "float",
      "totalEnrollment": "integer",
      "startDate": "date",
      "desc": "string",
      "courseImg": "string",
      "durationHours": "integer",
      "code": "string",
      "CategoryId": "integer",
      "createdAt": "date",
      "updatedAt": "date",
      "Category": {
        "id": "integer",
        "catName": "string",
        "progLang": "string"
      }
    },
    ...
  ],
  "page": "integer",
  "limit": "integer",
  "totalData": "integer",
  "maxPage": "integer"
}
```

&nbsp;

## 6. GET /courses/:id

Description:
  Get a specific course by ID with detailed information.

Request:

- params:
```json
{
  "id": "integer"
}
```

_Response (200 - OK)_
```json
{
  "id": "integer",
  "title": "string",
  "price": "integer",
  "rating": "float",
  "totalEnrollment": "integer",
  "startDate": "date",
  "desc": "string",
  "courseImg": "string",
  "durationHours": "integer",
  "code": "string",
  "CategoryId": "integer",
  "createdAt": "date",
  "updatedAt": "date",
  "Category": {
    "id": "integer",
    "catName": "string",
    "progLang": "string"
  }
}
```

_Response (404 - Not Found)_
```json
{
  "message": "Course not found"
}
```

&nbsp;

## 7. POST /orders/checkout

Description:
  Create a new order to purchase courses. Requires authentication.

Request:

- headers:
```json
{
  "Authorization": "Bearer <access_token>"
}
```

- body:
```json
{
  "courseId": "integer",
  "paymentMethod": "string",
  "cardNumber": "string",
  "expiryDate": "string"
}
```

_Response (201 - Created)_
```json
{
  "message": "Order created successfully",
  "order": {
    "id": "integer",
    "userId": "integer",
    "totalPrice": "integer",
    "status": "string",
    "createdAt": "date",
    "updatedAt": "date",
    "OrderDetails": [
      {
        "id": "integer",
        "orderId": "integer",
        "courseId": "integer",
        "price": "integer",
        "createdAt": "date",
        "updatedAt": "date"
      }
    ]
  }
}
```

_Response (400 - Bad Request)_
```json
{
  "message": "Course ID is required"
}
OR
{
  "message": "Payment method is required"
}
```

_Response (401 - Unauthorized)_
```json
{
  "message": "Invalid token"
}
```

_Response (404 - Not Found)_
```json
{
  "message": "Course not found"
}
```

&nbsp;

## 8. POST /gemini/generate-quiz

Description:
  Generate a quiz on a specific topic using Google's Gemini AI. Requires authentication.

Request:

- headers:
```json
{
  "Authorization": "Bearer <access_token>"
}
```

- body:
```json
{
  "topic": "string",
  "difficulty": "string",
  "numberOfQuestions": "integer" 
}
```

_Response (200 - OK)_
```json
{
  "success": true,
  "data": {
    "quiz": "string" 
  }
}
```

_Response (400 - Bad Request)_
```json
{
  "message": "Topic is required"
}
```

_Response (401 - Unauthorized)_
```json
{
  "message": "Invalid token"
}
```

&nbsp;

## Global Error

_Response (401 - Unauthorized)_
```json
{
  "message": "Invalid token"
}
```

_Response (500 - Internal Server Error)_
```json
{
  "message": "Internal Server Error"
}
```