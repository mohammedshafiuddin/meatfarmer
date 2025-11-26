# Symbuyote - Fresh Local Shopping Platform

A modern, responsive web application for local farm-to-consumer shopping experience.

## Features

- 🎨 **Modern Design**: Beautiful gradient-based UI with smooth animations
- 📱 **Responsive**: Works perfectly on all devices
- ⚡ **Fast**: Built with HTMX for dynamic content without heavy JavaScript frameworks
- 🖼️ **Rich Media**: High-quality images from Unsplash
- ✨ **Interactive**: Smooth scroll animations, hover effects, and micro-interactions
- 📧 **Newsletter**: Functional subscription form with feedback

## Technology Stack

- **Backend**: Node.js with Express
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Dynamic Content**: HTMX
- **Styling**: Custom CSS with CSS Grid and Flexbox
- **Icons**: Font Awesome
- **Images**: Unsplash API
- **Fonts**: Google Fonts (Inter, Poppins)

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm

### Installation

1. Clone the repository
2. Navigate to the info-site directory:
   ```bash
   cd apps/info-site
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Start the development server:
   ```bash
   npm start
   ```

5. Open your browser and navigate to:
   ```
   http://localhost:6446
   ```

## Project Structure

```
apps/info-site/
├── public/
│   ├── css/
│   │   └── styles.css          # Main stylesheet
│   ├── js/
│   │   └── main.js            # JavaScript interactions
│   ├── images/
│   │   ├── logo.svg           # Company logo
│   │   └── [product-images]   # Product and lifestyle images
│   └── index.html            # Main HTML file
├── index.js                  # Express server
├── package.json              # Dependencies and scripts
└── README.md                # This file
```

## Features Overview

### Hero Section
- Eye-catching gradient background
- Compelling headline and description
- Call-to-action buttons with hover effects
- Parallax scrolling effect

### Product Categories
- Three main categories: Meat, Fruits, Dry Fruits
- Beautiful card layouts with images
- Hover animations and transitions

### How It Works
- Three-step process visualization
- Interactive step cards
- Clear, concise descriptions

### Quality Promise
- Trust indicators
- Feature highlights
- Professional imagery

### Testimonials
- Customer reviews
- Author avatars and information
- Card-based layout

### Newsletter
- Email subscription form
- Real-time validation
- Success/error feedback

### Footer
- Company information
- Quick links
- Social media connections
- Copyright information

## Customization

### Colors
The color scheme is defined in CSS variables:
- Primary: `#F83758` (Coral Red)
- Secondary: `#FF6B9D` (Pink)
- Accent: `#4ECDC4` (Teal)
- Background: `#fff0f6` (Light Pink)

### Images
Replace images in the `public/images/` directory. Current images are from Unsplash and loaded via CDN.

### Content
Edit the HTML content in `public/index.html` to modify text, add new sections, or change the structure.

## Deployment

### Environment Variables
- `PORT`: Server port (default: 6446)

### Production Setup
1. Set NODE_ENV to production
2. Configure your preferred port
3. Deploy to your hosting platform

## Browser Support

- Chrome/Chromium (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is proprietary to Symbuyote.

## Support

For support or questions, please contact the development team.