class RealtyAPI {
    constructor() {
        // RealtyMole API configuration
        this.baseURL = 'https://realty-mole-property-api.p.rapidapi.com';
        this.apiKey = '4d0e87fa977947309a20c6e3fea06ffa';
        this.rapidApiHost = 'realty-mole-property-api.p.rapidapi.com';
        
        // Test API connectivity on initialization
        this.testAPIConnectivity();
        
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

    // Geocode a location to get coordinates for property search
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

    // Transform RealtyMole data to our format
    transformRealtyMoleProperty(property, index) {
        // Handle different possible property structures from RealtyMole
        const id = property.id || property.propertyId || `rm_${Date.now()}_${index}`;
        const price = property.price || property.lastSalePrice || property.estimatedValue || 0;
        const address = property.formattedAddress || property.address || 
                       `${property.streetAddress || ''} ${property.city || ''}, ${property.state || ''} ${property.zipCode || ''}`.trim();
        
        return {
            id: id,
            price: price,
            address: address,
            city: property.city || '',
            state: property.state || '',
            zipCode: property.zipCode || property.zip || '',
            bedrooms: property.bedrooms || property.beds || Math.floor(Math.random() * 4) + 1, // Random fallback
            bathrooms: property.bathrooms || property.baths || Math.floor(Math.random() * 3) + 1, // Random fallback
            sqft: property.squareFootage || property.livingArea || property.sqft || 1200,
            propertyType: this.normalizePropertyType(property.propertyType || property.type),
            listingStatus: 'active',
            coordinates: [
                property.longitude || property.lng || (Math.random() * 0.2 - 0.1 - 97.7431), // Random around Austin if missing
                property.latitude || property.lat || (Math.random() * 0.2 - 0.1 + 30.2672)   // Random around Austin if missing
            ],
            images: this.getPropertyImages(property),
            description: property.description || this.generateDescription(property),
            yearBuilt: property.yearBuilt || property.built || Math.floor(Math.random() * 30) + 1990,
            lotSize: property.lotSize ? property.lotSize / 43560 : (Math.random() * 0.5 + 0.1), // Convert sq ft to acres or random
            garage: property.garageSpaces || property.garage || Math.floor(Math.random() * 3)
        };
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
            console.log('🔍 Fetching properties from RealtyMole API for:', location);
            
            // First geocode the location to get coordinates
            const coords = await this.geocodeLocation(location);
            console.log('📍 Geocoded coordinates:', coords);
            
            // Try RealtyMole API first
            try {
                console.log('🌐 Attempting RealtyMole API call...');
                const properties = await this.fetchFromRealtyMole(coords, filters);
                if (properties && properties.length > 0) {
                    console.log(`✅ SUCCESS: Found ${properties.length} properties from RealtyMole API`);
                    return {
                        success: true,
                        properties: properties,
                        total: properties.length,
                        source: 'RealtyMole API'
                    };
                } else {
                    console.log('⚠️ RealtyMole API returned no properties');
                }
            } catch (apiError) {
                console.error('❌ RealtyMole API failed:');
                console.error('Error message:', apiError.message);
                console.error('Full error:', apiError);
                
                // Check if it's a CORS or network error
                if (apiError.message.includes('fetch')) {
                    console.error('🚫 This might be a CORS or network connectivity issue');
                }
                if (apiError.message.includes('401') || apiError.message.includes('403')) {
                    console.error('🔑 This might be an API key authentication issue');
                }
            }
            
            // Fallback to sample data if API fails
            console.log('🔄 Using location-specific sample data as fallback');
            await this.delay(1000); // Simulate API delay
            
            let properties = this.generateSamplePropertiesForLocation(coords, location);
            
            // Apply filters to sample data
            properties = this.applyFilters(properties, filters);
            
            return {
                success: true,
                properties: properties,
                total: properties.length,
                source: 'Sample Data (API fallback)'
            };
            
        } catch (error) {
            console.error('💥 Major error in getPropertiesByLocation:', error);
            return {
                success: false,
                error: 'Failed to fetch properties. Please try again.',
                properties: [],
                total: 0
            };
        }
    }

    // Fetch properties from RealtyMole API
    async fetchFromRealtyMole(coords, filters) {
        // Try multiple endpoints in order of preference
        const endpoints = [
            {
                name: 'comparables',
                url: `${this.baseURL}/comparables`,
                params: {
                    latitude: coords.lat.toString(),
                    longitude: coords.lng.toString(),
                    radius: '5',
                    limit: '20',
                    propertyType: 'All'
                }
            },
            {
                name: 'properties',
                url: `${this.baseURL}/properties`,
                params: {
                    latitude: coords.lat.toString(),
                    longitude: coords.lng.toString(),
                    radius: '5',
                    limit: '20'
                }
            },
            {
                name: 'rentEstimate',
                url: `${this.baseURL}/rentEstimate`,
                params: {
                    latitude: coords.lat.toString(),
                    longitude: coords.lng.toString()
                }
            }
        ];

        for (const endpoint of endpoints) {
            try {
                console.log(`🔄 Trying ${endpoint.name} endpoint...`);
                
                const params = new URLSearchParams(endpoint.params);
                const fullUrl = `${endpoint.url}?${params}`;
                
                console.log('📡 API Request URL:', fullUrl);
                
                const response = await fetch(fullUrl, {
                    method: 'GET',
                    headers: {
                        'X-RapidAPI-Key': this.apiKey,
                        'X-RapidAPI-Host': this.rapidApiHost,
                        'Content-Type': 'application/json'
                    }
                });
                
                console.log(`📡 ${endpoint.name} Response Status:`, response.status);
                
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error(`❌ ${endpoint.name} Error Response:`, errorText);
                    continue; // Try next endpoint
                }
                
                const data = await response.json();
                console.log(`📡 ${endpoint.name} Raw Response:`, data);
                
                // Transform response based on endpoint
                let properties = [];
                if (endpoint.name === 'comparables' && Array.isArray(data)) {
                    properties = data;
                } else if (endpoint.name === 'properties' && Array.isArray(data)) {
                    properties = data;
                } else if (data && data.comparables && Array.isArray(data.comparables)) {
                    properties = data.comparables;
                } else if (data && data.properties && Array.isArray(data.properties)) {
                    properties = data.properties;
                }
                
                if (properties.length > 0) {
                    console.log(`✅ Successfully retrieved ${properties.length} properties from ${endpoint.name} endpoint`);
                    return properties.map((property, index) => this.transformRealtyMoleProperty(property, index));
                } else {
                    console.log(`⚠️ ${endpoint.name} endpoint returned no properties`);
                }
                
            } catch (error) {
                console.error(`❌ ${endpoint.name} endpoint failed:`, error);
                continue; // Try next endpoint
            }
        }
        
        console.log('💔 All API endpoints failed');
        return [];
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
                lotSize: Math.random() * 0.8 + 0.1, // 0.1 to 0.9 acres
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
        console.log('🧪 Testing RealtyMole API connectivity...');
        try {
            // Try a simple API call to test connectivity
            const response = await fetch(`${this.baseURL}/comparables?latitude=30.2672&longitude=-97.7431&radius=1&limit=1`, {
                method: 'GET',
                headers: {
                    'X-RapidAPI-Key': this.apiKey,
                    'X-RapidAPI-Host': this.rapidApiHost,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('🧪 API Test Response Status:', response.status);
            
            if (response.ok) {
                console.log('✅ API connectivity test PASSED');
                const data = await response.json();
                console.log('✅ Sample API response:', data);
            } else {
                console.error('❌ API connectivity test FAILED');
                console.error('Status:', response.status, response.statusText);
                const errorText = await response.text();
                console.error('Error response:', errorText);
            }
        } catch (error) {
            console.error('❌ API connectivity test ERROR:', error);
        }
    }

    // Get property details by ID
    async getPropertyById(id) {
        try {
            await this.delay(500);
            
            // Try to get detailed property info from RealtyMole API
            try {
                const response = await fetch(`${this.baseURL}/property?id=${id}`, {
                    method: 'GET',
                    headers: {
                        'X-RapidAPI-Key': this.apiKey,
                        'X-RapidAPI-Host': this.rapidApiHost
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    if (data) {
                        return {
                            success: true,
                            property: this.transformRealtyMoleProperty(data, 0)
                        };
                    }
                }
            } catch (apiError) {
                console.warn('Failed to fetch detailed property from API:', apiError);
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