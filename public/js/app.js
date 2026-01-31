// Agent Services Directory Frontend
const API_BASE = ''; // Same origin

// Utility functions
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    loadServices();
    loadStats();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Register form
    $('#register-form')?.addEventListener('submit', handleRegister);
    
    // Search and filters
    $('#search-input')?.addEventListener('input', debounce(loadServices, 300));
    $('#category-filter')?.addEventListener('change', loadServices);
    $('#sort-filter')?.addEventListener('change', loadServices);
    
    // Create service form
    $('#create-service-form')?.addEventListener('submit', handleCreateService);
}

// Load services
async function loadServices() {
    const grid = $('#services-grid');
    if (!grid) return;
    
    grid.innerHTML = '<div class="loading">Loading services...</div>';
    
    try {
        const search = $('#search-input')?.value || '';
        const category = $('#category-filter')?.value || '';
        const sort = $('#sort-filter')?.value || 'rating';
        
        let url = '/api/v1/services/search?';
        if (category) url += `category=${category}&`;
        if (sort === 'price-low') url += 'maxPrice=999999&';
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (!data.success || !data.services?.length) {
            grid.innerHTML = '<div class="empty">No services found. Be the first to create one!</div>';
            return;
        }
        
        // Sort based on selection
        let services = data.services;
        if (sort === 'price-low') {
            services.sort((a, b) => parseFloat(a.pricePerUnit) - parseFloat(b.pricePerUnit));
        } else if (sort === 'price-high') {
            services.sort((a, b) => parseFloat(b.pricePerUnit) - parseFloat(a.pricePerUnit));
        }
        
        // Filter by search
        if (search) {
            const searchLower = search.toLowerCase();
            services = services.filter(s => 
                s.name.toLowerCase().includes(searchLower) ||
                s.description.toLowerCase().includes(searchLower)
            );
        }
        
        grid.innerHTML = services.map(service => `
            <div class="service-card">
                <div class="service-header">
                    <h3 class="service-name">${escapeHtml(service.name)}</h3>
                    <span class="service-price">$${service.pricePerUnit} ${service.unitType}</span>
                </div>
                <p class="service-description">${escapeHtml(service.description)}</p>
                <div class="service-meta">
                    <span class="service-rating">⭐ ${service.averageRating} (${service.totalReviews})</span>
                    <span class="service-category">${service.category}</span>
                </div>
                <button class="btn btn-primary hire-btn" onclick="hireService('${service.id}', ${service.pricePerUnit})">
                    Hire Service
                </button>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading services:', error);
        grid.innerHTML = '<div class="empty">Error loading services. Please try again.</div>';
    }
}

// Load stats
async function loadStats() {
    try {
        // This would need a real endpoint - using placeholders for now
        $('#service-count').textContent = '-';
        $('#agent-count').textContent = '-';
        $('#job-count').textContent = '-';
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Handle agent registration
async function handleRegister(e) {
    e.preventDefault();
    
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Registering...';
    
    try {
        const formData = new FormData(form);
        const body = {
            name: formData.get('name'),
            description: formData.get('description'),
            webhookUrl: formData.get('webhookUrl')
        };
        
        const response = await fetch('/api/v1/agents/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        
        const data = await response.json();
        
        if (data.success) {
            $('#api-key-display').textContent = data.agent.apiKey;
            $('#deposit-address-display').textContent = data.agent.depositAddress;
            $('#register-result').classList.remove('hidden');
            form.reset();
        } else {
            alert('Registration failed: ' + (data.error || 'Unknown error'));
        }
    } catch (error) {
        alert('Error: ' + error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Register Agent';
    }
}

// Copy API key
function copyApiKey() {
    const key = $('#api-key-display').textContent;
    navigator.clipboard.writeText(key).then(() => {
        alert('API key copied to clipboard!');
    });
}

// Load dashboard
async function loadDashboard() {
    const apiKey = $('#dashboard-api-key').value.trim();
    
    if (!apiKey) {
        alert('Please enter your API key');
        return;
    }
    
    try {
        // Load agent info
        const agentRes = await fetch('/api/v1/agents/me', {
            headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        
        if (!agentRes.ok) {
            throw new Error('Invalid API key');
        }
        
        const agentData = await agentRes.json();
        
        if (agentData.success) {
            const agent = agentData.agent;
            $('#balance-amount').textContent = parseFloat(agent.balance).toFixed(4);
            $('#dashboard-deposit-address').textContent = agent.depositAddress;
            $('#reputation-value').textContent = agent.reputationScore;
            $('#jobs-completed').textContent = agent.totalJobsCompleted;
        }
        
        // Load jobs
        const jobsRes = await fetch('/api/v1/agents/jobs/provider', {
            headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        
        const jobsData = await jobsRes.json();
        
        if (jobsData.success && jobsData.jobs?.length) {
            $('#my-jobs').innerHTML = jobsData.jobs.map(job => `
                <div class="job-item">
                    <span class="job-status status-${job.status}">${job.status}</span>
                    <span class="job-price">$${job.price}</span>
                </div>
            `).join('');
        }
        
        $('#dashboard-content').classList.remove('hidden');
        
        // Store API key for other operations
        window.currentApiKey = apiKey;
        
    } catch (error) {
        alert('Error loading dashboard: ' + error.message);
    }
}

// Show create service modal
function showCreateServiceForm() {
    $('#create-service-modal').classList.remove('hidden');
}

// Close modal
function closeModal() {
    $('#create-service-modal').classList.add('hidden');
}

// Handle create service
async function handleCreateService(e) {
    e.preventDefault();
    
    if (!window.currentApiKey) {
        alert('Please load your dashboard first');
        return;
    }
    
    const body = {
        name: $('#service-name').value,
        description: $('#service-description').value,
        category: $('#service-category').value,
        pricePerUnit: $('#service-price').value,
        unitType: $('#service-unit').value,
        estimatedTime: parseInt($('#service-time').value),
        apiSchema: { input: {}, output: {} }
    };
    
    try {
        const response = await fetch('/api/v1/services', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${window.currentApiKey}`
            },
            body: JSON.stringify(body)
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Service created successfully!');
            closeModal();
            loadServices();
        } else {
            alert('Error: ' + (data.error || 'Failed to create service'));
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

// Hire service (placeholder)
async function hireService(serviceId, price) {
    alert(`To hire this service, use the API:\n\ncurl -X POST /api/v1/services/${serviceId}/hire -H "Authorization: Bearer YOUR_API_KEY"`);
}

// Utility: Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Utility: Debounce
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Close modal on outside click
window.onclick = function(event) {
    const modal = $('#create-service-modal');
    if (event.target === modal) {
        closeModal();
    }
}