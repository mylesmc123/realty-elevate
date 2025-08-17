class RealtyApp {
    constructor() {
        this.realty_api = new RealtyAPI();
        this.mapManager = new MapManager();
        this.elevationService = new ElevationService();
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

    // Add elevation data to properties
    async addElevationData() {
        if (!this.properties || this.properties.length === 0) {
            return;
        }

        try {
            console.log('Adding elevation data to properties...');
            
            // Prepare coordinates for batch elevation lookup
            const coordinates = this.properties.map(property => ({
                lat: property.coordinates[1], // MapLibre uses [lng, lat] format
                lng: property.coordinates[0]
            }));

            // Get elevations for all properties
            const elevations = await this.elevationService.getElevations(coordinates);
            
            // Get city center coordinates and elevation
            const [city, state] = this.currentLocation.split(', ');
            const cityCenter = this.elevationService.getCityCenter(city, state);
            const cityCenterElevation = await this.elevationService.getElevation(cityCenter.lat, cityCenter.lng);
            
            console.log(`City center elevation for ${this.currentLocation}:`, cityCenterElevation);

            // Add elevation data to each property
            this.properties.forEach((property, index) => {
                const elevation = elevations[index];
                property.elevation = elevation;
                
                if (elevation !== null && cityCenterElevation !== null) {
                    // Convert to feet and calculate difference
                    const elevationFeet = elevation * 3.28084;
                    const cityCenterFeet = cityCenterElevation * 3.28084;
                    property.relativeCityDiffElev = elevationFeet - cityCenterFeet;
                    property.elevationColor = this.elevationService.getElevationColor(property.relativeCityDiffElev);
                } else {
                    property.relativeCityDiffElev = 0;
                    property.elevationColor = '#00CC66'; // Default green
                }
                
                console.log(`Property ${property.id}: elevation=${this.elevationService.formatElevation(elevation)}, relative diff=${property.relativeCityDiffElev?.toFixed(1)} ft`);
            });

        } catch (error) {
            console.error('Error adding elevation data:', error);
            // Don't fail the entire process if elevation data fails
        }
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
            console.log('Loading properties for:', this.currentLocation);
            console.log('Filters:', this.filters);
            
            this.showLoading();
            
            const result = await this.realty_api.getPropertiesByLocation(this.currentLocation, this.filters);
            
            console.log('API Result:', result);
            
            if (result.success) {
                this.properties = result.properties;
                console.log('Properties loaded:', this.properties.length);
                
                // Add elevation data to properties
                await this.addElevationData();
                
                this.updatePropertyList();
                
                // Add markers to map
                console.log('Adding markers to map...');
                this.mapManager.addPropertyMarkers(this.properties);
                
                if (this.properties.length === 0) {
                    this.showNoResults();
                }
            } else {
                console.error('API Error:', result.error);
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
                <div class="property-price">${this.realty_api.formatPrice(property.price)}</div>
                <div class="property-address">${property.address}</div>
                <div class="property-details">
                    <span>${property.bedrooms} bed</span>
                    <span>${property.bathrooms} bath</span>
                    <span>${this.realty_api.formatSqft(property.sqft)}</span>
                </div>
                ${property.elevation !== null ? `
                    <div class="property-elevation" style="color: ${property.elevationColor}; font-weight: bold;">
                        ⛰️ ${this.elevationService.formatElevation(property.elevation)}
                        ${property.relativeCityDiffElev !== undefined ? 
                            `(${property.relativeCityDiffElev > 0 ? '+' : ''}${property.relativeCityDiffElev.toFixed(0)} ft from city center)` 
                            : ''}
                    </div>
                ` : ''}
            </div>
        `).join('');
    }

    // Highlight property on map
    highlightProperty(propertyId) {
        console.log('Highlighting property:', propertyId);
        this.mapManager.highlightProperty(propertyId);
    }

    // Show property modal
    async showPropertyModal(propertyId) {
        try {
            console.log('Showing modal for property:', propertyId);
            
            const result = await this.realty_api.getPropertyById(propertyId);
            
            if (result.success) {
                const property = result.property;
                const modalContent = document.getElementById('modalContent');
                
                modalContent.innerHTML = `
                    <img src="${property.images[0]}" alt="Property" class="modal-property-image">
                    <div class="modal-property-price">${this.realty_api.formatPrice(property.price)}</div>
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
                            <div class="detail-value">${this.realty_api.formatSqft(property.sqft)}</div>
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
                        ${property.elevation !== null ? `
                            <div class="detail-item">
                                <div class="detail-label">Elevation</div>
                                <div class="detail-value" style="color: ${property.elevationColor}; font-weight: bold;">
                                    ${this.elevationService.formatElevation(property.elevation)}
                                </div>
                            </div>
                            ${property.relativeCityDiffElev !== undefined ? `
                                <div class="detail-item">
                                    <div class="detail-label">Relative to City Center</div>
                                    <div class="detail-value" style="color: ${property.elevationColor}; font-weight: bold;">
                                        ${property.relativeCityDiffElev > 0 ? '+' : ''}${property.relativeCityDiffElev.toFixed(0)} ft
                                    </div>
                                </div>
                            ` : ''}
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
    console.log('DOM loaded, initializing app...');
    window.api = new RealtyAPI();
    window.elevationService = new ElevationService();
    window.app = new RealtyApp();
});