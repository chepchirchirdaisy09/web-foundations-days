
# Library Books REST API

## 1. List All Books

- **Method:** GET
- **Path:** `/books`
- **Description:** Retrieves a list of all books in the library.
- **Success status:** 200 OK
- **Request body:** None.

## 2. Get One Book

- **Method:** GET
- **Path:** `/books/{id}`
- **Description:** Retrieves a single book using its unique ID.
- **Success status:** 200 OK
- **Request body:** None.

## 3. Create a Book

- **Method:** POST
- **Path:** `/books`
- **Description:** Adds a new book to the library.
- **Example request body:**

  ```json
  {
    "title": "Introduction to GIS",
    "author": "Jane Wanjiku",
    "year": 2025
  }
  ```

- **Success status:** 201 Created

## 4. Update a Book

- **Method:** PUT
- **Path:** `/books/{id}`
- **Description:** Replaces the details of an existing book.
- **Example request body:**

  ```json
  {
    "title": "Advanced GIS",
    "author": "Jane Wanjiku",
    "year": 2026
  }
  ```

- **Success status:** 200 OK

## 5. Delete a Book

- **Method:** DELETE
- **Path:** `/books/{id}`
- **Description:** Deletes a book using its unique ID.
- **Success status:** 204 No Content
- **Request body:** None.

## 6. List Books by Author

- **Method:** GET
- **Path:** `/books?author=Jane%20Wanjiku`
- **Description:** Retrieves books written by the specified author using a query parameter.
- **Success status:** 200 OK
- **Request body:** None.

## Error Status Codes

### 400 Bad Request

- **Description:** The server cannot process the request because the supplied data is invalid.
- **Example:** Creating a book without a required title or providing an invalid year.

### 404 Not Found

- **Description:** The requested resource does not exist.
- **Example:** Requesting `GET /books/9999` when book ID 9999 is not in the library.