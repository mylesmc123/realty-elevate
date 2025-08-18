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
            console.log('Initializing map...');
            
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

    // Calculate marker size based on lot size (subtle variation)
    calculateMarkerSize(lotSize) {
        // Base size similar to default markers
        const baseSize = 12;
        const maxSize = 80;
        
        // Default size for properties without lot size (condos, etc.)
        if (!lotSize || lotSize <= 0) {
            return baseSize;
        }
        
        // Subtle size variation based on lot size
        const scaleFactor = Math.min(lotSize * 8, maxSize - baseSize);
        return Math.max(baseSize, Math.min(baseSize + scaleFactor, maxSize));
    }

    // Add property markers to the map
    addPropertyMarkers(properties) {
        console.log('addPropertyMarkers called with:', properties.length, 'properties');
        
        if (!this.isInitialized) {
            console.error('Map not initialized');
            return;
        }

        if (!properties || properties.length === 0) {
            console.log('No properties to add');
            return;
        }

        // Clear existing markers
        this.clearMarkers();

        // Add each property marker
        properties.forEach((property, index) => {
            console.log(`Adding property marker ${index + 1}/${properties.length}:`, property);
            this.addPropertyMarker(property);
        });

        // Fit map to show all markers
        this.fitBounds(properties);
    }

    // Add a single property marker
    addPropertyMarker(property) {
        try {
            console.log('Creating marker for property:', property.id, 'at coordinates:', property.coordinates);

            // Verify coordinates are valid
            if (!property.coordinates || property.coordinates.length !== 2) {
                console.error('Invalid coordinates for property:', property.id, property.coordinates);
                return;
            }

            // Calculate marker size based on lot size
            const markerSize = this.calculateMarkerSize(property.lotSize);
            console.log('Marker size for property', property.id, ':', markerSize);
            
            // Use elevation color if available, otherwise default blue
            const markerColor = property.elevationColor || '#2196F3';
            
            // Create marker element with very simple styling
            const markerElement = document.createElement('div');
            markerElement.className = 'property-marker';
            markerElement.style.cssText = `
                width: ${markerSize}px;
                height: ${markerSize}px;
                background-color: ${markerColor};
                border: 2px solid white;
                border-radius: 50%;
                cursor: pointer;
                box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                transition: box-shadow 0.2s ease, border-width 0.2s ease;
            `;

            // Add hover effect WITHOUT transform - use box-shadow and border instead
            markerElement.addEventListener('mouseenter', () => {
                markerElement.style.boxShadow = '0 4px 12px rgba(0,0,0,0.4)';
                markerElement.style.borderWidth = '3px';
            });

            markerElement.addEventListener('mouseleave', () => {
                markerElement.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
                markerElement.style.borderWidth = '2px';
            });

            // Create marker - CRUCIAL: pass options object with element
            const marker = new maplibregl.Marker({
                element: markerElement,
                anchor: 'center'
            })
                .setLngLat(property.coordinates)
                .addTo(this.map);

            console.log('Marker created and added to map for property:', property.id);

            // Add click handler for popup
            markerElement.addEventListener('click', () => {
                console.log('Marker clicked for property:', property.id);
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
            console.log('Showing popup for property:', property.id);

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
                    <div class="popup-lot-info">
                        <strong>Lot Size:</strong> ${property.lotSize ? `${property.lotSize} acres` : 'N/A'}
                    </div>
                    ${property.elevation !== null ? `
                        <div class="popup-elevation-info" style="color: ${property.elevationColor}; font-weight: bold; margin-top: 5px;">
                            <strong>⛰️ Elevation:</strong> ${window.elevationService ? window.elevationService.formatElevation(property.elevation) : 'N/A'}
                            ${property.relativeCityDiffElev !== undefined ? 
                                `<br><small>(${property.relativeCityDiffElev > 0 ? '+' : ''}${property.relativeCityDiffElev.toFixed(0)} ft from city center)</small>` 
                                : ''}
                        </div>
                    ` : ''}
                    <button class="popup-button" onclick="window.app.showPropertyModal('${property.id}')">
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
        console.log('Clearing', this.markers.length, 'markers');
        
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
            console.log('Fitting bounds for', properties.length, 'properties');
            
            const bounds = new maplibregl.LngLatBounds();
            
            properties.forEach(property => {
                if (property.coordinates && property.coordinates.length === 2) {
                    bounds.extend(property.coordinates);
                }
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