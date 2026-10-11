-- Day 6 Assignment: School Database
-- Database: SQLite

PRAGMA foreign_keys = ON;

-- 1. CREATE THE STUDENTS TABLE
CREATE TABLE students (
student_id INTEGER PRIMARY KEY,
name TEXT NOT NULL,
email TEXT NOT NULL UNIQUE
);

-- 2. CREATE THE COURSES TABLE
CREATE TABLE courses (
course_id INTEGER PRIMARY KEY,
course_name TEXT NOT NULL UNIQUE,
description TEXT
);

-- 3. CREATE THE ENROLMENTS TABLE
CREATE TABLE enrolments (
enrolment_id INTEGER PRIMARY KEY,
student_id INTEGER NOT NULL,
course_id INTEGER NOT NULL,
grade REAL,

```
FOREIGN KEY (student_id)
    REFERENCES students(student_id),

FOREIGN KEY (course_id)
    REFERENCES courses(course_id),

UNIQUE (student_id, course_id),

CHECK (grade IS NULL OR (grade >= 0 AND grade <= 100))
```

);

-- 4. INSERT SAMPLE STUDENTS
INSERT INTO students (student_id, name, email) VALUES
(1, 'Daisy Chepchirchir', '[daisy@example.com](mailto:daisy@example.com)'),
(2, 'Brian Mwangi', '[brian@example.com](mailto:brian@example.com)'),
(3, 'Grace Wanjiku', '[grace@example.com](mailto:grace@example.com)'),
(4, 'Kevin Kiptoo', '[kevin@example.com](mailto:kevin@example.com)');

-- 5. INSERT SAMPLE COURSES
INSERT INTO courses (course_id, course_name, description) VALUES
(1, 'Database Systems', 'Introduction to relational databases'),
(2, 'GIS Fundamentals', 'Introduction to Geographic Information Systems'),
(3, 'Web Development', 'Fundamentals of web development');

-- 6. INSERT SAMPLE ENROLMENTS
INSERT INTO enrolments (enrolment_id, student_id, course_id, grade) VALUES
(1, 1, 1, 85),
(2, 1, 2, 90),
(3, 2, 1, 76),
(4, 2, 3, 82),
(5, 3, 2, 88);

-- 7. CREATE AN INDEX
-- Helps find enrolments belonging to a particular course.
CREATE INDEX idx_enrolments_course_id
ON enrolments(course_id);

-- 8. QUERY 1:
-- Find all courses taken by one student, using their name.
SELECT
s.name AS student_name,
c.course_name
FROM students AS s
JOIN enrolments AS e
ON s.student_id = e.student_id
JOIN courses AS c
ON e.course_id = c.course_id
WHERE s.name = 'Daisy Chepchirchir';

-- 9. QUERY 2:
-- Find all students enrolled in one course.
SELECT
s.name AS student_name,
c.course_name
FROM students AS s
JOIN enrolments AS e
ON s.student_id = e.student_id
JOIN courses AS c
ON e.course_id = c.course_id
WHERE c.course_name = 'Database Systems';

-- 10. QUERY 3:
-- Count the students enrolled in each course.
-- LEFT JOIN also includes courses with zero enrolments.
SELECT
c.course_name,
COUNT(e.student_id) AS number_of_students
FROM courses AS c
LEFT JOIN enrolments AS e
ON c.course_id = e.course_id
GROUP BY c.course_id, c.course_name
ORDER BY c.course_name;

-- 11. QUERY 4:
-- Find students who have no enrolments.
SELECT
s.student_id,
s.name
FROM students AS s
LEFT JOIN enrolments AS e
ON s.student_id = e.student_id
WHERE e.enrolment_id IS NULL;

-- 12. QUERY 5:
-- Update the grade of one enrolment.
UPDATE enrolments
SET grade = 92
WHERE enrolment_id = 1;

-- 13. VERIFY THE UPDATED GRADE
SELECT
e.enrolment_id,
s.name AS student_name,
c.course_name,
e.grade
FROM enrolments AS e
JOIN students AS s
ON e.student_id = s.student_id
JOIN courses AS c
ON e.course_id = c.course_id
WHERE e.enrolment_id = 1;
