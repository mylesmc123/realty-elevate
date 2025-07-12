# 🏠 Realty Elevate

A modern real estate mapping application built with MapLibre GL JS that provides an interactive way to browse property listings on a map.

## Features

✨ **Interactive Map Experience**
- MapLibre GL JS powered mapping with smooth pan/zoom
- Custom property markers with price and bedroom info
- Property popups with quick details
- Navigation and fullscreen controls
- Responsive design for all devices

🏠 **Property Listings**
- Real-time property search and filtering
- Detailed property information modals
- Price, bedroom, bathroom, and square footage filters
- Property type filtering (single family, condo, townhouse, etc.)
- Property image galleries

🔍 **Search & Filter**
- Location-based search
- Advanced filtering options
- Property list sidebar with quick access
- Map integration with property highlighting

📱 **Mobile Friendly**
- Responsive design that works on all screen sizes
- Touch-friendly interface
- Optimized for mobile browsing

## Getting Started

### Prerequisites

- Modern web browser with JavaScript enabled
- Web server (for local development)

### Installation

1. Clone or download the repository
2. Open the project in your preferred code editor
3. Serve the files using a local web server

#### Using Python (if you have Python installed):
```bash
# For Python 3
python -m http.server 8000

# For Python 2
python -m SimpleHTTPServer 8000
```

#### Using Node.js (if you have Node.js installed):
```bash
# Install a simple HTTP server
npm install -g http-server

# Run the server
http-server
```

#### Using Live Server (VS Code extension):
1. Install the "Live Server" extension in VS Code
2. Right-click on `index.html`
3. Select "Open with Live Server"

### API Configuration

The application currently uses sample data for demonstration purposes. To integrate with a real estate API:

1. **Get API Access**
   - Sign up for a real estate API service (RentSpree, RentBerry, or similar)
   - Obtain your API key and endpoint URLs

2. **Update API Configuration**
   - Open `js/api.js`
   - Replace the sample data with actual API calls
   - Update the `baseURL` and `apiKey` variables

3. **Example API Integration**:
```javascript
// In js/api.js
async getPropertiesByLocation(location, filters = {}) {
    const response = await fetch(`${this.baseURL}/properties?location=${location}`, {
        headers: {
            'X-API-Key': this.apiKey,
            'Content-Type': 'application/json'
        }
    });
    
    if (!response.ok) {
        throw new Error('API request failed');
    }
    
    return await response.json();
}
```

## File Structure

```
realty-elevate/
├── index.html              # Main HTML file
├── css/
│   └── styles.css          # All CSS styles
├── js/
│   ├── app.js              # Main application logic
│   ├── map.js              # MapLibre GL JS integration
│   └── api.js              # API integration and data handling
└── README.md               # This file
```

## Technology Stack

- **MapLibre GL JS** - Interactive mapping library
- **Vanilla JavaScript** - No frameworks, pure JS
- **CSS3** - Modern styling with Grid and Flexbox
- **HTML5** - Semantic markup
- **OpenStreetMap** - Map tiles (free and open source)

## Features in Detail

### Interactive Map
- **MapLibre GL JS**: Free and open-source mapping library
- **Custom Markers**: Property markers showing price and bedroom count
- **Popups**: Click markers to see property details
- **Controls**: Navigation, fullscreen, and geolocation controls
- **Responsive**: Works on desktop and mobile devices

### Property Search
- **Location Search**: Enter city, state, or ZIP code
- **Real-time Filtering**: Filter by price, property type, bedrooms, bathrooms
- **Visual Feedback**: Loading states and error handling
- **No Results Handling**: User-friendly messages when no properties match

### Property Details
- **Comprehensive Info**: Price, address, bedrooms, bathrooms, square footage
- **Images**: Property photos in modal view
- **Property Types**: Single family, condo, townhouse, multi-family
- **Additional Details**: Year built, garage spaces, lot size

## Customization

### Styling
- Edit `css/styles.css` to customize colors, fonts, and layout
- All CSS uses CSS custom properties for easy theme changes
- Mobile-first responsive design

### Map Style
- Modify the map style in `js/map.js`
- Currently uses OpenStreetMap tiles (free)
- Can be switched to other tile providers or custom styles

### Sample Data
- Update `js/api.js` to modify sample properties
- Add more properties or change existing ones
- Useful for testing and demonstrations

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge
- Mobile browsers (iOS Safari, Chrome Mobile)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgments

- **MapLibre GL JS** - For the amazing mapping library
- **OpenStreetMap** - For the free map tiles
- **Unsplash** - For the sample property images
- **Contributors** - Thank you to all who help improve this project

## Support

If you encounter any issues or have questions:
1. Check the browser console for error messages
2. Ensure you're serving the files from a web server (not opening directly in browser)
3. Verify your internet connection for map tiles
4. Check that JavaScript is enabled in your browser

## Future Enhancements

- [ ] Real estate API integration
- [ ] User authentication
- [ ] Favorite properties
- [ ] Advanced search filters
- [ ] Property comparison
- [ ] Mortgage calculator
- [ ] Neighborhood information
- [ ] Walk score integration
- [ ] Property alerts/notifications
- [ ] Social sharing