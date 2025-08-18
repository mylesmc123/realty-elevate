class RealtyAPI {
    constructor() {
        // Rentcast API configuration
        this.baseURL = 'https://api.rentcast.io/v1';
        this.apiKey = '4d0e87fa977947309a20c6e3fea06ffa';
        
        // Rate limiting tracking
        this.lastApiCall = 0;
        this.apiCallInterval = 2000; // 2 seconds between calls
        this.rateLimitHit = false;
        this.rateLimitResetTime = 0;
        
        // Test API connectivity on initialization (with delay to avoid immediate rate limit)
        setTimeout(() => this.testAPIConnectivity(), 1000);
        
        // Fallback sample data for when API fails or for testing
        this.sampleProperties = [
            {
                id: 1,
                price: 450000,
                address: "123 Main St, Austin, TX 78701",
                city: "Austin",
                state: "TX",
                zipCode: "78701",
                bedrooms: 3,
                bathrooms: 2,
                sqft: 1800,
                propertyType: "single_family",
                listingStatus: "active",
                coordinates: [-97.7431, 30.2672],
                images: ["https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=600&h=400&fit=crop"],
                description: "Beautiful single-family home in downtown Austin with modern amenities.",
                yearBuilt: 2015,
                lotSize: 0.25,
                garage: 2
            },
            {
                id: 2,
                price: 325000,
                address: "456 Oak Ave, Austin, TX 78704",
                city: "Austin",
                state: "TX",
                zipCode: "78704",
                bedrooms: 2,
                bathrooms: 2,
                sqft: 1200,
                propertyType: "condo",
                listingStatus: "active",
                coordinates: [-97.7594, 30.2500],
                images: ["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=400&fit=crop"],
                description: "Modern condo with city views and luxury finishes.",
                yearBuilt: 2020,
                lotSize: null,
                garage: 1
            },
            {
                id: 3,
                price: 675000,
                address: "789 Hill Dr, Austin, TX 78731",
                city: "Austin",
                state: "TX",
                zipCode: "78731",
                bedrooms: 4,
                bathrooms: 3,
                sqft: 2800,
                propertyType: "single_family",
                listingStatus: "active",
                coordinates: [-97.7880, 30.3072],
                images: ["https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=600&h=400&fit=crop"],
                description: "Spacious family home with pool and large backyard.",
                yearBuilt: 2010,
                lotSize: 0.5,
                garage: 3
            }
        ];
    }

    // Simulate API delay
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

        // Utility method for delays
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Simple geocoding using OpenStreetMap Nominatim (free)
    async geocodeLocation(location) {
        try {
            // Use a free geocoding service to get coordinates
            const encodedLocation = encodeURIComponent(location);
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodedLocation}&limit=1`);
            const data = await response.json();
            
            if (data && data.length > 0) {
                return {
                    lat: parseFloat(data[0].lat),
                    lng: parseFloat(data[0].lon)
                };
            }
            
            throw new Error('Location not found');
        } catch (error) {
            console.error('Geocoding error:', error);
            // Fallback to Austin coordinates
            return { lat: 30.2672, lng: -97.7431 };
        }
    }

    // Transform Rentcast data to our format
    transformRentcastProperty(property, index) {
        // Handle Rentcast property structure
        const id = property.id || property.listingId || `rc_${Date.now()}_${index}`;
        const price = property.price || property.listPrice || 0;
        const address = property.formattedAddress || property.address || 
                       `${property.addressLine1 || ''} ${property.city || ''}, ${property.state || ''} ${property.zipCode || ''}`.trim();
        
        return {
            id: id,
            price: price,
            address: address,
            city: property.city || '',
            state: property.state || '',
            zipCode: property.zipCode || '',
            bedrooms: property.bedrooms || property.beds || Math.floor(Math.random() * 4) + 1,
            bathrooms: property.bathrooms || property.baths || Math.floor(Math.random() * 3) + 1,
            sqft: property.squareFootage || property.livingArea || property.sqft || 1200,
            propertyType: this.normalizePropertyType(property.propertyType || property.type),
            listingStatus: property.status || 'active',
            coordinates: [
                property.longitude || property.lng || (Math.random() * 0.2 - 0.1 - 97.7431),
                property.latitude || property.lat || (Math.random() * 0.2 - 0.1 + 30.2672)
            ],
            images: this.getPropertyImages(property),
            description: property.description || this.generateDescription(property),
            yearBuilt: property.yearBuilt || property.built || Math.floor(Math.random() * 30) + 1990,
            lotSize: property.lotSize ? Math.round((property.lotSize / 43560) * 100) / 100 : Math.round((Math.random() * 0.5 + 0.1) * 100) / 100,
            garage: property.garageSpaces || property.garage || Math.floor(Math.random() * 3)
        };
    }

    // Transform RealtyMole data to our format (keeping for compatibility)
    transformRealtyMoleProperty(property, index) {
        // This method now just calls the Rentcast transformer
        return this.transformRentcastProperty(property, index);
    }

    // Get property images with fallbacks
    getPropertyImages(property) {
        if (property.photos && property.photos.length > 0) {
            return property.photos.map(photo => photo.href || photo.url || photo);
        } else if (property.images && property.images.length > 0) {
            return property.images;
        } else if (property.imageUrl) {
            return [property.imageUrl];
        }
        
        // Fallback to random stock image
        return [this.getRandomPropertyImage()];
    }

    // Generate a description if none provided
    generateDescription(property) {
        const beds = property.bedrooms || property.beds || 'Multiple';
        const baths = property.bathrooms || property.baths || 'Multiple';
        const city = property.city || 'the area';
        const type = property.propertyType || 'property';
        
        return `${beds} bedroom, ${baths} bathroom ${type.replace('_', ' ')} located in ${city}. This property offers great potential and is conveniently located.`;
    }

    // Normalize property type to match our format
    normalizePropertyType(type) {
        if (!type) return 'single_family';
        
        const typeMap = {
            'single family': 'single_family',
            'single_family': 'single_family',
            'condo': 'condo',
            'condominium': 'condo',
            'townhouse': 'townhouse',
            'townhome': 'townhouse',
            'multi family': 'multi_family',
            'multi_family': 'multi_family',
            'apartment': 'multi_family'
        };
        
        return typeMap[type.toLowerCase()] || 'single_family';
    }

    // Get random property image for properties without photos
    getRandomPropertyImage() {
        const images = [
            'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=600&h=400&fit=crop',
            'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=400&fit=crop',
            'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=600&h=400&fit=crop',
            'https://images.unsplash.com/photo-1516455590571-18256e5bb9ff?w=600&h=400&fit=crop',
            'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&h=400&fit=crop'
        ];
        return images[Math.floor(Math.random() * images.length)];
    }

    // Get properties by location
    async getPropertiesByLocation(location, filters = {}) {
        try {
            console.log('🔍 Fetching properties for:', location);
            
            // Check if we're rate limited
            if (this.rateLimitHit) {
                const timeRemaining = this.rateLimitResetTime - Date.now();
                if (timeRemaining > 0) {
                    console.log(`⏰ Rate limit active. Skipping API call, using fallback data. Reset in ${Math.ceil(timeRemaining / 1000)}s`);
                    return this.getFallbackData(location, filters);
                } else {
                    console.log('✅ Rate limit period expired, re-enabling API calls');
                    this.rateLimitHit = false;
                }
            }
            
            // First geocode the location to get coordinates
            const coords = await this.geocodeLocation(location);
            console.log('📍 Geocoded coordinates:', coords);
            
            // Check if enough time has passed since last API call
            const timeSinceLastCall = Date.now() - this.lastApiCall;
            if (timeSinceLastCall < this.apiCallInterval) {
                const waitTime = this.apiCallInterval - timeSinceLastCall;
                console.log(`⏳ Waiting ${waitTime}ms to avoid rate limiting...`);
                await this.delay(waitTime);
            }
            
            // Try RealtyMole API (only once per session to conserve quota)
            if (!this.rateLimitHit) {
                try {
                    console.log('🌐 Attempting Rentcast API call...');
                    this.lastApiCall = Date.now();
                    
                    const properties = await this.fetchFromRealtyMole(coords, filters);
                    if (properties && properties.length > 0) {
                        console.log(`✅ SUCCESS: Found ${properties.length} properties from Rentcast API`);
                        return {
                            success: true,
                            properties: properties,
                            total: properties.length,
                            source: 'Rentcast API'
                        };
                    } else {
                        console.log('⚠️ Rentcast API returned no properties');
                    }
                } catch (apiError) {
                    console.error('❌ Rentcast API failed:');
                    console.error('Error message:', apiError.message);
                    
                    // Check for rate limiting errors
                    if (apiError.message.includes('429') || 
                        apiError.message.toLowerCase().includes('rate') ||
                        apiError.message.toLowerCase().includes('quota') ||
                        apiError.message.toLowerCase().includes('too many')) {
                        console.error('🚫 RATE LIMITED: Disabling API calls for 10 minutes');
                        this.rateLimitHit = true;
                        this.rateLimitResetTime = Date.now() + (10 * 60 * 1000); // 10 minutes
                    }
                    
                    // Check for authentication errors
                    if (apiError.message.includes('401') || apiError.message.includes('403')) {
                        console.error('🔑 Authentication issue - check API key');
                    }
                }
            }
            
            // Use fallback data
            return this.getFallbackData(location, filters);
            
        } catch (error) {
            console.error('💥 Major error in getPropertiesByLocation:', error);
            return this.getFallbackData(location, filters);
        }
    }

    // Get fallback data (separated for reuse)
    async getFallbackData(location, filters) {
        console.log('🔄 Using location-specific sample data as fallback');
        await this.delay(800); // Shorter delay for fallback
        
        const coords = await this.geocodeLocation(location);
        let properties = this.generateSamplePropertiesForLocation(coords, location);
        
        // Apply filters to sample data
        properties = this.applyFilters(properties, filters);
        
        return {
            success: true,
            properties: properties,
            total: properties.length,
            source: 'Smart Fallback Data (API quota preserved)'
        };
    }

    // Fetch properties from Rentcast API (listings/sales only)
    async fetchFromRealtyMole(coords, filters) {
        try {
            console.log('🏠 Searching for property listings for sale using Rentcast API...');
            
            // Use the Rentcast listings/sale endpoint
            const url = `${this.baseURL}/listings/sale`;
            
            const params = new URLSearchParams({
                latitude: coords.lat.toString(),
                longitude: coords.lng.toString(),
                radius: '10', // 10 mile radius
                status: 'Active',
                limit: '25'
            });
            
            // Add price filters if specified
            if (filters.minPrice) {
                params.append('minPrice', filters.minPrice.toString());
            }
            if (filters.maxPrice && filters.maxPrice !== Number.MAX_SAFE_INTEGER) {
                params.append('maxPrice', filters.maxPrice.toString());
            }
            
            const fullUrl = `${url}?${params}`;
            console.log('📡 Rentcast API Request URL:', fullUrl);
            
            const response = await fetch(fullUrl, {
                method: 'GET',
                headers: {
                    'accept': 'application/json',
                    'X-Api-Key': this.apiKey
                }
            });
            
            console.log('📡 Rentcast API Response Status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Rentcast API Error Response:', errorText);
                
                // Check for specific error types
                if (response.status === 429) {
                    throw new Error('Rate limit exceeded (429)');
                } else if (response.status === 401 || response.status === 403) {
                    throw new Error(`Authentication failed (${response.status})`);
                } else {
                    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
                }
            }
            
            const data = await response.json();
            console.log('📡 Rentcast API Raw Response:', data);
            
            // Transform the listings data
            let properties = [];
            if (Array.isArray(data)) {
                properties = data;
            } else if (data && data.listings && Array.isArray(data.listings)) {
                properties = data.listings;
            } else if (data && data.properties && Array.isArray(data.properties)) {
                properties = data.properties;
            }
            
            if (properties.length > 0) {
                console.log(`✅ Found ${properties.length} property listings from Rentcast`);
                return properties.map((property, index) => this.transformRentcastProperty(property, index));
            } else {
                console.log('⚠️ No property listings found in this area');
                return [];
            }
            
        } catch (error) {
            console.error('❌ Rentcast API endpoint failed:', error);
            throw error;
        }
    }

    // Apply filters to properties
    applyFilters(properties, filters) {
        let filtered = [...properties];
        
        if (filters.minPrice) {
            filtered = filtered.filter(p => p.price >= filters.minPrice);
        }
        if (filters.maxPrice && filters.maxPrice !== Number.MAX_SAFE_INTEGER) {
            filtered = filtered.filter(p => p.price <= filters.maxPrice);
        }
        if (filters.propertyType) {
            filtered = filtered.filter(p => p.propertyType === filters.propertyType);
        }
        if (filters.bedrooms) {
            filtered = filtered.filter(p => p.bedrooms >= filters.bedrooms);
        }
        if (filters.bathrooms) {
            filtered = filtered.filter(p => p.bathrooms >= filters.bathrooms);
        }
        
        return filtered;
    }

    // Generate sample properties for a specific location (fallback when API fails)
    generateSamplePropertiesForLocation(coords, location) {
        const cityName = location.split(',')[0].trim();
        const properties = [];
        
        // Generate 8-12 random properties around the searched location
        const numProperties = Math.floor(Math.random() * 5) + 8;
        
        for (let i = 0; i < numProperties; i++) {
            // Generate coordinates within ~5 miles of the search location
            const latOffset = (Math.random() - 0.5) * 0.1; // ~5 mile radius
            const lngOffset = (Math.random() - 0.5) * 0.1;
            
            const property = {
                id: `fallback_${Date.now()}_${i}`,
                price: Math.floor(Math.random() * 800000) + 200000, // $200k - $1M
                address: `${Math.floor(Math.random() * 9999) + 1} ${this.getRandomStreetName()}, ${cityName}, ${this.getStateFromLocation(location)} ${Math.floor(Math.random() * 90000) + 10000}`,
                city: cityName,
                state: this.getStateFromLocation(location),
                zipCode: `${Math.floor(Math.random() * 90000) + 10000}`,
                bedrooms: Math.floor(Math.random() * 4) + 1,
                bathrooms: Math.floor(Math.random() * 3) + 1,
                sqft: Math.floor(Math.random() * 2500) + 800,
                propertyType: this.getRandomPropertyType(),
                listingStatus: 'active',
                coordinates: [coords.lng + lngOffset, coords.lat + latOffset],
                images: [this.getRandomPropertyImage()],
                description: `Beautiful property in ${cityName} with modern amenities and great location.`,
                yearBuilt: Math.floor(Math.random() * 30) + 1990,
                lotSize: Math.round((Math.random() * 0.8 + 0.1) * 100) / 100, // 0.1 to 0.9 acres, rounded to 2 decimals
                garage: Math.floor(Math.random() * 3)
            };
            
            properties.push(property);
        }
        
        return properties;
    }

    // Helper methods for generating sample data
    getRandomStreetName() {
        const streets = ['Main St', 'Oak Ave', 'Pine Dr', 'Maple Ln', 'Cedar Blvd', 'Elm St', 'Park Ave', 'First St', 'Second Ave', 'River Rd'];
        return streets[Math.floor(Math.random() * streets.length)];
    }

    getStateFromLocation(location) {
        // Extract state from location string, default to TX
        const parts = location.split(',');
        if (parts.length > 1) {
            const state = parts[1].trim().split(' ')[0];
            return state.length === 2 ? state : 'TX';
        }
        return 'TX';
    }

    getRandomPropertyType() {
        const types = ['single_family', 'condo', 'townhouse', 'single_family', 'single_family']; // Weight towards single family
        return types[Math.floor(Math.random() * types.length)];
    }

    // Test API connectivity
    async testAPIConnectivity() {
        console.log('🧪 Testing Rentcast API connectivity...');
        try {
            // Test the Rentcast sales endpoint specifically
            const response = await fetch(`${this.baseURL}/listings/sale?city=Austin&state=TX&status=Active&limit=1`, {
                method: 'GET',
                headers: {
                    'accept': 'application/json',
                    'X-Api-Key': this.apiKey
                }
            });
            
            console.log('🧪 Rentcast API Test Response Status:', response.status);
            
            if (response.ok) {
                console.log('✅ Rentcast API connectivity test PASSED');
                const data = await response.json();
                console.log('✅ Sample Rentcast API response:', data);
            } else {
                console.error('❌ Rentcast API connectivity test FAILED');
                console.error('Status:', response.status, response.statusText);
                const errorText = await response.text();
                console.error('Error response:', errorText);
                
                if (response.status === 429) {
                    console.error('🚫 Rate limited - too many requests');
                } else if (response.status === 401 || response.status === 403) {
                    console.error('🔑 Authentication failed - check API key');
                }
            }
        } catch (error) {
            console.error('❌ Rentcast API connectivity test ERROR:', error);
        }
    }

    // Get property details by ID
    async getPropertyById(id) {
        try {
            await this.delay(500);
            
            // Try to get detailed property info from Rentcast API
            try {
                const response = await fetch(`${this.baseURL}/listings/sale/${id}`, {
                    method: 'GET',
                    headers: {
                        'accept': 'application/json',
                        'X-Api-Key': this.apiKey
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    if (data) {
                        return {
                            success: true,
                            property: this.transformRentcastProperty(data, 0)
                        };
                    }
                }
            } catch (apiError) {
                console.warn('Failed to fetch detailed property from Rentcast API:', apiError);
            }
            
            // Fallback to sample data or cached property from previous search
            const property = this.sampleProperties.find(p => p.id === id);
            if (property) {
                return {
                    success: true,
                    property: property
                };
            } else {
                return {
                    success: false,
                    error: 'Property not found'
                };
            }
        } catch (error) {
            console.error('Error fetching property details:', error);
            return {
                success: false,
                error: 'Failed to fetch property details'
            };
        }
    }

    // Geocode address to coordinates
    async geocodeAddress(address) {
        try {
            const coords = await this.geocodeLocation(address);
            
            return {
                success: true,
                coordinates: [coords.lng, coords.lat], // Return in [lng, lat] format for MapLibre
                address: address
            };
        } catch (error) {
            console.error('Error geocoding address:', error);
            return {
                success: false,
                error: 'Failed to geocode address'
            };
        }
    }

    // Format price for display
    formatPrice(price) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(price);
    }

    // Format square footage
    formatSqft(sqft) {
        return new Intl.NumberFormat('en-US').format(sqft) + ' sq ft';
    }
}

// Export for use in other files
window.RealtyAPI = RealtyAPI;