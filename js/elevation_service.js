class ElevationService {
    constructor() {
        this.baseURL = 'https://api.open-elevation.com/api/v1';
        this.cache = new Map(); // Cache to avoid duplicate API calls
    }

    // Get elevation for a single coordinate
    async getElevation(lat, lng) {
        const key = `${lat.toFixed(6)},${lng.toFixed(6)}`;
        
        // Check cache first
        if (this.cache.has(key)) {
            return this.cache.get(key);
        }

        try {
            const response = await fetch(`${this.baseURL}/lookup?locations=${lat},${lng}`);
            const data = await response.json();
            
            if (data.results && data.results.length > 0) {
                const elevation = data.results[0].elevation;
                this.cache.set(key, elevation);
                return elevation;
            }
            
            throw new Error('No elevation data found');
        } catch (error) {
            console.error('Error fetching elevation:', error);
            return null;
        }
    }

    // Get elevations for multiple coordinates (batch request)
    async getElevations(coordinates) {
        try {
            // Format coordinates for the API
            const locations = coordinates.map(coord => `${coord.lat},${coord.lng}`).join('|');
            
            const response = await fetch(`${this.baseURL}/lookup?locations=${locations}`);
            const data = await response.json();
            
            if (data.results) {
                // Cache the results
                data.results.forEach((result, index) => {
                    const coord = coordinates[index];
                    const key = `${coord.lat.toFixed(6)},${coord.lng.toFixed(6)}`;
                    this.cache.set(key, result.elevation);
                });
                
                return data.results.map(result => result.elevation);
            }
            
            throw new Error('No elevation data found');
        } catch (error) {
            console.error('Error fetching elevations:', error);
            return coordinates.map(() => null);
        }
    }

    // Get city center coordinates (simplified - you might want to use a geocoding service for more accuracy)
    getCityCenter(city, state) {
        // This is a simplified implementation. In production, you'd use a geocoding service
        const cityCenters = {
            'Austin, TX': { lat: 30.2672, lng: -97.7431 },
            'Houston, TX': { lat: 29.7604, lng: -95.3698 },
            'Dallas, TX': { lat: 32.7767, lng: -96.7970 },
            'San Antonio, TX': { lat: 29.4241, lng: -98.4936 }
        };
        
        const key = `${city}, ${state}`;
        return cityCenters[key] || cityCenters['Austin, TX']; // Default to Austin
    }

    // Get elevation color based on relative elevation difference
    getElevationColor(relativeDiff) {
        // Terrain color scheme: blue (low) -> green -> yellow -> orange -> red (high)
        // Normalize the difference to a 0-1 scale (assuming max diff of ±200 feet)
        const maxDiff = 200; // feet
        const normalized = Math.max(-1, Math.min(1, relativeDiff / maxDiff));
        
        // Convert to 0-1 scale where 0.5 is neutral (same as city center)
        const colorValue = (normalized + 1) / 2;
        
        if (colorValue < 0.2) {
            // Deep blue for very low elevations
            return '#0066CC';
        } else if (colorValue < 0.4) {
            // Light blue for low elevations
            return '#3399FF';
        } else if (colorValue < 0.6) {
            // Green for neutral elevations
            return '#00CC66';
        } else if (colorValue < 0.8) {
            // Yellow-orange for moderate elevations
            return '#FF9900';
        } else {
            // Red for high elevations
            return '#CC0000';
        }
    }

    // Format elevation for display
    formatElevation(elevation) {
        if (elevation === null || elevation === undefined) {
            return 'N/A';
        }
        
        // Convert meters to feet and round to nearest foot
        const feet = Math.round(elevation * 3.28084);
        return `${feet.toLocaleString()} ft`;
    }
}

// Export for use in other files
window.ElevationService = ElevationService;
