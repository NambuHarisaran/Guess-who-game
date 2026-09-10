/**
 * Stage Guess Reveal Game - Studio Creation Logic
 */

// DOM Elements
const elements = {
    form: document.getElementById('create-game-form'),
    titleInput: document.getElementById('game-title'),
    categorySelect: document.getElementById('game-category'),
    imageInput: document.getElementById('game-image'),
    answerInput: document.getElementById('game-answer'),
    uploadArea: document.getElementById('upload-area'),
    dropzoneContent: document.getElementById('dropzone-content'),
    dropzoneMeta: document.getElementById('dropzone-meta'),
    metaFileName: document.getElementById('meta-file-name'),
    metaFileSize: document.getElementById('meta-file-size'),
    btnRemoveImage: document.getElementById('btn-remove-image'),
    gridOptions: document.querySelectorAll('input[name="gridSize"]'),
    stageUnderlay: document.getElementById('stage-image-underlay'),
    stageOverlay: document.getElementById('stage-grid-overlay'),
    stagePlaceholder: document.getElementById('stage-placeholder'),
    previewTileCount: document.getElementById('preview-tile-count'),
    btnSubmitGame: document.getElementById('btn-submit-game'),
    toast: document.getElementById('toast'),
    toastMessage: document.getElementById('toast-message'),
    hamburgerBtn: document.getElementById('hamburger-btn'),
    drawerCloseBtn: document.getElementById('drawer-close-btn'),
    adminSidebar: document.getElementById('admin-sidebar'),
    sidebarBackdrop: document.getElementById('sidebar-backdrop')
};

let selectedGridSize = 8;
let currentImageSrc = null;

function initCreateGame() {
    setupMobileDrawer();
    setupImageUpload();
    setupGridOptions();
    setupFormSubmission();
    updateLiveOverlayPreview();
}

function setupMobileDrawer() {
    const openDrawer = () => {
        elements.adminSidebar?.classList.add('drawer-open');
        elements.sidebarBackdrop?.classList.add('active');
    };

    const closeDrawer = () => {
        elements.adminSidebar?.classList.remove('drawer-open');
        elements.sidebarBackdrop?.classList.remove('active');
    };

    elements.hamburgerBtn?.addEventListener('click', openDrawer);
    elements.drawerCloseBtn?.addEventListener('click', closeDrawer);
    elements.sidebarBackdrop?.addEventListener('click', closeDrawer);
}

function setupImageUpload() {
    // Drag & Drop
    ['dragenter', 'dragover'].forEach(eventName => {
        elements.uploadArea.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            elements.uploadArea.classList.add('dragover');
        });
    });

    ['dragleave', 'drop'].forEach(eventName => {
        elements.uploadArea.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            elements.uploadArea.classList.remove('dragover');
        });
    });

    elements.uploadArea.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            elements.imageInput.files = files;
            handleFileSelect(files[0]);
        }
    });

    elements.imageInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFileSelect(e.target.files[0]);
        }
    });

    elements.btnRemoveImage?.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        elements.imageInput.value = '';
        currentImageSrc = null;
        elements.dropzoneContent.classList.remove('hidden');
        elements.dropzoneMeta.classList.add('hidden');
        updateLiveOverlayPreview();
    });
}

function handleFileSelect(file) {
    if (!file.type.match('image.*')) {
        showToast('Please select a valid image file (JPG, PNG, WebP)', 'error');
        return;
    }

    if (file.size > 10 * 1024 * 1024) {
        showToast('Image file size must be less than 10MB', 'error');
        return;
    }

    // Display metadata
    elements.metaFileName.textContent = file.name;
    elements.metaFileSize.textContent = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
    elements.dropzoneContent.classList.add('hidden');
    elements.dropzoneMeta.classList.remove('hidden');

    const reader = new FileReader();
    reader.onload = (e) => {
        currentImageSrc = e.target.result;
        updateLiveOverlayPreview();
    };
    reader.readAsDataURL(file);
}

function setupGridOptions() {
    elements.gridOptions.forEach(option => {
        option.addEventListener('change', (e) => {
            selectedGridSize = parseInt(e.target.value);
            updateLiveOverlayPreview();
        });
    });
}

function updateLiveOverlayPreview() {
    if (!elements.stageOverlay) return;

    const totalTiles = selectedGridSize * selectedGridSize;
    elements.previewTileCount.textContent = `${totalTiles} Tiles (${selectedGridSize}×${selectedGridSize})`;

    if (!currentImageSrc) {
        elements.stagePlaceholder.classList.remove('hidden');
        elements.stageUnderlay.style.backgroundImage = 'none';
        elements.stageOverlay.innerHTML = '';
        return;
    }

    elements.stagePlaceholder.classList.add('hidden');
    elements.stageUnderlay.style.backgroundImage = `url("${currentImageSrc}")`;
    elements.stageOverlay.style.gridTemplateColumns = `repeat(${selectedGridSize}, 1fr)`;
    elements.stageOverlay.style.gridTemplateRows = `repeat(${selectedGridSize}, 1fr)`;

    elements.stageOverlay.innerHTML = '';
    const fragment = document.createDocumentFragment();

    for (let i = 1; i <= totalTiles; i++) {
        const tile = document.createElement('div');
        tile.className = 'preview-overlay-tile';
        tile.textContent = i;
        tile.title = `Tile #${i} - Hover to peek`;

        tile.addEventListener('mouseenter', () => tile.classList.add('tile-peek'));
        tile.addEventListener('mouseleave', () => tile.classList.remove('tile-peek'));

        fragment.appendChild(tile);
    }

    elements.stageOverlay.appendChild(fragment);
}

function setupFormSubmission() {
    elements.form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const title = elements.titleInput.value.trim();
        const answer = elements.answerInput.value.trim();
        const image = elements.imageInput.files[0];

        if (!title) {
            showToast('Please enter a game title', 'error');
            elements.titleInput.focus();
            return;
        }

        if (!image) {
            showToast('Please upload an image for the game', 'error');
            return;
        }

        if (!answer) {
            showToast('Please enter the secret answer', 'error');
            elements.answerInput.focus();
            return;
        }

        const formData = new FormData();
        formData.append('title', title);
        formData.append('image', image);
        formData.append('gridSize', selectedGridSize);
        formData.append('answer', answer);

        elements.btnSubmitGame.disabled = true;
        elements.btnSubmitGame.innerHTML = '<span class="btn-icon">⏳</span> Creating Game...';

        try {
            const res = await fetch('/api/games', {
                method: 'POST',
                body: formData
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Failed to create game');
            }

            const createdGame = await res.json();
            showToast('✨ Game created successfully! Launching...', 'success');

            setTimeout(() => {
                window.location.href = `/game/${createdGame.id}`;
            }, 1200);

        } catch (error) {
            console.error(error);
            showToast(error.message || 'Error creating game', 'error');
            elements.btnSubmitGame.disabled = false;
            elements.btnSubmitGame.innerHTML = '<span class="btn-icon">✨</span> Create & Launch Game';
        }
    });

    // Keyboard shortcut Ctrl+Enter to submit
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            elements.form.requestSubmit();
        }
    });
}

function showToast(message, type = 'success') {
    if (!elements.toast || !elements.toastMessage) return;
    elements.toastMessage.textContent = message;
    elements.toast.className = `toast ${type}`;
    elements.toast.classList.remove('hidden');
    elements.toast.classList.add('show');

    setTimeout(() => {
        elements.toast.classList.remove('show');
        setTimeout(() => {
            elements.toast.classList.add('hidden');
        }, 300);
    }, 3200);
}

document.addEventListener('DOMContentLoaded', initCreateGame);
