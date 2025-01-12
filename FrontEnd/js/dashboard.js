document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    fetchStudyGroups(); // Call on page load
    try {
        const userResponse = await fetch('https://talelacademybackend.onrender.com/api/auth/dashboard', {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` },
        });

        if (userResponse.ok) {
            const user = await userResponse.json();

            // Check if elements exist before assigning values
            const usernameDisplay = document.getElementById('username-display');
            const usernameWelcome = document.getElementById('username-welcome');
            
            if (usernameDisplay) usernameDisplay.textContent = user.username;
            if (usernameWelcome) usernameWelcome.textContent = user.username;

            // Role-based section visibility
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
            window.location.href = '/Login/';
        }
    } catch (error) {
        showNotification('An error occurred. Please try again.');
        console.error(error);
        window.location.href = '/Login/';
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
   // Handle Add Course Form Submission
   document.getElementById('add-course-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const type = document.getElementById('course-type')?.value;

    // Ensure course type is selected
    if (!type) {
        alert('Veuillez sélectionner un type de cours.');
        return;
    }

    // Prepare payload dynamically based on type
    const payload = { type };

    if (type === 'classe_de_lycee') {
        const subjectElement = document.getElementById('subject');
        const highschoolElement = document.getElementById('highschool');
        const gradeElement = document.getElementById('grade');
        const sectionElement = document.getElementById('section'); // Corrected `id`

        if (!subjectElement?.value || !highschoolElement?.value || !gradeElement?.value || !sectionElement?.value) {
            alert('Veuillez remplir tous les champs requis pour Classe de Lycée.');
            return;
        }

        payload.subject = subjectElement.value;
        payload.highschool = highschoolElement.value;
        payload.grade = gradeElement.value;
        payload.section = sectionElement.value;
    } else if (type === 'groupe_d_etude') {
        const studySubjectElement = document.getElementById('study-subject');
        const studyGradeElement = document.getElementById('study-grade');
        const studySectionElement = document.getElementById('study-section');
        const groupElement = document.getElementById('group');

        if (!studySubjectElement?.value || !studyGradeElement?.value || !studySectionElement?.value || !groupElement?.value) {
            alert('Veuillez remplir tous les champs requis pour Groupe d\'Étude.');
            return;
        }

        payload.subject = studySubjectElement.value;
        payload.grade = studyGradeElement.value;
        payload.section = studySectionElement.value;
        payload.group = groupElement.value;
    }

    // Submit payload to the backend
    try {
        const response = await fetch('https://talelacademybackend.onrender.com/api/course/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify(payload),
        });
    
        if (response.ok) {
            showNotification('Cours ajouté avec succès!');
            document.getElementById('add-course-form').reset();
    
            // Dynamically update the lists without a page refresh
            if (type === 'classe_de_lycee') {
                await fetchJoinedCourses(); // Refresh Mes Classes
            } else if (type === 'groupe_d_etude') {
                await fetchStudyGroups(); // Refresh Mes Groupes d'Étude
            }
        } else {
            const error = await response.json();
            showNotification(`Erreur: ${error.message}`, true);
        }
    } catch (error) {
        console.error('Error adding course:', error);
        showNotification('Une erreur est survenue lors de l\'ajout du cours.', true);
    }
    
});





    
    

    // Handle Join Course Form Submission
    document.getElementById('join-course-form').addEventListener('submit', async (e) => {
        e.preventDefault();
    
        const courseCode = document.getElementById('course-code').value;
    
        try {
            const response = await fetch('https://talelacademybackend.onrender.com/api/course/join', {
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
    
                // Refresh the groups and courses after joining
                await fetchJoinedCourses(); // Refresh Mes Classes
                await fetchStudyGroups();  // Refresh Mes groupes d'étude
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
            const response = await fetch('https://talelacademybackend.onrender.com/api/course/my-courses', {
                method: 'GET',
                headers: { Authorization: `Bearer ${token}` },
            });
    
            if (response.ok) {
                const courses = await response.json();
                console.log('Courses received:', courses); // Debugging
    
                const joinedCoursesContainer = document.getElementById('joined-courses-container');
                joinedCoursesContainer.innerHTML = ''; // Clear previous courses
    
                if (courses.length > 0) {
                    courses.forEach(course => {
                        const courseCard = document.createElement('div');
                        courseCard.classList.add('course-card');
                        courseCard.onclick = () => {
                            showNotification(`Cours sélectionné : ${course.subject}`);
                        };
    
                        const images = {
                            Mathématiques: 'https://png.pngtree.com/thumb_back/fh260/background/20200530/pngtree-cute-hand-drawn-style-mathematics-education-pink-plaid-background-image_337364.jpg',
                            Physique: 'https://media.istockphoto.com/id/874157664/fr/photo/bureau-de-la-salle-de-classe-et-tableau-tir%C3%A9-de-vue-g%C3%A9n%C3%A9rale-de-lenseignement-de-la-chimie.jpg?s=612x612&w=0&k=20&c=vY-JQAdqXbpDZU2BgvDYnNCoPA4ECOlxqGYGdqnIzg4=',
                            Sciences_Naturelles: 'https://i.pinimg.com/736x/c4/ed/23/c4ed2397c0f68076e613cead6a737f16.jpg',
                            Anglais: 'https://www.shutterstock.com/shutterstock/photos/2194586205/display_1500/stock-vector-english-language-learning-concept-vector-illustration-doodle-of-foreign-language-education-course-2194586205.jpg',
                            default: 'https://png.pngtree.com/thumb_back/fh260/background/20200530/pngtree-cute-hand-drawn-style-mathematics-education-pink-plaid-background-image_337364.jpg',
                        };
    
                        const imageUrl = images[course.subject] || images.default;
    
                        courseCard.innerHTML = `
                            <img src="${imageUrl}" alt="Course Image">
                            <h5>${course.subject}</h5>
                            <p><strong>Lycée:</strong> ${course.highschool || 'Non spécifié'}</p>
                            <p><strong>Niveau:</strong> ${course.grade || 'Non spécifié'}</p>
                            <p><strong>Section:</strong> ${course.section || 'Non spécifié'}</p>
                            <p><strong>Code:</strong> <span class="course-code">${course.courseCode || 'Non spécifié'}</span></p>
                            <p><strong>Professeur:</strong> ${course.teacher}</p>
                        `;
                        joinedCoursesContainer.appendChild(courseCard);
                    });
                } else {
                    joinedCoursesContainer.innerHTML = '<p>Aucun cours rejoint pour le moment.</p>';
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
function logout() {
    // Clear the token from localStorage
    localStorage.removeItem('token');

    // Dynamically calculate the root URL and redirect to the signin page
    const rootUrl = window.location.origin; // Gets "http://127.0.0.1:5500"
    const signinPath = "/Login";
    
    const redirectUrl = rootUrl + signinPath;

    // Optionally, send a logout request to the server (if needed)
    fetch('https://talelacademybackend.onrender.com/api/auth/logout', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`, // Include token if required
        },
    })
    .then(response => {
        // Regardless of success or failure, redirect to the signin page
        window.location.href = redirectUrl;
    })
    .catch(error => {
        console.error('Error logging out:', error);
        // Redirect to signin even if there's an error
        window.location.href = redirectUrl;
    });
}
document.getElementById('course-type').addEventListener('change', (e) => {
    const type = e.target.value;
    const lyceeFields = document.getElementById('classe-de-lycee-fields');
    const etudeFields = document.getElementById('groupe-d-etude-fields');

    if (type === 'classe_de_lycee') {
        lyceeFields.style.display = 'block';
        etudeFields.style.display = 'none';

        // Add "required" to "Classe de Lycée" fields
        document.getElementById('subject').setAttribute('required', true);
        document.getElementById('highschool').setAttribute('required', true);
        document.getElementById('grade').setAttribute('required', true);
        document.getElementById('section').setAttribute('required', true);

        // Remove "required" from "Groupe d'Étude" fields
        document.getElementById('study-subject').removeAttribute('required');
        document.getElementById('study-grade').removeAttribute('required');
        document.getElementById('study-section').removeAttribute('required');
        document.getElementById('group').removeAttribute('required');
    } else if (type === 'groupe_d_etude') {
        lyceeFields.style.display = 'none';
        etudeFields.style.display = 'block';

        // Add "required" to "Groupe d'Étude" fields
        document.getElementById('study-subject').setAttribute('required', true);
        document.getElementById('study-grade').setAttribute('required', true);
        document.getElementById('study-section').setAttribute('required', true);
        document.getElementById('group').setAttribute('required', true);

        // Remove "required" from "Classe de Lycée" fields
        document.getElementById('subject').removeAttribute('required');
        document.getElementById('highschool').removeAttribute('required');
        document.getElementById('grade').removeAttribute('required');
        document.getElementById('section').removeAttribute('required');
    }
});


// Fetch and Display Joined Groupe d'Étude Courses
// Fetch and Display Joined Groupe d'Étude Courses
// Fetch and Display Joined Groupe d'Étude Courses
async function fetchStudyGroups() {
    const images = {
        Mathématiques: 'https://png.pngtree.com/thumb_back/fh260/background/20200530/pngtree-cute-hand-drawn-style-mathematics-education-pink-plaid-background-image_337364.jpg',
        Physique: 'https://media.istockphoto.com/id/874157664/fr/photo/bureau-de-la-salle-de-classe-et-tableau-tir%C3%A9-de-vue-g%C3%A9n%C3%A9rale-de-lenseignement-de-la-chimie.jpg?s=612x612&w=0&k=20&c=vY-JQAdqXbpDZU2BgvDYnNCoPA4ECOlxqGYGdqnIzg4=',
        Sciences_Naturelles: 'https://i.pinimg.com/736x/c4/ed/23/c4ed2397c0f68076e613cead6a737f16.jpg',
        Anglais: 'https://www.shutterstock.com/shutterstock/photos/2194586205/display_1500/stock-vector-english-language-learning-concept-vector-illustration-doodle-of-foreign-language-education-course-2194586205.jpg',
        default: 'https://png.pngtree.com/thumb_back/fh260/background/20200530/pngtree-cute-hand-drawn-style-mathematics-education-pink-plaid-background-image_337364.jpg',
    };

    try {
        const response = await fetch('https://talelacademybackend.onrender.com/api/course/my-study-groups', {
            method: 'GET',
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });

        if (response.ok) {
            const studyGroups = await response.json();
            console.log('Study Groups received:', studyGroups); // Debugging

            const studyGroupsContainer = document.getElementById('study-groups-container');
            studyGroupsContainer.innerHTML = ''; // Clear previous study groups

            if (studyGroups.length > 0) {
                studyGroups.forEach(group => {
                    const groupCard = document.createElement('div');
                    groupCard.classList.add('course-card');
                    groupCard.onclick = () => {
                        showNotification(`Groupe sélectionné : ${group.subject}`);
                    };

                    const images = {
                        Mathématiques: 'https://png.pngtree.com/thumb_back/fh260/background/20200530/pngtree-cute-hand-drawn-style-mathematics-education-pink-plaid-background-image_337364.jpg',
                        default: 'https://png.pngtree.com/thumb_back/fh260/background/20200530/pngtree-cute-hand-drawn-style-mathematics-education-pink-plaid-background-image_337364.jpg',
                    };

                    const imageUrl = images[group.subject] || images.default;

                    groupCard.innerHTML = `
                    <img src="${imageUrl}" alt="Groupe Image">
                    <h5>${group.subject}</h5>
                    <p><strong>Section:</strong> ${group.section || 'Non spécifié'}</p>
                    <p><strong>Groupe:</strong> ${group.group || 'Non spécifié'}</p>
                    <p><strong>Niveau:</strong> ${group.grade || 'Non spécifié'}</p>
                    <p><strong>Code:</strong> <span class="course-code">${group.courseCode || 'Non spécifié'}</span></p>
                    <p><strong>Professeur:</strong> ${group.teacher}</p>
                `;
                
                    studyGroupsContainer.appendChild(groupCard);
                });
            } else {
                studyGroupsContainer.innerHTML = '<p>Aucun groupe d\'étude rejoint pour le moment.</p>';
            }
        } else {
            console.error('Failed to fetch study groups.');
        }
    } catch (error) {
        console.error('An error occurred while fetching study groups:', error);
    }
}



document.addEventListener('DOMContentLoaded', () => {
    const courseType = document.getElementById('course-type').value;

    if (courseType === 'classe_de_lycee') {
        document.getElementById('classe-de-lycee-fields').style.display = 'block';
        document.getElementById('groupe-d-etude-fields').style.display = 'none';
    } else if (courseType === 'groupe_d_etude') {
        document.getElementById('classe-de-lycee-fields').style.display = 'none';
        document.getElementById('groupe-d-etude-fields').style.display = 'block';
    }
});

