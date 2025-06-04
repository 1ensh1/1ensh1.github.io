document.addEventListener('DOMContentLoaded', function() {
    // Quiz answer feedback
    const options = document.querySelectorAll('.option');
    
    options.forEach(option => {
        option.addEventListener('click', function() {
            // Remove any existing selected classes
            const questionBox = this.closest('.question-box');
            questionBox.querySelectorAll('.option').forEach(opt => {
                opt.classList.remove('selected', 'correct', 'incorrect');
            });
            
            // Add selected class
            this.classList.add('selected');
        });
    });
    
    // Form validation
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            const requiredFields = this.querySelectorAll('[required]');
            let isValid = true;
            
            requiredFields.forEach(field => {
                if (!field.value.trim()) {
                    isValid = false;
                    field.style.borderColor = '#f44336';
                } else {
                    field.style.borderColor = '';
                }
            });
            
            if (!isValid) {
                e.preventDefault();
                alert('Please fill in all required fields.');
            }
        });
    });
    
    // Admin question management would have more JS for adding/removing options
});