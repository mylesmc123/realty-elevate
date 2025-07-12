class RealtyApp {
    constructor() {
        this.api = new RealtyAPI();
        this.mapManager = new MapManager();
        this.properties = [];
        this.currentLocation = 'Austin, TX';
        this.filters = {};
        
        this.init();
    }

    // Initialize the application
    init() {
        console.log('Initializing Realty Elevate...');
        
        // Initialize map
        this.mapManager.initMap();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Load initial properties
        this.loadProperties();
        
        // Hide loading indicator initially
        this.hideLoading();
    }

    // Set up event listeners
    setupEventListeners() {
        // Search functionality
        const searchBtn = document.getElementById('searchBtn');
        const searchInput = document.getElementById('locationSearch');
        
        searchBtn.addEventListener('click', () => this.handleSearch());
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleSearch();
            }
        });

        // Filter functionality
        const applyFiltersBtn = document.getElementById('applyFilters');
        applyFiltersBtn.addEventListener('click', () => this.handleFilters());

        // Modal functionality
        const modal = document.getElementById('propertyModal');
        const closeBtn = document.querySelector('.close');
        
        closeBtn.addEventListener('click', () => this.hideModal());
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.hideModal();
            }
        });
    }

    // Handle search
    async handleSearch() {
        const searchInput = document.getElementById('locationSearch');
        const location = searchInput.value.trim();
        
        if (!location) {
            alert('Please enter a location');
            return;
        }

        this.currentLocation = location;
        await this.loadProperties();
    }

    // Handle filters
    async handleFilters() {
        this.filters = {
            minPrice: parseInt(document.getElementById('minPrice').value) || 0,
            maxPrice: parseInt(document.getElementById('maxPrice').value) || Number.MAX_SAFE_INTEGER,
            propertyType: document.getElementById('propertyType').value || '',
            bedrooms: parseInt(document.getElementById('bedrooms').value) || 0,
            bathrooms: parseInt(document.getElementById('bathrooms').value) || 0
        };

        await this.loadProperties();
    }

    // Load properties from API
    async loadProperties() {
        try {
            this.showLoading();
            
            const result = await this.api.getPropertiesByLocation(this.currentLocation, this.filters);
            
            if (result.success) {
                this.properties = result.properties;
                this.updatePropertyList();
                this.mapManager.addPropertyMarkers(this.properties);
                
                if (this.properties.length === 0) {
                    this.showNoResults();
                }
            } else {
                this.showError(result.error);
            }
        } catch (error) {
            console.error('Error loading properties:', error);
            this.showError('Failed to load properties. Please try again.');
        } finally {
            this.hideLoading();
        }
    }

    // Update property list in sidebar
    updatePropertyList() {
        const container = document.getElementById('propertyListContainer');
        const countElement = document.getElementById('propertyCount');
        
        countElement.textContent = this.properties.length;
        
        if (this.properties.length === 0) {
            container.innerHTML = '<div class="no-results"><p>No properties found matching your criteria.</p></div>';
            return;
        }

        container.innerHTML = this.properties.map(property => `
            <div class="property-card" onclick="window.app.highlightProperty(${property.id})">
                <div class="property-price">${this.api.formatPrice(property.price)}</div>
                <div class="property-address">${property.address}</div>
                <div class="property-details">
                    <span>${property.bedrooms} bed</span>
                    <span>${property.bathrooms} bath</span>
                    <span>${this.api.formatSqft(property.sqft)}</span>
                </div>
            </div>
        `).join('');
    }

    // Highlight property on map
    highlightProperty(propertyId) {
        this.mapManager.highlightProperty(propertyId);
    }

    // Show property modal
    async showPropertyModal(propertyId) {
        try {
            const result = await this.api.getPropertyById(propertyId);
            
            if (result.success) {
                const property = result.property;
                const modalContent = document.getElementById('modalContent');
                
                modalContent.innerHTML = `
                    <img src="${property.images[0]}" alt="Property" class="modal-property-image">
                    <div class="modal-property-price">${this.api.formatPrice(property.price)}</div>
                    <div class="modal-property-address">${property.address}</div>
                    <div class="modal-property-details">
                        <div class="detail-item">
                            <div class="detail-label">Bedrooms</div>
                            <div class="detail-value">${property.bedrooms}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Bathrooms</div>
                            <div class="detail-value">${property.bathrooms}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Square Feet</div>
                            <div class="detail-value">${this.api.formatSqft(property.sqft)}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Property Type</div>
                            <div class="detail-value">${property.propertyType.replace('_', ' ')}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Year Built</div>
                            <div class="detail-value">${property.yearBuilt}</div>
                        </div>
                        ${property.garage ? `
                            <div class="detail-item">
                                <div class="detail-label">Garage</div>
                                <div class="detail-value">${property.garage} cars</div>
                            </div>
                        ` : ''}
                    </div>
                    <p style="margin-top: 1rem; line-height: 1.6; color: #666;">
                        ${property.description}
                    </p>
                `;
                
                this.showModal();
            } else {
                this.showError(result.error);
            }
        } catch (error) {
            console.error('Error showing property modal:', error);
            this.showError('Failed to load property details');
        }
    }

    // Show modal
    showModal() {
        const modal = document.getElementById('propertyModal');
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    // Hide modal
    hideModal() {
        const modal = document.getElementById('propertyModal');
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    // Show loading indicator
    showLoading() {
        const loadingIndicator = document.getElementById('loadingIndicator');
        loadingIndicator.style.display = 'block';
    }

    // Hide loading indicator
    hideLoading() {
        const loadingIndicator = document.getElementById('loadingIndicator');
        loadingIndicator.style.display = 'none';
    }

    // Show error message
    showError(message) {
        const container = document.getElementById('propertyListContainer');
        container.innerHTML = `
            <div class="error-message">
                <h3>Error</h3>
                <p>${message}</p>
            </div>
        `;
    }

    // Show no results message
    showNoResults() {
        const container = document.getElementById('propertyListContainer');
        container.innerHTML = `
            <div class="no-results">
                <h3>No Properties Found</h3>
                <p>Try adjusting your search criteria or location.</p>
            </div>
        `;
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.api = new RealtyAPI();
    window.app = new RealtyApp();
});