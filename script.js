// Wrap imports in try-catch for better error handling
let auth, db, createUserWithEmailAndPassword, signInWithEmailAndPassword, 
    GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged,
    getDatabase, ref, update, onValue, push, set, get;

try {
    const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js");
    const firebaseAuth = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js");
    const firebaseDB = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js");

    // Destructure imports
    ({
        getAuth,
        createUserWithEmailAndPassword,
        signInWithEmailAndPassword,
        GoogleAuthProvider,
        signInWithPopup,
        signOut,
        onAuthStateChanged
    } = firebaseAuth);

    ({
        getDatabase,
        ref,
        update,
        onValue,
        push,
        set,
        get
    } = firebaseDB);

    // Firebase configuration 
    const firebaseConfig = {
        apiKey: "AIzaSyCAImdjvo3yjfsxwwGKZp5iDx5VwmhfaDs",
        authDomain: "contact-us-page-missbanaras.firebaseapp.com",
        databaseURL: "https://contact-us-page-missbanaras-default-rtdb.firebaseio.com",
        projectId: "contact-us-page-missbanaras",
        messagingSenderId: "323394332678",
        appId: "1:323394332678:web:99dde90fa03bf6c85ebb87",
        measurementId: "G-6MWHVZ5KG9"
    };

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getDatabase(app);

} catch (error) {
    console.error("Error loading Firebase modules:", error);
    showNotification("Failed to initialize Firebase. Please try again later.", "error");
}

// Constants
const BACKEND_URL = "https://miss-banaras-backend.onrender.com";
const MAX_UPLOADS = 15;

// Elements
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const signUpBtn = document.getElementById("signUp");
const loginBtn = document.getElementById("login");
const googleBtn = document.getElementById("googleSignIn");
const logoutBtn = document.getElementById("logout");
const nextBtn = document.getElementById("nextBtn");
const userDataDiv = document.getElementById("userData");
const statusText = document.getElementById("status");
const progressBar = document.getElementById("uploadProgress");
const progressFill = document.getElementById("progressFill");
const uploadBtn = document.getElementById("uploadBtn");
const fileInput = document.getElementById("fileInput");
const selectedFileDisplay = document.getElementById("selectedFile");
const preview = document.getElementById("preview");
const gallery = document.getElementById("gallery");
const stepper = document.getElementById("stepper");
const imageModal = document.getElementById("imageModal");
const modalImg = document.getElementById("modalImg");
const registrationForm = document.getElementById("registration-form");
const submittedDataDiv = document.getElementById("submittedData");
const editRegistrationBtn = document.getElementById("editRegistration");
const nextToUploadBtn = document.getElementById("nextToUpload");
const authGreeting = document.getElementById("auth-greeting");

// Global variables
let currentUser = null;
let uploadedCount = 0;
let isRegistrationComplete = false;
let hasEdited = false;

// Enhanced Three.js initialization with error handling and fallback
function initThreeJS() {
    try {
        if (!THREE) {
            throw new Error("Three.js not loaded");
        }

        const canvas = document.getElementById("lotus-canvas");
        if (!canvas) {
            throw new Error("Canvas element not found");
        }

        // Renderer with advanced settings
        const renderer = new THREE.WebGLRenderer({
            canvas,
            alpha: true,
            antialias: true,
            powerPreference: "high-performance",
            stencil: false
        });
        
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Add post-processing effects
        const composer = new THREE.EffectComposer(renderer);
        const renderPass = new THREE.RenderPass(scene, camera);
        composer.addPass(renderPass);

        // Add bloom effect
        const bloomPass = new THREE.UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            1.5, 0.4, 0.85
        );
        bloomPass.threshold = 0.21;
        bloomPass.strength = 1.2;
        bloomPass.radius = 0.55;
        composer.addPass(bloomPass);

        // Performance monitoring
        const stats = new Stats();
        if (process.env.NODE_ENV === 'development') {
            document.body.appendChild(stats.dom);
        }

        // Enhanced animation loop with frame limiting
        let lastTime = 0;
        const targetFPS = 60;
        const frameInterval = 1000 / targetFPS;

        function animate(currentTime) {
            stats.begin();

            const deltaTime = currentTime - lastTime;
            if (deltaTime > frameInterval) {
                lastTime = currentTime - (deltaTime % frameInterval);
                
                // Update animations
                lotuses.forEach(lotus => updateLotus(lotus, deltaTime));
                petals.forEach(petal => updatePetal(petal, deltaTime));
                updateWater(deltaTime);
                updateParticles(deltaTime);
                
                // Render scene
                composer.render();
            }

            stats.end();
            requestAnimationFrame(animate);
        }

        animate(0);

        // Responsive handling with debouncing
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                const width = window.innerWidth;
                const height = window.innerHeight;
                
                camera.aspect = width / height;
                camera.updateProjectionMatrix();
                
                renderer.setSize(width, height);
                composer.setSize(width, height);
                
                // Update post-processing effects
                bloomPass.setSize(width, height);
            }, 250);
        });

    } catch (error) {
        console.error("Three.js initialization failed:", error);
        // Fallback to static background
        document.getElementById("lotus-canvas").style.display = "none";
        document.body.classList.add("fallback-bg");
        showNotification("Enhanced graphics not available. Using fallback mode.", "info");
    }
}

// Enhanced form validation
function validateForm(formData) {
    const errors = [];
    
    // Name validation with Unicode support
    if (!/^[\p{L}\s]{2,50}$/u.test(formData.fullName)) {
        errors.push("Name must be 2-50 characters long and contain only letters");
    }
    
    // Age validation
    const age = parseInt(formData.age);
    if (isNaN(age) || age < 16 || age > 30) {
        errors.push("Age must be between 16 and 30");
    }
    
    // Phone validation for Indian numbers
    if (!/^(\+91[\-\s]?)?[0]?(91)?[6789]\d{9}$/.test(formData.phone)) {
        errors.push("Please enter a valid Indian phone number");
    }
    
    return errors;
}

// Enhanced error handling for uploads
async function uploadImage(file) {
    try {
        // File validation
        if (!file.type.match('image.*')) {
            throw new Error('Invalid file type. Only images are allowed.');
        }
        
        if (file.size > 5 * 1024 * 1024) {
            throw new Error('File too large. Maximum size is 5MB.');
        }
        
        // Compress image if needed
        let compressedFile = file;
        if (file.size > 2 * 1024 * 1024) {
            compressedFile = await compressImage(file);
        }
        
        // Upload with progress tracking
        const formData = new FormData();
        formData.append('file', compressedFile);
        formData.append('uid', currentUser.uid);
        
        const response = await axios.post(`${BACKEND_URL}/upload`, formData, {
            onUploadProgress: (progressEvent) => {
                const progress = (progressEvent.loaded / progressEvent.total) * 100;
                updateProgressBar(progress);
            }
        });
        
        return response.data;
        
    } catch (error) {
        console.error('Upload failed:', error);
        throw new Error(`Upload failed: ${error.message}`);
    }
}

// Page Load Handler
window.addEventListener("load", () => {
    // Apply saved theme with smooth fade-in
    document.body.classList.add("fade-in");
    const savedTheme = localStorage.getItem("theme") || "light";
    document.body.setAttribute("data-theme", savedTheme);
    
    if (savedTheme === "dark") {
        document.getElementById("theme-toggle").classList.remove("fa-moon");
        document.getElementById("theme-toggle").classList.add("fa-sun");
    }
    
    // Initialize Three.js scene with delayed start for better loading performance
    setTimeout(() => {
        try {
            initThreeJS();
            document.body.classList.remove("fade-in");
        } catch (err) {
            console.error("Three.js initialization failed:", err);
            // Fallback to static background if Three.js fails
            document.getElementById("lotus-canvas").style.display = "none";
            document.getElementById("static-background").style.display = "block";
        }
    }, 300);
    
    // Initialize page scroll animations
    initScrollAnimations();
});

// Elegant Scroll Animations
function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('appear');
            }
        });
    }, { threshold: 0.2 });
    
    document.querySelectorAll('.animate-on-scroll').forEach(element => {
        observer.observe(element);
    });
}

// Enhanced tab switching with smooth transitions
const tabs = document.querySelectorAll(".tab");
tabs.forEach(tab => {
    tab.addEventListener("click", () => {
        const tabId = tab.getAttribute("data-tab");
        
        // Authentication check
        if (!currentUser && tabId !== "auth") {
            showNotification("Please authenticate first", "error");
            return;
        }
        
        // Registration check
        if (tabId === "upload" && !isRegistrationComplete) {
            showNotification("Please complete your registration first", "info");
            document.querySelector('[data-tab="registration"]').click();
            return;
        }
        
        // Animate tab change
        document.querySelectorAll(".tab-content").forEach(content => {
            if (content.classList.contains("active")) {
                content.classList.add("fade-out");
                setTimeout(() => {
                    content.classList.remove("active", "fade-out");
                    document.getElementById(`${tabId}-tab`).classList.add("active", "fade-in");
                    setTimeout(() => {
                        document.getElementById(`${tabId}-tab`).classList.remove("fade-in");
                    }, 500);
                }, 300);
            }
        });
        
        // Update tabs and stepper
        document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        updateStepper(tabId);
    });
});

// Apple-inspired notification system
function showNotification(message, type = "success") {
    // Remove any existing notification
    const existingNotification = document.querySelector(".notification");
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create new notification
    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">
                ${type === "success" ? '✓' : type === "error" ? '✕' : 'ℹ'}
            </span>
            <span class="notification-message">${message}</span>
        </div>
        <div class="notification-progress"></div>
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.classList.add("show");
        notification.querySelector(".notification-progress").style.animationPlayState = "running";
    }, 10);
    
    // Animate out after 4 seconds
    setTimeout(() => {
        notification.classList.remove("show");
        notification.classList.add("hide");
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 4000);
}

// Firebase Auth Functions
signUpBtn.addEventListener("click", function() {
    const email = emailInput.value;
    const password = passwordInput.value;
    
    if (!email || !password) {
        showNotification("Please enter both email and password", "error");
        return;
    }
    
    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            currentUser = userCredential.user;
            saveUserData(currentUser);
            showNotification("Account created successfully", "success");
        })
        .catch((error) => {
            console.error("Error signing up:", error);
            showNotification(`Sign up failed: ${error.message}`, "error");
        });
});

loginBtn.addEventListener("click", function() {
    const email = emailInput.value;
    const password = passwordInput.value;
    
    if (!email || !password) {
        showNotification("Please enter both email and password", "error");
        return;
    }
    
    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            currentUser = userCredential.user;
            showNotification("Logged in successfully", "success");
        })
        .catch((error) => {
            console.error("Error signing in:", error);
            showNotification(`Login failed: ${error.message}`, "error");
        });
});

googleBtn.addEventListener("click", function() {
    const provider = new GoogleAuthProvider();
    
    signInWithPopup(auth, provider)
        .then((result) => {
            currentUser = result.user;
            saveUserData(currentUser);
            showNotification("Signed in with Google successfully", "success");
        })
        .catch((error) => {
            console.error("Error signing in with Google:", error);
            showNotification(`Google sign-in failed: ${error.message}`, "error");
        });
});

logoutBtn.addEventListener("click", function() {
    signOut(auth)
        .then(() => {
            currentUser = null;
            userDataDiv.style.display = "none";
            document.getElementById("auth-success").style.display = "none";
            document.getElementById("auth-section").style.display = "block";
            document.querySelector('[data-tab="auth"]').click();
            showNotification("Logged out successfully", "success");
        })
        .catch((error) => {
            console.error("Error signing out:", error);
            showNotification(`Error signing out: ${error.message}`, "error");
        });
});

// File Upload Functions
fileInput.addEventListener("change", function(e) {
    const file = e.target.files[0];
    if (file) {
        // Validate file type and size
        if (!file.type.match('image.*')) {
            showNotification("Please select an image file", "error");
            fileInput.value = "";
            return;
        }
        
        if (file.size > 5 * 1024 * 1024) { // 5MB max
            showNotification("Image must be less than 5MB", "error");
            fileInput.value = "";
            return;
        }
        
        // Preview image
        selectedFileDisplay.textContent = file.name;
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.innerHTML = `<img src="${e.target.result}" class="preview-img">`;
            preview.style.display = "block";
        };
        reader.readAsDataURL(file);
        uploadBtn.disabled = false;
    }
});

uploadBtn.addEventListener("click", async function() {
    if (!fileInput.files[0]) {
        showNotification("Please select a file first", "error");
        return;
    }
    
    if (uploadedCount >= MAX_UPLOADS) {
        showNotification(`Maximum uploads (${MAX_UPLOADS}) reached`, "error");
        return;
    }
    
    // Create form data for upload
    const formData = new FormData();
    formData.append("file", fileInput.files[0]);
    formData.append("uid", currentUser.uid);
    
    uploadBtn.disabled = true;
    progressBar.style.display = "block";
    
    try {
        // Upload to backend
        const response = await fetch(`${BACKEND_URL}/upload`, {
            method: "POST",
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`Server returned ${response.status}: ${await response.text()}`);
        }
        
        const data = await response.json();
        
        // Save upload reference to database
        const uploadsRef = ref(db, `users/${currentUser.uid}/uploads`);
        const newUploadRef = push(uploadsRef);
        
        set(newUploadRef, {
            public_id: data.public_id,
            secure_url: data.secure_url,
            uploaded_at: Date.now()
        });
        
        showNotification("Upload successful!", "success");
        
        // Reset form
        fileInput.value = "";
        preview.style.display = "none";
        selectedFileDisplay.textContent = "No file selected";
        uploadBtn.disabled = true;
        
        // Update uploaded count (will happen via onValue listener)
    } catch (error) {
        console.error("Upload failed:", error);
        showNotification(`Upload failed: ${error.message}`, "error");
    } finally {
        progressBar.style.display = "none";
        progressFill.style.width = "0%";
    }
});

// Enhanced registration form data
function saveRegistrationData(formData) {
    const registrationData = {
        ...formData,
        personalQuestions: {
            recentFeeling: document.getElementById("recent-feeling").value,
            selfUnderstanding: document.getElementById("self-understanding").value,
            decisionMaking: document.getElementById("decision-making").value
        },
        submittedAt: new Date().toISOString()
    };

    return update(ref(db, `users/${currentUser.uid}`), {
        registration: registrationData
    });
}

// Show completion message after 15 photos
function showCompletionMessage() {
    const message = document.createElement('div');
    message.className = 'completion-message';
    message.innerHTML = `
        <div class="celebration-icon">🎉</div>
        <h2>Registration Complete!</h2>
        <p>Thank you for submitting your application for Miss Banaras 2024.</p>
        <p>Results will be announced on May 25th, 2024.</p>
        <p>We will contact shortlisted candidates via email and phone.</p>
    `;
    
    document.getElementById('uploadSection').appendChild(message);
    
    // Disable further uploads
    uploadBtn.disabled = true;
    fileInput.disabled = true;
    
    // Save completion status
    update(ref(db, `users/${currentUser.uid}`), {
        applicationStatus: 'completed',
        completedAt: new Date().toISOString()
    });
}

// Modify upload handler to check completion
window.uploadImages = async () => {
    // ...existing upload code...
    
    if (uploadedCount >= MAX_UPLOADS) {
        showCompletionMessage();
        return;
    }
    
    // ...rest of existing upload code...
};

// Registration Form Submit
registrationForm.addEventListener("submit", function(e) {
    e.preventDefault();
    
    if (!currentUser) {
        showNotification("Please log in first", "error");
        return;
    }
    
    const formData = {
        fullName: document.getElementById("fullName").value,
        age: document.getElementById("age").value,
        phone: document.getElementById("phone").value,
        city: document.getElementById("city").value,
        location: document.getElementById("location").value,
        bio: document.getElementById("bio").value,
        experience: document.getElementById("experience").value,
        talents: document.getElementById("talents").value
    };
    
    // Save registration data
    saveRegistrationData(formData)
    .then(() => {
        isRegistrationComplete = true;
        showNotification("Registration information saved successfully", "success");
        submittedDataDiv.style.display = "block";
        registrationForm.style.display = "none";
        nextToUploadBtn.style.display = "block";
        nextToUploadBtn.classList.add("pulse-animation");
    })
    .catch(error => {
        console.error("Error saving registration:", error);
        showNotification(`Failed to save registration: ${error.message}`, "error");
    });
});

// Edit Registration Button
editRegistrationBtn.addEventListener("click", function() {
    if (submittedDataDiv.style.display === "block") {
        submittedDataDiv.style.display = "none";
        registrationForm.style.display = "block";
        nextToUploadBtn.style.display = "none";
        hasEdited = true;
        
        // Update database to mark as edited
        update(ref(db, `users/${currentUser.uid}`), {
            hasEdited: true
        }).catch(error => {
            console.error("Error updating edit status:", error);
        });
    }
});

// Next to Upload Button
nextToUploadBtn.addEventListener("click", function() {
    document.querySelector('[data-tab="upload"]').click();
});

// Modal functions
window.openModal = function(imgSrc) {
    modalImg.src = imgSrc;
    imageModal.style.display = "flex";
    setTimeout(() => {
        imageModal.classList.add("show");
    }, 10);
};

document.getElementById("closeModal").addEventListener("click", function() {
    imageModal.classList.remove("show");
    setTimeout(() => {
        imageModal.style.display = "none";
    }, 300);
});

// Auth state listener
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        fetchUserData(user.uid);
    } else {
        currentUser = null;
        userDataDiv.style.display = "none";
        document.getElementById("auth-success").style.display = "none";
        document.getElementById("auth-section").style.display = "block";
        logoutBtn.style.display = "none";
    }
});

// Initialize UI
document.querySelector('[data-tab="auth"]').click();

// Preload animation for better performance
document.querySelectorAll('.preload-animation').forEach(element => {
    element.addEventListener('load', () => {
        element.classList.add('loaded');
    });
});

// Add dynamic scroll-to-top button
const scrollToTopBtn = document.createElement("button");
scrollToTopBtn.className = "scroll-to-top";
scrollToTopBtn.innerHTML = '<i class="fas fa-chevron-up"></i>';
document.body.appendChild(scrollToTopBtn);

scrollToTopBtn.addEventListener("click", () => {
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
});

// Show/hide scroll button based on scroll position
window.addEventListener("scroll", () => {
    if (window.scrollY > 300) {
        scrollToTopBtn.classList.add("visible");
    } else {
        scrollToTopBtn.classList.remove("visible");
    }
});

// Add accessibility enhancements
document.querySelectorAll('button, a, input, select, textarea').forEach(element => {
    if (!element.hasAttribute('tabindex')) {
        element.setAttribute('tabindex', '0');
    }
    
    if (element.tagName === 'BUTTON' && !element.getAttribute('aria-label')) {
        const text = element.textContent.trim();
        if (!text || text.length === 0) {
            const icon = element.querySelector('i');
            if (icon && icon.className) {
                const iconType = icon.className.split(' ')
                    .find(cls => cls.startsWith('fa-'))
                    ?.replace('fa-', '')
                    || 'button';
                element.setAttribute('aria-label', iconType);
            } else {
                element.setAttribute('aria-label', 'Button');
            }
        }
    }
});

// Add focus state animations
document.addEventListener('focusin', function(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
        e.target.classList.add('input-focus');
    }
});

document.addEventListener('focusout', function(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
        e.target.classList.remove('input-focus');
    }
});

// Performance optimizations
document.querySelectorAll('img').forEach(img => {
    if (!img.hasAttribute('loading')) {
        img.setAttribute('loading', 'lazy');
    }
    if (!img.hasAttribute('decoding')) {
        img.setAttribute('decoding', 'async');
    }
});

// Progressive enhancement for older browsers
if (!window.CSS || !CSS.supports('(transform: translateZ(0))')) {
    document.body.classList.add('no-transforms');
}

// Add a connection status indicator
function updateOnlineStatus() {
    const statusIndicator = document.createElement('div');
    statusIndicator.className = 'connection-status';
    
    if (navigator.onLine) {
        statusIndicator.classList.add('online');
        statusIndicator.innerHTML = '<i class="fas fa-wifi"></i> Connected';
        
        // Remove after 3 seconds
        setTimeout(() => {
            statusIndicator.classList.add('fade-out');
            setTimeout(() => statusIndicator.remove(), 500);
        }, 3000);
    } else {
        statusIndicator.classList.add('offline');
        statusIndicator.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Offline';
        document.body.appendChild(statusIndicator);
    }
    
    document.body.appendChild(statusIndicator);
}

window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);

// Add mobile navigation enhancements
const mobileNavToggle = document.createElement('button');
mobileNavToggle.className = 'mobile-nav-toggle';
mobileNavToggle.innerHTML = '<i class="fas fa-bars"></i>';
mobileNavToggle.setAttribute('aria-label', 'Toggle Navigation');
document.querySelector('.tabs').appendChild(mobileNavToggle);

mobileNavToggle.addEventListener('click', () => {
    document.querySelector('.tabs').classList.toggle('mobile-expanded');
});

// Add smooth page transitions
window.addEventListener('beforeunload', () => {
    document.body.classList.add('page-exit');
});

// Handle form validation with visual feedback
document.querySelectorAll('input, textarea, select').forEach(input => {
    input.addEventListener('invalid', (e) => {
        e.preventDefault();
        input.classList.add('input-error');
        
        const errorMessage = document.createElement('div');
        errorMessage.className = 'error-message';
        errorMessage.textContent = input.validationMessage;
        
        const existingError = input.parentElement.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        
        input.parentElement.appendChild(errorMessage);
    });
    
    input.addEventListener('input', () => {
        input.classList.remove('input-error');
        const errorMessage = input.parentElement.querySelector('.error-message');
        if (errorMessage) {
            errorMessage.remove();
        }
    });
});

// Add speech recognition for accessibility (if supported)
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    
    const voiceInputButtons = document.querySelectorAll('.voice-input');
    voiceInputButtons.forEach(button => {
        button.style.display = 'inline-flex';
        
        button.addEventListener('click', () => {
            const targetInput = document.getElementById(button.getAttribute('data-target'));
            if (!targetInput) return;
            
            button.classList.add('listening');
            recognition.start();
            
            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                targetInput.value = transcript;
                button.classList.remove('listening');
            };
            
            recognition.onerror = () => {
                button.classList.remove('listening');
                showNotification('Voice recognition failed', 'error');
            };
            
            recognition.onend = () => {
                button.classList.remove('listening');
            };
        });
    });
}

// Initialize page content with animation
document.querySelectorAll('.content-section').forEach((section, index) => {
    section.style.animationDelay = `${index * 0.1}s`;
    section.classList.add('animate-in');
});

// Add event delegator for dynamic elements
document.addEventListener('click', function(e) {
    // Handle dynamic gallery image clicks
    if (e.target.classList.contains('gallery-img')) {
        openModal(e.target.src);
    }
});