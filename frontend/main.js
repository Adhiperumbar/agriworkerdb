document.getElementById('create-worker-form').addEventListener('submit', function(event) {
    event.preventDefault();

    const workerData = {
        name: document.getElementById('name').value,
        gender: document.getElementById('gender').value,
        phoneno: document.getElementById('phoneno').value,
        address: document.getElementById('address').value,
        skillset: document.getElementById('skillset').value,
        dob: document.getElementById('dob').value,
        datehired: document.getElementById('datehired').value
    };

    fetch('http://localhost:3009/workers', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(workerData)
    })
    .then(response => response.json())
    .then(data => {
        console.log('Worker created:', data);
        alert('Worker created successfully!');
    })
    .catch(error => {
        console.error('Error creating worker:', error);
        alert('Error creating worker');
    });
});
