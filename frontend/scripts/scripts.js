document.addEventListener('DOMContentLoaded', () => {
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            localStorage.removeItem('token');
            alert('You have been logged out.');
            window.location.href = './index.html';
        });
    }

    if (window.location.pathname.includes('profile-appointment.html')) {
        fetchUserProfile();
    }

    if (window.location.pathname.includes('users.html')) {
        fetchUsers();
    }

    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileUpdate);
    }

    // Registration form handling
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            console.log('Form submitted');

            // Create FormData and validate all required fields
            const formData = new FormData(event.target);
            const requiredFields = [
                'firstName', 
                'lastName', 
                'email', 
                'password', 
                'phone', 
                'dob', 
                'location', 
                'employmentType'
            ];

            console.log('FormData Entries:');
            for (let [key, value] of formData.entries()) {
             console.log(`${key}:`, value);
        }

            // Check if all required fields are filled
            let allFieldsFilled = true;
            requiredFields.forEach(field => {
                const value = formData.get(field);
                if (!value || value.trim() === '') {
                    allFieldsFilled = false;
                }
            });

            if (!allFieldsFilled) {
                const errorMessage = document.getElementById('errorMessage');
                errorMessage.textContent = 'All fields are required.';
                errorMessage.style.display = 'block';
                return;
            }

            // Check if CV file is uploaded
            const cvFile = formData.get('cv');
            if (!cvFile || cvFile.name === '') {
                const errorMessage = document.getElementById('errorMessage');
                errorMessage.textContent = 'Please upload your CV.';
                errorMessage.style.display = 'block';
                return;
            }

            try {
                const response = await fetch('http://localhost:5000/api/auth/register', {
                    method: 'POST',
                    body: formData
                });

                const data = await response.json();
                console.log('Response:', response.status, data);

                if (response.ok) {
                    console.log('Registration successful');
                    document.getElementById('popupModal').style.display = 'block';
                    registerForm.reset();
                    registerForm.style.display = 'none';
                } else {
                    const errorMessage = document.getElementById('errorMessage');
                    errorMessage.textContent = data.message || 'Registration failed. Please try again.';
                    errorMessage.style.display = 'block';
                }
            } catch (error) {
                console.error('Error:', error);
                const errorMessage = document.getElementById('errorMessage');
                errorMessage.textContent = 'An error occurred. Please try again.';
                errorMessage.style.display = 'block';
            }
        });
    }
});

function showPopup() {
    console.log('Attempting to show popup');
    const popup = document.getElementById('popupModal');
    if (popup) {
        console.log('Popup element found, setting display to block');
        popup.style.display = 'block';
    } else {
        console.error('Popup element not found');
    }
}

function closePopup() {
    console.log('Closing popup');
    const popup = document.getElementById('popupModal');
    popup.style.display = 'none';
    window.location.href = './index.html';
}

async function fetchUserProfile() {
    const token = localStorage.getItem('token');
    if (!token) {
        if (window.location.pathname.includes('profile-appointment.html')) {
            alert('You need to log in.');
            window.location.href = './index.html';
        }
        return;
    }

    try {
        const response = await fetch('http://localhost:5000/api/auth/profile', {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch profile data.');
        }

        const data = await response.json();
        document.getElementById('firstName').value = data.firstname;
        document.getElementById('lastName').value = data.lastname;
        document.getElementById('email').value = data.email;
        document.getElementById('location').value = data.location;
        document.getElementById('employmentType').value = data.employmenttype;

        const cvLink = document.getElementById('cvLink');
        if (data.cvpath) {
            cvLink.innerHTML = `<a href="${data.cvpath}" target="_blank">Download Current CV</a>`;
        } else {
            cvLink.textContent = 'No CV uploaded.';
        }
    } catch (error) {
        console.error(error.message);
        if (window.location.pathname.includes('profile-appointment.html')) {
            alert('Error loading profile.');
        }
    }
}

async function handleProfileUpdate(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const token = localStorage.getItem('token');

    try {
        const response = await fetch('http://localhost:5000/api/auth/profile', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
            },
            body: formData,
        });

        if (!response.ok) {
            throw new Error('Failed to update profile.');
        }

        const data = await response.json();
        alert('Profile updated successfully!');

        if (data.user.cvpath) {
            const cvLink = document.getElementById('cvLink');
            cvLink.innerHTML = `<a href="${data.user.cvpath}" target="_blank">Download Updated CV</a>`;
        }
    } catch (error) {
        console.error(error.message);
        alert('Error updating profile.');
    }
}

async function fetchUsers() {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('You need to log in.');
        window.location.href = './index.html';
        return;
    }

    try {
        const response = await fetch('http://localhost:5000/api/admin/users', {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch users.');
        }

        const users = await response.json();

        const usersTableBody = document.querySelector('#usersTable tbody');
        usersTableBody.innerHTML = '';

        users.forEach((user) => {
            const row = document.createElement('tr');

            row.innerHTML = `
                <td>${user.firstname} ${user.lastname}</td>
                <td>${user.email}</td>
                <td>${user.phone}</td>
                <td>${user.location}</td>
                <td>${user.role}</td>
                <td>
                    ${user.cvpath 
                        ? `<a href="${user.cvpath}" target="_blank">Download CV</a>` 
                        : 'No CV uploaded'}
                </td>
            `;

            usersTableBody.appendChild(row);
        });
    } catch (error) {
        console.error(error.message);
        alert('Error loading users.');
    }
}