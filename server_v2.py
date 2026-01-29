#!/usr/bin/env python3
"""
Aspen-Lite API Server v2
Flask + SQLite backend with REST API

Usage:
    python3 server_v2.py

Server will start on http://localhost:8001
"""

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import sqlite3
import os
from functools import wraps
from pathlib import Path

app = Flask(__name__, static_folder='.')
CORS(app)  # Enable CORS for development

DB_PATH = 'data/aspen.db'
PORT = 8001

def get_db():
    """Get database connection."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # Return rows as dictionaries
    return conn

def cache_control(max_age=300):
    """Decorator to add cache control headers."""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            response = f(*args, **kwargs)
            if isinstance(response, tuple):
                response_obj, status = response
            else:
                response_obj = response
                status = 200

            if isinstance(response_obj, dict):
                response_obj = jsonify(response_obj)

            response_obj.headers['Cache-Control'] = f'public, max-age={max_age}'
            return response_obj, status

        return decorated_function
    return decorator

# ============================================================================
# API ENDPOINTS
# ============================================================================

@app.route('/api/schools')
@cache_control(300)  # Cache for 5 minutes
def get_schools():
    """
    Get list of schools with pagination and search.

    Query params:
        - search: string (optional) - Filter schools by name
        - limit: int (default: 100) - Number of results per page
        - offset: int (default: 0) - Pagination offset

    Returns:
        {
            schools: [{id, name, studentCount}],
            total: int,
            hasMore: bool
        }
    """
    search = request.args.get('search', '').strip()
    limit = min(int(request.args.get('limit', 100)), 200)  # Max 200
    offset = int(request.args.get('offset', 0))

    conn = get_db()
    cursor = conn.cursor()

    # Build query
    query = '''
        SELECT s.id, s.name, COALESCE(c.student_count, 0) as studentCount
        FROM schools s
        LEFT JOIN school_student_counts c ON s.id = c.school_id
    '''

    params = []

    if search:
        query += ' WHERE s.name LIKE ?'
        params.append(f'%{search}%')

    # Get total count
    count_query = 'SELECT COUNT(*) FROM schools'
    if search:
        count_query += ' WHERE name LIKE ?'
        cursor.execute(count_query, [f'%{search}%'] if search else [])
    else:
        cursor.execute(count_query)

    total = cursor.fetchone()[0]

    # Add pagination
    query += ' ORDER BY s.name LIMIT ? OFFSET ?'
    params.extend([limit + 1, offset])  # Fetch one extra to check hasMore

    cursor.execute(query, params)
    rows = cursor.fetchall()

    has_more = len(rows) > limit
    schools = [dict(row) for row in rows[:limit]]

    conn.close()

    return {
        'schools': schools,
        'total': total,
        'hasMore': has_more
    }

@app.route('/api/schools/favorites', methods=['POST'])
@cache_control(300)
def get_favorite_schools():
    """
    Get details for favorite schools.

    Body:
        { schoolIds: [int] }

    Returns:
        { schools: [{id, name, studentCount}] }
    """
    data = request.get_json()
    school_ids = data.get('schoolIds', [])

    if not school_ids:
        return {'schools': []}

    conn = get_db()
    cursor = conn.cursor()

    placeholders = ','.join('?' * len(school_ids))
    query = f'''
        SELECT s.id, s.name, COALESCE(c.student_count, 0) as studentCount
        FROM schools s
        LEFT JOIN school_student_counts c ON s.id = c.school_id
        WHERE s.id IN ({placeholders})
        ORDER BY s.name
    '''

    cursor.execute(query, school_ids)
    schools = [dict(row) for row in cursor.fetchall()]

    conn.close()

    return {'schools': schools}

@app.route('/api/schools/<int:school_id>/students')
@cache_control(120)  # Cache for 2 minutes
def get_school_students(school_id):
    """
    Get students for a specific school with filters and pagination.

    Query params:
        - limit: int (default: 50) - Number of results
        - offset: int (default: 0) - Pagination offset
        - grade: int (optional) - Filter by grade
        - gender: string (optional) - Filter by gender
        - ethnicity: string (optional) - Filter by ethnicity
        - search: string (optional) - Search by name or student ID

    Returns:
        {
            students: [{studentId, firstName, lastName, grade, gender, ethnicity, address, zipCode}],
            total: int,
            hasMore: bool,
            school: {id, name}
        }
    """
    limit = min(int(request.args.get('limit', 50)), 200)
    offset = int(request.args.get('offset', 0))

    grade = request.args.get('grade')
    gender = request.args.get('gender')
    ethnicity = request.args.get('ethnicity')
    search = request.args.get('search', '').strip()

    conn = get_db()
    cursor = conn.cursor()

    # Build WHERE clause for both queries
    where_conditions = ['school_id = ?']
    params = [school_id]

    if grade:
        where_conditions.append('grade = ?')
        params.append(int(grade))

    if gender:
        where_conditions.append('gender = ?')
        params.append(gender)

    if ethnicity:
        where_conditions.append('ethnicity = ?')
        params.append(ethnicity)

    if search:
        where_conditions.append('(first_name LIKE ? OR last_name LIKE ? OR student_id LIKE ?)')
        search_pattern = f'%{search}%'
        params.extend([search_pattern, search_pattern, search_pattern])

    where_clause = 'WHERE ' + ' AND '.join(where_conditions)

    # Get total count with the same filters
    count_query = f'SELECT COUNT(*) FROM students {where_clause}'
    cursor.execute(count_query, params)
    count_result = cursor.fetchone()
    total = count_result[0] if count_result else 0

    # Build main query
    query = f'''
        SELECT student_id as studentId, first_name as firstName, last_name as lastName,
               grade, gender, ethnicity, address, zip_code as zipCode
        FROM students
        {where_clause}
        ORDER BY last_name, first_name
        LIMIT ? OFFSET ?
    '''
    params.extend([limit + 1, offset])

    cursor.execute(query, params)
    rows = cursor.fetchall()

    has_more = len(rows) > limit
    students = [dict(row) for row in rows[:limit]]

    # Get school info
    cursor.execute('SELECT id, name FROM schools WHERE id = ?', [school_id])
    school_row = cursor.fetchone()

    conn.close()

    if not school_row:
        return {'error': 'School not found'}, 404

    school = dict(school_row)

    return {
        'students': students,
        'total': total,
        'hasMore': has_more,
        'school': school
    }

@app.route('/api/students/<student_id>')
@cache_control(300)  # Cache for 5 minutes
def get_student(student_id):
    """
    Get individual student details.

    Returns:
        { student: {...} }
    """
    conn = get_db()
    cursor = conn.cursor()

    query = '''
        SELECT s.student_id as studentId, s.first_name as firstName, s.last_name as lastName,
               s.grade, s.gender, s.ethnicity, s.address, s.zip_code as zipCode,
               sc.name as school
        FROM students s
        JOIN schools sc ON s.school_id = sc.id
        WHERE s.student_id = ?
    '''

    cursor.execute(query, [student_id])
    row = cursor.fetchone()

    conn.close()

    if not row:
        return {'error': 'Student not found'}, 404

    student = dict(row)
    return {'student': student}

@app.route('/api/schools/<int:school_id>/filters')
@cache_control(600)  # Cache for 10 minutes
def get_school_filters(school_id):
    """
    Get available filter options for a school.

    Returns:
        {
            grades: [int],
            genders: [string],
            ethnicities: [string]
        }
    """
    conn = get_db()
    cursor = conn.cursor()

    # Get unique grades
    cursor.execute(
        'SELECT DISTINCT grade FROM students WHERE school_id = ? ORDER BY grade',
        [school_id]
    )
    grades = [row[0] for row in cursor.fetchall()]

    # Get unique genders
    cursor.execute(
        'SELECT DISTINCT gender FROM students WHERE school_id = ? ORDER BY gender',
        [school_id]
    )
    genders = [row[0] for row in cursor.fetchall()]

    # Get unique ethnicities
    cursor.execute(
        'SELECT DISTINCT ethnicity FROM students WHERE school_id = ? ORDER BY ethnicity',
        [school_id]
    )
    ethnicities = [row[0] for row in cursor.fetchall()]

    conn.close()

    return {
        'grades': grades,
        'genders': genders,
        'ethnicities': ethnicities
    }

@app.route('/api/search/students')
@cache_control(120)  # Cache for 2 minutes
def search_students():
    """
    Search students across all schools.

    Query params:
        - q: string (required) - Search query
        - schoolId: int (optional) - Filter to specific school
        - limit: int (default: 50) - Number of results
        - offset: int (default: 0) - Pagination offset

    Returns:
        {
            students: [{studentId, firstName, lastName, grade, school, ...}],
            total: int,
            hasMore: bool
        }
    """
    query_text = request.args.get('q', '').strip()
    school_id = request.args.get('schoolId')
    limit = min(int(request.args.get('limit', 50)), 200)
    offset = int(request.args.get('offset', 0))

    if not query_text:
        return {'error': 'Search query required'}, 400

    conn = get_db()
    cursor = conn.cursor()

    # Build query
    query = '''
        SELECT s.student_id as studentId, s.first_name as firstName, s.last_name as lastName,
               s.grade, s.gender, s.ethnicity, s.address, s.zip_code as zipCode,
               sc.name as school, sc.id as schoolId
        FROM students s
        JOIN schools sc ON s.school_id = sc.id
        WHERE (s.first_name LIKE ? OR s.last_name LIKE ? OR s.student_id LIKE ?)
    '''
    params = [f'%{query_text}%', f'%{query_text}%', f'%{query_text}%']

    if school_id:
        query += ' AND s.school_id = ?'
        params.append(int(school_id))

    # Get total count
    count_query = query.replace(
        'SELECT s.student_id as studentId, s.first_name as firstName, s.last_name as lastName, s.grade, s.gender, s.ethnicity, s.address, s.zip_code as zipCode, sc.name as school, sc.id as schoolId',
        'SELECT COUNT(*)'
    )
    cursor.execute(count_query, params)
    total = cursor.fetchone()[0]

    # Add pagination
    query += ' ORDER BY s.last_name, s.first_name LIMIT ? OFFSET ?'
    params.extend([limit + 1, offset])

    cursor.execute(query, params)
    rows = cursor.fetchall()

    has_more = len(rows) > limit
    students = [dict(row) for row in rows[:limit]]

    conn.close()

    return {
        'students': students,
        'total': total,
        'hasMore': has_more
    }

@app.route('/api/health')
def health_check():
    """Health check endpoint."""
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute('SELECT COUNT(*) FROM students')
    student_count = cursor.fetchone()[0]

    cursor.execute('SELECT COUNT(*) FROM schools')
    school_count = cursor.fetchone()[0]

    conn.close()

    return {
        'status': 'ok',
        'studentsCount': student_count,
        'schoolsCount': school_count
    }

# ============================================================================
# STATIC FILE SERVING (for testing)
# ============================================================================

@app.route('/')
def serve_index():
    """Serve index.html."""
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    """Serve static files."""
    return send_from_directory('.', path)

# ============================================================================
# SERVER STARTUP
# ============================================================================

if __name__ == '__main__':
    # Check if database exists
    if not Path(DB_PATH).exists():
        print(f"❌ Database not found at {DB_PATH}")
        print("Please run: python3 scripts/migrate_data.py --init --import data/generated_students.json")
        exit(1)

    print(f"")
    print(f"🚀 Aspen-Lite API Server v2")
    print(f"📊 Database: {DB_PATH}")
    print(f"🌐 Server: http://localhost:{PORT}")
    print(f"📍 API: http://localhost:{PORT}/api/")
    print(f"")
    print(f"Available endpoints:")
    print(f"  GET  /api/schools")
    print(f"  POST /api/schools/favorites")
    print(f"  GET  /api/schools/:id/students")
    print(f"  GET  /api/students/:id")
    print(f"  GET  /api/schools/:id/filters")
    print(f"  GET  /api/search/students")
    print(f"  GET  /api/health")
    print(f"")
    print(f"Press Ctrl+C to stop")
    print(f"")

    app.run(host='0.0.0.0', port=PORT, debug=True)
