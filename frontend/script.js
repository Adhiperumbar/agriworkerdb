// Get the form element
const form = document.getElementById('workerForm');

// Add a submit event listener to the form
form.addEventListener('submit', function (event) {
    event.preventDefault(); // Prevent the default form submission

    // Collect the form data
    const formData = {
        name: document.getElementById('name').value,
        gender: document.getElementById('gender').value,
        phoneno: document.getElementById('phoneno').value,
        address: document.getElementById('address').value,
        skillset: document.getElementById('skillset').value,
        dob: document.getElementById('dob').value,
        datehired: document.getElementById('datehired').value,
    };

    // Send the form data as a POST request to the backend
    fetch('http://localhost:3009/workers', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData), // Convert form data to JSON
    })
    .then(response => response.json()) // Parse the JSON response
    .then(data => {
        console.log('Success:', data); // Log success response
        alert('Worker created successfully!');
    })
    .catch((error) => {
        console.error('Error:', error); // Log error if any
        alert('Error creating worker');
    });
});
