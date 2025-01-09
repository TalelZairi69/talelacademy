document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');

    try {
        // Fetch user details
        const userResponse = await fetch('http://localhost:5000/api/auth/dashboard', {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` },
        });

        if (userResponse.ok) {
            const user = await userResponse.json();

            // Display user details
            document.getElementById('username-display').textContent = user.username;
            document.getElementById('username-welcome').textContent = user.username;

            // Show sections based on user role
            if (user.role === 'teacher') {
                document.getElementById('add-course-section').style.display = 'block';
                document.getElementById('show-add-course').style.display = 'block';
                document.getElementById('join-course-section').style.display = 'none';
            } else if (user.role === 'student') {
                document.getElementById('add-course-section').style.display = 'none';
                document.getElementById('show-add-course').style.display = 'none';
                document.getElementById('join-course-section').style.display = 'block';
            }
        } else {
            showNotification('Failed to fetch user details.');
            window.location.href = 'login.html';
        }
    } catch (error) {
        showNotification('An error occurred. Please try again.');
        console.error(error);
        window.location.href = 'login.html';
    }

    // Toggle Add Course Form visibility
    document.getElementById('show-add-course').addEventListener('click', () => {
        const addCourseForm = document.getElementById('add-course-form');
        if (addCourseForm.style.display === 'none' || !addCourseForm.style.display) {
            addCourseForm.style.display = 'block';
        } else {
            addCourseForm.style.display = 'none';
        }
    });

    // Handle Add Course Form Submission
    document.getElementById('add-course-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        const subject = document.getElementById('subject').value;
        const highschool = document.getElementById('highschool').value;
        const grade = document.getElementById('grade').value;

        try {
            const response = await fetch('http://localhost:5000/api/course/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ subject, highschool, grade }),
            });

            if (response.ok) {
                showNotification('Course added successfully!');
                document.getElementById('add-course-form').reset();
                fetchJoinedCourses(); // Refresh the "My Joined Courses" section
            } else {
                const error = await response.json();
                showNotification(`Failed to add course: ${error.message}`);
            }
        } catch (error) {
            console.error(error);
            showNotification('An error occurred while adding the course.');
        }
    });

    // Handle Join Course Form Submission
    document.getElementById('join-course-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        const courseCode = document.getElementById('course-code').value;

        try {
            const response = await fetch('http://localhost:5000/api/course/join', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ courseCode }),
            });

            if (response.ok) {
                const result = await response.json();
                showNotification('Successfully joined the course!');
                console.log('Course joined:', result);
                fetchJoinedCourses(); // Refresh courses
            } else {
                const error = await response.json();
                showNotification(`Failed to join course: ${error.message}`);
            }
        } catch (error) {
            console.error('Error joining course:', error);
            showNotification('An error occurred while joining the course. Please try again.');
        }
    });

    // Fetch and Display Joined Courses
    async function fetchJoinedCourses() {
        try {
            const response = await fetch('http://localhost:5000/api/course/my-courses', {
                method: 'GET',
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
                const courses = await response.json();
                const joinedCoursesList = document.getElementById('joined-courses-list');
                joinedCoursesList.innerHTML = '';

                if (courses.length > 0) {
                    courses.forEach(course => {
                        const li = document.createElement('li');
                        li.innerHTML = `
                            <strong>${course.subject}</strong> (${course.highschool}, Grade: ${course.grade}) 
                            - Code: ${course.courseCode}
                            <br>Prof: ${course.teacher}
                        `;
                        joinedCoursesList.appendChild(li);
                    });
                } else {
                    joinedCoursesList.innerHTML = '<li>No courses joined yet.</li>';
                }
            } else {
                console.error('Failed to fetch joined courses.');
            }
        } catch (error) {
            console.error('An error occurred while fetching courses:', error);
        }
    }

    // Fetch Joined Courses on Page Load
    fetchJoinedCourses();
});

// Show notification function
function showNotification(message) {
    const notificationBar = document.getElementById('notification-bar');
    notificationBar.textContent = message;
    notificationBar.style.display = 'block';
    setTimeout(() => {
        notificationBar.style.display = 'none';
    }, 3000);
}
