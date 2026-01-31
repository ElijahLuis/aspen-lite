// Utility functions for aspen-lite

// Extract unique schools from student data, sorted alphabetically
export function getAllSchools(students) {
    const schools = [...new Set(students.map(s => s.school))];
    return schools.sort();
}

// Filter students by school
export function getStudentsBySchool(students, school) {
    if (!school) {
        return students;
    }
    return students.filter(s => s.school === school);
}

// Debounce function for search inputs
export function debounce(fn, delay = 300) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn.apply(this, args), delay);
    };
}

// Get student count by school
export function getStudentCountBySchool(students) {
    const counts = {};
    students.forEach(student => {
        counts[student.school] = (counts[student.school] || 0) + 1;
    });
    return counts;
}

// Format school name for display (shorten if needed)
export function formatSchoolName(school, maxLength = 50) {
    if (school.length <= maxLength) {
        return school;
    }
    return school.substring(0, maxLength - 3) + '...';
}
