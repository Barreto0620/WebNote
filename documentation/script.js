// Initialize Mermaid
mermaid.initialize({ 
    startOnLoad: true,
    theme: document.body.classList.contains('dark') ? 'dark' : 'default',
    securityLevel: 'loose'
});

// Theme Management
function toggleTheme() {
    const body = document.body;
    const themeIcon = document.getElementById('theme-icon');
    const themeText = document.getElementById('theme-text');
    
    body.classList.toggle('dark');
    const isDark = body.classList.contains('dark');
    
    // Update button
    themeIcon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
    themeText.textContent = isDark ? 'Light' : 'Dark';
    
    // Save preference
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    
    // Update Mermaid theme
    setTimeout(() => updateMermaidTheme(), 100);
}

function updateMermaidTheme() {
    const isDark = document.body.classList.contains('dark');
    mermaid.initialize({ 
        startOnLoad: true,
        theme: isDark ? 'dark' : 'default',
        securityLevel: 'loose'
    });
    
    // Re-render diagrams
    document.querySelectorAll('.mermaid').forEach((element, index) => {
        if (element.getAttribute('data-processed') === 'true') {
            const graphDefinition = element.getAttribute('data-original') || element.textContent;
            element.innerHTML = graphDefinition;
            element.removeAttribute('data-processed');
        }
    });
    
    mermaid.init();
}

// Mobile Menu Management
function toggleMobileMenu() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.querySelector('.mobile-overlay');
    const body = document.body;
    
    sidebar.classList.toggle('open');
    overlay.classList.toggle('active');
    body.style.overflow = sidebar.classList.contains('open') ? 'hidden' : '';
}

function closeMobileMenu() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.querySelector('.mobile-overlay');
    const body = document.body;
    
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
    body.style.overflow = '';
}

// Navigation Management
function updateActiveNavigation() {
    const sections = document.querySelectorAll('.section');
    const navLinks = document.querySelectorAll('.nav-link');
    let current = 'intro';
    
    const offset = window.innerHeight / 3;
    
    sections.forEach(section => {
        const rect = section.getBoundingClientRect();
        if (rect.top <= offset && rect.bottom >= offset) {
            current = section.id;
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
}

// Smooth scrolling for navigation links
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href').substring(1);
        const targetSection = document.getElementById(targetId);
        
        if (targetSection) {
            const headerHeight = document.querySelector('.header').offsetHeight;
            const offsetTop = targetSection.offsetTop - headerHeight - 20;
            
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    });
});

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    // Load saved theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark');
        document.getElementById('theme-icon').className = 'fas fa-sun';
        document.getElementById('theme-text').textContent = 'Light';
    }
    
    // Store original mermaid content
    document.querySelectorAll('.mermaid').forEach(element => {
        element.setAttribute('data-original', element.textContent);
    });
    
    updateActiveNavigation();
    updateMermaidTheme();
});

// Scroll event with throttling
let scrollTimeout;
window.addEventListener('scroll', () => {
    if (scrollTimeout) {
        clearTimeout(scrollTimeout);
    }
    scrollTimeout = setTimeout(updateActiveNavigation, 10);
});

// Handle resize
window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
        closeMobileMenu();
    }
});

// Close mobile menu on escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeMobileMenu();
    }
});