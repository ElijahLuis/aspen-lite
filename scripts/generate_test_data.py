#!/usr/bin/env python3
"""
Generate realistic test data for Aspen-Lite at scale.

Usage:
    python3 generate_test_data.py --students 1000 --schools 50
    python3 generate_test_data.py --students 300000 --schools 1000
"""

import json
import random
import argparse
from pathlib import Path

# Chicago Public Schools (expanded realistic list)
CPS_SCHOOLS = [
    "Whitney M. Young Magnet High School",
    "Walter Payton College Prep",
    "Jones College Prep",
    "Northside College Prep",
    "Lane Tech College Prep",
    "Kenwood Academy High School",
    "Lincoln Park High School",
    "South Shore International College Prep",
    "Taft High School",
    "Von Steuben Metropolitan Science Center",
    "Curie Metropolitan High School",
    "Hancock College Prep",
    "Westinghouse College Prep",
    "Lindblom Math and Science Academy",
    "Morgan Park High School",
    "Roosevelt High School",
    "Schurz High School",
    "Steinmetz College Prep",
    "Chicago Vocational Career Academy",
    "Amundsen High School",
    "Clemente High School",
    "Farragut Career Academy",
    "Foreman High School",
    "Gage Park High School",
    "Harper High School",
    "Hubbard High School",
    "Kelly High School",
    "Kelvyn Park High School",
    "Lake View High School",
    "Mather High School",
    "Phoenix Military Academy",
    "Prosser Career Academy",
    "Senn High School",
    "Simeon Career Academy",
    "Sullivan High School",
    "Tilden Career Community Academy",
    "Wells Community Academy High School",
    "Young Women's Leadership Charter School",
    "Chicago Bulls College Prep",
    "Chicago High School for Agricultural Sciences",
    "Chicago High School for the Arts",
    "Chicago Military Academy-Bronzeville",
    "Englewood STEM High School",
    "Goode STEM Academy",
    "Marine Leadership Academy at Ames",
    "Ogden International School",
    "Rauner College Prep",
    "Back of the Yards College Prep",
    "Noble Street College Prep",
    "UIC College Prep"
]

# Names by ethnicity for demographic realism
FIRST_NAMES = {
    "Hispanic/Latino": [
        "Carlos", "Maria", "Diego", "Isabella", "Luis", "Sofia", "Miguel",
        "Valentina", "Jose", "Camila", "Juan", "Elena", "Roberto", "Ana",
        "Fernando", "Carmen", "Ricardo", "Gabriela", "Antonio", "Daniela"
    ],
    "Black/African American": [
        "Jamal", "Aaliyah", "DeAndre", "Brianna", "Marcus", "Jasmine",
        "Terrell", "Ashley", "Jordan", "Nia", "Malik", "Kiara", "Isaiah",
        "Zoe", "Xavier", "Amara", "Elijah", "Janae", "Andre", "Layla"
    ],
    "White": [
        "Michael", "Emily", "Ryan", "Sarah", "Tyler", "Emma", "Nathan",
        "Chloe", "Ethan", "Olivia", "Jacob", "Madison", "Andrew", "Hannah",
        "Daniel", "Grace", "Matthew", "Lily", "Christopher", "Abigail"
    ],
    "Asian": [
        "David", "Jasmine", "Kevin", "Mia", "Daniel", "Sophia", "Andrew",
        "Zara", "Jonathan", "Priya", "James", "Yuki", "William", "Mei",
        "Alexander", "Hana", "Benjamin", "Soo-Jin", "Henry", "Ananya"
    ]
}

LAST_NAMES = {
    "Hispanic/Latino": [
        "Rodriguez", "Gonzalez", "Martinez", "Hernandez", "Garcia", "Lopez",
        "Ramirez", "Torres", "Morales", "Rivera", "Flores", "Reyes",
        "Cruz", "Gutierrez", "Ortiz", "Mendoza", "Jimenez", "Vargas"
    ],
    "Black/African American": [
        "Washington", "Williams", "Jackson", "Davis", "Thompson", "Taylor",
        "Brown", "Moore", "Harris", "Johnson", "Wilson", "Anderson",
        "Thomas", "Lee", "Walker", "Robinson", "White", "Lewis"
    ],
    "White": [
        "O'Brien", "Murphy", "Sullivan", "Anderson", "Cohen", "Smith",
        "Miller", "Wilson", "Thompson", "Walsh", "Ryan", "Kelly",
        "McCarthy", "Burke", "Brennan", "Flynn", "Connor", "Doyle"
    ],
    "Asian": [
        "Chen", "Kim", "Patel", "Nguyen", "Lee", "Park", "Ahmed", "Singh",
        "Wang", "Liu", "Zhang", "Li", "Huang", "Lin", "Wu", "Yang"
    ]
}

# Chicago addresses (mix of neighborhoods)
ADDRESSES = [
    ("2847 W Armitage Ave", "60647"),
    ("1501 N Fremont St", "60642"),
    ("700 S State St", "60605"),
    ("3421 N Sheffield Ave", "60657"),
    ("5700 N Ridge Ave", "60660"),
    ("2501 W Addison St", "60618"),
    ("1147 W Ohio St", "60642"),
    ("4523 S King Dr", "60653"),
    ("2234 S Wentworth Ave", "60616"),
    ("3847 W 26th St", "60623"),
    ("7234 N Paulina St", "60626"),
    ("1456 W Division St", "60642"),
    ("2156 S Loomis St", "60608"),
    ("5623 S Michigan Ave", "60637"),
    ("4789 N Broadway St", "60640"),
    ("6234 N Western Ave", "60659"),
    ("234 E Pearson St", "60611"),
    ("3456 W 31st St", "60623"),
    ("1823 N Clybourn Ave", "60614"),
    ("8934 S Halsted St", "60620"),
    ("2734 W Division St", "60622"),
    ("845 W Eastman St", "60642"),
    ("6745 N Devon Ave", "60631"),
    ("445 E 51st St", "60615"),
    ("1923 S Blue Island Ave", "60608"),
    ("2856 W Leland Ave", "60625"),
    ("7823 S Vernon Ave", "60619"),
    ("4512 W 47th St", "60632"),
    ("3245 N Lincoln Ave", "60657"),
    ("9234 S Cottage Grove Ave", "60619")
]

ETHNICITIES = ["Hispanic/Latino", "Black/African American", "White", "Asian"]
GENDERS = ["Male", "Female"]
GRADES = [9, 10, 11, 12]

def generate_students(num_students, num_schools, output_file):
    """Generate test student data."""
    print(f"Generating {num_students:,} students across {num_schools} schools...")

    # Select schools
    if num_schools > len(CPS_SCHOOLS):
        print(f"Warning: Requested {num_schools} schools but only {len(CPS_SCHOOLS)} available.")
        print(f"Using all {len(CPS_SCHOOLS)} schools.")
        schools = CPS_SCHOOLS
    else:
        schools = random.sample(CPS_SCHOOLS, num_schools)

    # Calculate students per school
    base_per_school = num_students // len(schools)
    remainder = num_students % len(schools)

    students = []
    student_id = 10000000

    for school_idx, school in enumerate(schools):
        # Distribute remainder across first few schools
        students_for_this_school = base_per_school + (1 if school_idx < remainder else 0)

        for _ in range(students_for_this_school):
            ethnicity = random.choice(ETHNICITIES)
            gender = random.choice(GENDERS)

            first_name = random.choice(FIRST_NAMES[ethnicity])
            last_name = random.choice(LAST_NAMES[ethnicity])
            address, zip_code = random.choice(ADDRESSES)
            grade = random.choice(GRADES)

            student = {
                "studentId": str(student_id),
                "firstName": first_name,
                "lastName": last_name,
                "grade": grade,
                "gender": gender,
                "ethnicity": ethnicity,
                "school": school,
                "address": address,
                "zipCode": zip_code
            }

            students.append(student)
            student_id += 1

        if (school_idx + 1) % 10 == 0:
            print(f"  Generated students for {school_idx + 1}/{len(schools)} schools...")

    # Write to file
    output_path = Path(output_file)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    print(f"Writing to {output_file}...")
    with open(output_file, 'w') as f:
        json.dump(students, f, indent=2)

    # Calculate file size
    file_size = output_path.stat().st_size
    file_size_mb = file_size / (1024 * 1024)

    print(f"\n✓ Successfully generated {len(students):,} students")
    print(f"✓ Across {len(schools)} schools")
    print(f"✓ Average {base_per_school} students per school")
    print(f"✓ File size: {file_size_mb:.2f} MB")
    print(f"✓ Saved to: {output_file}")

    # Show distribution stats
    print("\nDemographic Distribution:")
    for ethnicity in ETHNICITIES:
        count = sum(1 for s in students if s['ethnicity'] == ethnicity)
        pct = (count / len(students)) * 100
        print(f"  {ethnicity}: {count:,} ({pct:.1f}%)")

    print("\nGrade Distribution:")
    for grade in GRADES:
        count = sum(1 for s in students if s['grade'] == grade)
        pct = (count / len(students)) * 100
        print(f"  Grade {grade}: {count:,} ({pct:.1f}%)")

def main():
    parser = argparse.ArgumentParser(
        description="Generate realistic test data for Aspen-Lite",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Generate 1,000 students across 50 schools
  python3 generate_test_data.py --students 1000 --schools 50

  # Generate 10,000 students across 100 schools
  python3 generate_test_data.py --students 10000 --schools 100

  # Generate 300,000 students across 1000 schools (full scale)
  python3 generate_test_data.py --students 300000 --schools 1000

  # Custom output location
  python3 generate_test_data.py --students 5000 --schools 75 --output data/test.json
        """
    )

    parser.add_argument(
        '--students',
        type=int,
        default=1000,
        help='Number of students to generate (default: 1000)'
    )

    parser.add_argument(
        '--schools',
        type=int,
        default=50,
        help='Number of schools to use (default: 50, max: 50)'
    )

    parser.add_argument(
        '--output',
        type=str,
        default='data/generated_students.json',
        help='Output file path (default: data/generated_students.json)'
    )

    args = parser.parse_args()

    # Validation
    if args.students < 1:
        parser.error("Number of students must be at least 1")

    if args.schools < 1:
        parser.error("Number of schools must be at least 1")

    # Generate data
    generate_students(args.students, args.schools, args.output)

if __name__ == '__main__':
    main()
