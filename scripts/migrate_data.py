#!/usr/bin/env python3
"""
Database migration script for Aspen-Lite.

Handles:
- Database initialization (create tables, indexes)
- JSON import to SQLite
- Data verification
- Performance testing

Usage:
    # Initialize database
    python3 migrate_data.py --init

    # Import data from JSON
    python3 migrate_data.py --import data/generated_students.json

    # Verify data integrity
    python3 migrate_data.py --verify

    # All in one
    python3 migrate_data.py --init --import data/generated_students.json --verify
"""

import sqlite3
import json
import argparse
import time
from pathlib import Path

DB_PATH = 'data/aspen.db'

SCHEMA_SQL = """
-- Schools table
CREATE TABLE IF NOT EXISTS schools (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Students table
CREATE TABLE IF NOT EXISTS students (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  grade INTEGER NOT NULL,
  gender TEXT NOT NULL,
  ethnicity TEXT NOT NULL,
  school_id INTEGER NOT NULL,
  address TEXT,
  zip_code TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_students_school_id ON students(school_id);
CREATE INDEX IF NOT EXISTS idx_students_student_id ON students(student_id);
CREATE INDEX IF NOT EXISTS idx_students_name ON students(last_name, first_name);
CREATE INDEX IF NOT EXISTS idx_students_grade ON students(grade);
CREATE INDEX IF NOT EXISTS idx_students_gender ON students(gender);
CREATE INDEX IF NOT EXISTS idx_students_ethnicity ON students(ethnicity);

-- View for student counts by school
CREATE VIEW IF NOT EXISTS school_student_counts AS
SELECT school_id, COUNT(*) as student_count
FROM students
GROUP BY school_id;
"""

def init_database():
    """Initialize the database with schema."""
    print(f"Initializing database at {DB_PATH}...")

    # Ensure data directory exists
    Path(DB_PATH).parent.mkdir(parents=True, exist_ok=True)

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Execute schema
    cursor.executescript(SCHEMA_SQL)
    conn.commit()

    print("✓ Database initialized")
    print("✓ Tables created: schools, students")
    print("✓ Indexes created for performance")
    print("✓ Views created: school_student_counts")

    conn.close()

def import_json_data(json_file):
    """Import student data from JSON file."""
    print(f"\nImporting data from {json_file}...")

    # Load JSON
    with open(json_file, 'r') as f:
        students_data = json.load(f)

    print(f"Loaded {len(students_data):,} students from JSON")

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Extract unique schools
    schools = {}
    for student in students_data:
        school_name = student['school']
        if school_name not in schools:
            schools[school_name] = None

    print(f"Found {len(schools)} unique schools")

    # Insert schools
    print("Inserting schools...")
    for school_name in schools.keys():
        cursor.execute(
            "INSERT OR IGNORE INTO schools (name) VALUES (?)",
            (school_name,)
        )
    conn.commit()

    # Get school IDs
    cursor.execute("SELECT id, name FROM schools")
    school_id_map = {name: id for id, name in cursor.fetchall()}
    print(f"✓ Inserted {len(school_id_map)} schools")

    # Insert students in batches
    print("Inserting students...")
    batch_size = 1000
    total = len(students_data)

    start_time = time.time()

    for i in range(0, total, batch_size):
        batch = students_data[i:i + batch_size]

        cursor.executemany(
            """
            INSERT INTO students
            (student_id, first_name, last_name, grade, gender, ethnicity, school_id, address, zip_code)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            [
                (
                    s['studentId'],
                    s['firstName'],
                    s['lastName'],
                    s['grade'],
                    s['gender'],
                    s['ethnicity'],
                    school_id_map[s['school']],
                    s['address'],
                    s['zipCode']
                )
                for s in batch
            ]
        )
        conn.commit()

        progress = min(i + batch_size, total)
        pct = (progress / total) * 100
        print(f"  Progress: {progress:,}/{total:,} ({pct:.1f}%)")

    end_time = time.time()
    elapsed = end_time - start_time

    print(f"\n✓ Imported {total:,} students in {elapsed:.2f} seconds")
    print(f"✓ Rate: {total / elapsed:.0f} students/second")

    conn.close()

def verify_database():
    """Verify database integrity and performance."""
    print("\nVerifying database...")

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Count records
    cursor.execute("SELECT COUNT(*) FROM schools")
    school_count = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM students")
    student_count = cursor.fetchone()[0]

    print(f"\n✓ Database contains:")
    print(f"  - {school_count:,} schools")
    print(f"  - {student_count:,} students")

    # Check student distribution
    cursor.execute("""
        SELECT s.name, COUNT(st.id) as count
        FROM schools s
        LEFT JOIN students st ON s.id = st.school_id
        GROUP BY s.id
        ORDER BY count DESC
        LIMIT 5
    """)

    print(f"\nTop 5 schools by student count:")
    for school, count in cursor.fetchall():
        print(f"  {school}: {count} students")

    # Test query performance
    print(f"\nTesting query performance...")

    tests = [
        ("SELECT * FROM schools", "List all schools"),
        ("SELECT * FROM students WHERE school_id = 1 LIMIT 50", "Get 50 students from one school"),
        ("SELECT * FROM students WHERE grade = 9 AND school_id = 1", "Filter by grade"),
        ("SELECT * FROM students WHERE last_name LIKE 'S%' LIMIT 50", "Search by last name"),
    ]

    for query, description in tests:
        start = time.time()
        cursor.execute(query)
        results = cursor.fetchall()
        elapsed = (time.time() - start) * 1000  # Convert to ms

        print(f"  {description}: {elapsed:.2f}ms ({len(results)} results)")

    # Check indexes
    cursor.execute("SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%'")
    indexes = cursor.fetchall()

    print(f"\n✓ Indexes created: {len(indexes)}")
    for (index_name,) in indexes:
        print(f"  - {index_name}")

    # Database file size
    db_size = Path(DB_PATH).stat().st_size / (1024 * 1024)
    print(f"\n✓ Database file size: {db_size:.2f} MB")

    conn.close()

    print("\n✓ Verification complete!")

def main():
    parser = argparse.ArgumentParser(
        description="Database migration tool for Aspen-Lite",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Initialize database
  python3 migrate_data.py --init

  # Import existing data
  python3 migrate_data.py --import data/students.json

  # Initialize and import in one command
  python3 migrate_data.py --init --import data/generated_students.json

  # Verify after import
  python3 migrate_data.py --verify

  # Full workflow
  python3 migrate_data.py --init --import data/generated_students.json --verify
        """
    )

    parser.add_argument(
        '--init',
        action='store_true',
        help='Initialize database (create tables and indexes)'
    )

    parser.add_argument(
        '--import',
        dest='import_file',
        type=str,
        help='Import data from JSON file'
    )

    parser.add_argument(
        '--verify',
        action='store_true',
        help='Verify database integrity and test performance'
    )

    args = parser.parse_args()

    # Need at least one action
    if not (args.init or args.import_file or args.verify):
        parser.error("At least one action required: --init, --import, or --verify")

    # Execute actions in order
    if args.init:
        init_database()

    if args.import_file:
        if not Path(args.import_file).exists():
            print(f"Error: File not found: {args.import_file}")
            return 1

        import_json_data(args.import_file)

    if args.verify:
        if not Path(DB_PATH).exists():
            print(f"Error: Database not found at {DB_PATH}")
            print("Run with --init first")
            return 1

        verify_database()

    print("\n✨ Migration complete!")
    return 0

if __name__ == '__main__':
    exit(main())
