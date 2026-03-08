/**
 * Stage Guess Reveal Game - Game Creation
 * 
 * Handles:
 * - Image upload with preview
 * - Grid size selection
 * - Form validation and submission
 * - Grid preview
 */

// DOM Elements
const elements = {
    form: document.getElementById('create-game-form'),
    titleInput: document.getElementById('game-title'),
    imageInput: document.getElementById('game-image'),
    answerInput: document.getElementById('game-answer'),
    uploadArea: document.getElementById('upload-area'),
    uploadPlaceholder: document.querySelector('.upload-placeholder'),
    imagePreview: document.getElementById('image-preview'),
    gridOptions: document.querySelectorAll('input[name="gridSize"]'),
    previewSection: document.getElementById('preview-section'),
    gridPreview: document.getElementById('grid-preview'),
    toast: document.getElementById('toast'),
    toastMessage: document.getElementById('toast-message')
};

let selectedGridSize = 8;

/**
 * Initialize the create game page
 */
function initCreateGame() {
    setupImageUpload();
    setupGridOptions();
    setupFormSubmission();
    updateGridPreview();
}

/**
 * Setup image upload functionality
 */
function setupImageUpload() {
    // Click to upload - only trigger if click is NOT on the file input itself
    elements.uploadArea.addEventListener('click', (e) => {
        // Prevent double trigger - only click if target is not the file input
        if (e.target !== elements.imageInput) {
            e.preventDefault();
            e.stopPropagation();
            elements.imageInput.click();
        }
    });
    
    // Touch support for mobile
    elements.uploadArea.addEventListener('touchend', (e) => {
        if (e.target !== elements.imageInput) {
            e.preventDefault();
            elements.imageInput.click();
        }
    });
    
    // File selected
    elements.imageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            handleImageFile(file);
        }
    });
    
    // Drag and drop
    elements.uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        elements.uploadArea.classList.add('dragover');
    });
    
    elements.uploadArea.addEventListener('dragleave', () => {
        elements.uploadArea.classList.remove('dragover');
    });
    
    elements.uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        elements.uploadArea.classList.remove('dragover');
        
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            // Set to input for form submission
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            elements.imageInput.files = dataTransfer.files;
            
            handleImageFile(file);
        }
    });
}

/**
 * Handle image file selection
 * @param {File} file - The selected image file
 */
function handleImageFile(file) {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
        showToast('Invalid file type. Please select an image.', 'error');
        return;
    }
    
    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
        showToast('File too large. Maximum size is 10MB.', 'error');
        return;
    }
    
    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
        elements.imagePreview.src = e.target.result;
        elements.imagePreview.classList.remove('hidden');
        elements.uploadPlaceholder.style.display = 'none';
    };
    reader.readAsDataURL(file);
    
    // Show preview section
    elements.previewSection.classList.remove('hidden');
}

/**
 * Setup grid size options
 */
function setupGridOptions() {
    elements.gridOptions.forEach(option => {
        option.addEventListener('change', (e) => {
            selectedGridSize = parseInt(e.target.value);
            updateGridPreview();
        });
    });
}

/**
 * Update the grid preview display
 */
function updateGridPreview() {
    const totalTiles = selectedGridSize * selectedGridSize;
    
    elements.gridPreview.style.gridTemplateColumns = `repeat(${selectedGridSize}, 1fr)`;
    elements.gridPreview.innerHTML = '';
    
    for (let i = 1; i <= totalTiles; i++) {
        const tile = document.createElement('div');
        tile.className = 'preview-tile';
        tile.textContent = i;
        elements.gridPreview.appendChild(tile);
    }
}

/**
 * Setup form submission
 */
function setupFormSubmission() {
    elements.form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Validate form
        const title = elements.titleInput.value.trim();
        const answer = elements.answerInput.value.trim();
        const image = elements.imageInput.files[0];
        
        if (!title) {
            showToast('Please enter a game title', 'error');
            elements.titleInput.focus();
            return;
        }
        
        if (!image) {
            showToast('Please select an image', 'error');
            return;
        }
        
        if (!answer) {
            showToast('Please enter the correct answer', 'error');
            elements.answerInput.focus();
            return;
        }
        
        // Create form data
        const formData = new FormData();
        formData.append('title', title);
        formData.append('image', image);
        formData.append('gridSize', selectedGridSize);
        formData.append('answer', answer);
        
        // Disable submit button
        const submitBtn = elements.form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="btn-icon">⏳</span> Creating...';
        
        try {
            const response = await fetch('/api/games', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create game');
            }
            
            const game = await response.json();
            
            showToast('Game created successfully!', 'success');
            
            // Redirect to games list after delay
            setTimeout(() => {
                window.location.href = '/admin/games';
            }, 1500);
            
        } catch (error) {
            console.error('Error creating game:', error);
            showToast(error.message || 'Failed to create game', 'error');
            
            // Re-enable submit button
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span class="btn-icon">✓</span> Create Game';
        }
    });
}

/**
 * Show toast notification
 * @param {string} message - Message to display
 * @param {string} type - Toast type ('success' or 'error')
 */
function showToast(message, type = 'success') {
    elements.toastMessage.textContent = message;
    elements.toast.className = `toast ${type}`;
    elements.toast.classList.remove('hidden');
    elements.toast.classList.add('show');
    
    // Hide after 3 seconds
    setTimeout(() => {
        elements.toast.classList.remove('show');
        setTimeout(() => {
            elements.toast.classList.add('hidden');
        }, 300);
    }, 3000);
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', initCreateGame);
