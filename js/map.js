class MapManager {
    constructor() {
        this.map = null;
        this.markers = [];
        this.popup = null;
        this.isInitialized = false;
    }

    // Initialize the map
    initMap() {
        try {
            // Initialize MapLibre GL JS map
            this.map = new maplibregl.Map({
                container: 'map',
                style: {
                    version: 8,
                    sources: {
                        'raster-tiles': {
                            type: 'raster',
                            tiles: [
                                'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
                            ],
                            tileSize: 256,
                            attribution: '© OpenStreetMap contributors'
                        }
                    },
                    layers: [
                        {
                            id: 'simple-tiles',
                            type: 'raster',
                            source: 'raster-tiles',
                            minzoom: 0,
                            maxzoom: 22
                        }
                    ]
                },
                center: [-97.7431, 30.2672], // Austin, TX
                zoom: 11,
                pitch: 0,
                bearing: 0
            });

            // Add navigation controls
            this.map.addControl(new maplibregl.NavigationControl(), 'top-right');

            // Add fullscreen control
            this.map.addControl(new maplibregl.FullscreenControl(), 'top-right');

            // Add geolocate control
            this.map.addControl(new maplibregl.GeolocateControl({
                positionOptions: {
                    enableHighAccuracy: true
                },
                trackUserLocation: true
            }), 'top-right');

            this.isInitialized = true;
            console.log('Map initialized successfully');

        } catch (error) {
            console.error('Error initializing map:', error);
            this.showError('Failed to initialize map. Please refresh the page.');
        }
    }

    // Add property markers to the map
    addPropertyMarkers(properties) {
        if (!this.isInitialized) {
            console.error('Map not initialized');
            return;
        }

        // Clear existing markers
        this.clearMarkers();

        properties.forEach(property => {
            this.addPropertyMarker(property);
        });

        // Fit map to show all markers
        if (properties.length > 0) {
            this.fitBounds(properties);
        }
    }

    // Add a single property marker
    addPropertyMarker(property) {
        try {
            // Create marker element
            const markerElement = document.createElement('div');
            markerElement.className = 'property-marker';
            markerElement.innerHTML = `
                <div class="marker-content">
                    <div class="marker-price">${window.api.formatPrice(property.price)}</div>
                    <div class="marker-beds">${property.bedrooms}br</div>
                </div>
            `;

            // Add custom marker styles
            markerElement.style.cssText = `
                background: white;
                border: 2px solid #667eea;
                border-radius: 8px;
                padding: 8px;
                font-size: 12px;
                font-weight: bold;
                color: #333;
                cursor: pointer;
                box-shadow: 0 2px 10px rgba(0,0,0,0.2);
                transition: all 0.2s ease;
                min-width: 80px;
                text-align: center;
            `;

            // Add hover effects
            markerElement.addEventListener('mouseenter', () => {
                markerElement.style.transform = 'scale(1.1)';
                markerElement.style.zIndex = '1000';
            });

            markerElement.addEventListener('mouseleave', () => {
                markerElement.style.transform = 'scale(1)';
                markerElement.style.zIndex = '1';
            });

            // Create marker
            const marker = new maplibregl.Marker(markerElement)
                .setLngLat(property.coordinates)
                .addTo(this.map);

            // Add click handler
            markerElement.addEventListener('click', () => {
                this.showPropertyPopup(property);
            });

            // Store marker reference
            this.markers.push({
                marker: marker,
                property: property
            });

        } catch (error) {
            console.error('Error adding property marker:', error);
        }
    }

    // Show property popup
    showPropertyPopup(property) {
        try {
            // Create popup content
            const popupContent = `
                <div class="popup-content">
                    <div class="popup-price">${window.api.formatPrice(property.price)}</div>
                    <div class="popup-address">${property.address}</div>
                    <div class="popup-details">
                        <span>${property.bedrooms} bed</span>
                        <span>${property.bathrooms} bath</span>
                        <span>${window.api.formatSqft(property.sqft)}</span>
                    </div>
                    <button class="popup-button" onclick="window.app.showPropertyModal(${property.id})">
                        View Details
                    </button>
                </div>
            `;

            // Remove existing popup
            if (this.popup) {
                this.popup.remove();
            }

            // Create new popup
            this.popup = new maplibregl.Popup({
                closeButton: true,
                closeOnClick: false,
                maxWidth: '300px'
            })
                .setLngLat(property.coordinates)
                .setHTML(popupContent)
                .addTo(this.map);

        } catch (error) {
            console.error('Error showing property popup:', error);
        }
    }

    // Clear all markers
    clearMarkers() {
        this.markers.forEach(({ marker }) => {
            marker.remove();
        });
        this.markers = [];

        // Close popup if open
        if (this.popup) {
            this.popup.remove();
            this.popup = null;
        }
    }

    // Fit map bounds to show all properties
    fitBounds(properties) {
        if (!properties || properties.length === 0) return;

        try {
            const bounds = new maplibregl.LngLatBounds();
            
            properties.forEach(property => {
                bounds.extend(property.coordinates);
            });

            this.map.fitBounds(bounds, {
                padding: 50,
                maxZoom: 15
            });
        } catch (error) {
            console.error('Error fitting bounds:', error);
        }
    }

    // Center map on coordinates
    centerMap(coordinates, zoom = 12) {
        if (!this.isInitialized) return;

        try {
            this.map.flyTo({
                center: coordinates,
                zoom: zoom,
                duration: 1000
            });
        } catch (error) {
            console.error('Error centering map:', error);
        }
    }

    // Show error message
    showError(message) {
        const mapContainer = document.getElementById('map');
        mapContainer.innerHTML = `
            <div class="error-message">
                <h3>Map Error</h3>
                <p>${message}</p>
            </div>
        `;
    }

    // Highlight property marker
    highlightProperty(propertyId) {
        const markerData = this.markers.find(m => m.property.id === propertyId);
        if (markerData) {
            // Center map on property
            this.centerMap(markerData.property.coordinates, 15);
            
            // Show popup
            this.showPropertyPopup(markerData.property);
        }
    }
}

// Export for use in other files
window.MapManager = MapManager;