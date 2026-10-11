# School Database Design

## 1. Tables

**Students:** Stores student information, including student ID, name, and email. The student ID is the primary key, and the email is unique to prevent duplicate email addresses.

**Courses:** Stores course information, including course ID, course name, and description. The course ID is the primary key, and the course name is unique.

**Enrolments:** Stores the relationship between students and courses, including the grade earned. It uses foreign keys to reference students and courses. A unique constraint on student ID and course ID prevents duplicate enrolments.

## 2. Relationships

Students and enrolments have a one-to-many relationship because one student can enrol in several courses. Courses and enrolments also have a one-to-many relationship because one course can have several students.

Students and courses have a many-to-many relationship because a student can take multiple courses, and each course can have multiple students. The enrolments table acts as a join table, connecting students and courses through foreign keys. It also stores the grade for each enrolment.

## 3. Index

I would create an index on `enrolments(course_id)` to help the database find students enrolled in a particular course more efficiently. This is useful when retrieving course enrolments and calculating the number of students per course. The index requires additional storage but can improve query performance.

## 4. SQL or NoSQL?

I would choose SQL for this school system because the data is structured and has clear relationships between students, courses, and enrolments. SQL supports primary keys, foreign keys, unique constraints, and joins, which help maintain data accuracy and prevent duplicate enrolments. It also makes it easy to retrieve student grades and calculate enrolment counts. NoSQL is useful for some flexible or unstructured data, but a relational SQL database is more suitable for this system.
