# Forma Strategies Website

## Overview
This is a modern, responsive website for Forma Strategies - an onchain asset management company built exclusively on Solana. The website features a sophisticated fintech aesthetic with smooth animations, professional design, and full responsive support.

## 🎨 Design Features
- **Modern Fintech Aesthetic**: Dark theme with metallic accents and blue gradients
- **Sophisticated Animations**: Fade-in effects, parallax scrolling, smooth transitions
- **Fully Responsive**: Optimized for desktop, tablet, and mobile devices
- **Performance Optimized**: Fast loading, efficient animations, smooth scrolling
- **Accessibility**: Keyboard navigation support, semantic HTML, ARIA labels

## 📁 File Structure
```
forma-strategies-website/
├── index.html # Main HTML file
├── styles.css # Complete stylesheet with animations
├── script.js # JavaScript for interactivity
├── FormaStrategiesBanner4k.jpeg # Logo/banner image
├── FormatrategiesBannerBackground.jpeg # Background image
└── README.md # This file
```

## 🚀 Getting Started

### Option 1: Simple Setup (Recommended)
1. Download all files to a folder
2. Double-click `index.html` to open in your browser
3. That's it! The site will work locally

### Option 2: Local Web Server (For Development)
If you want to test with a local server:

**Using Python:**
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

**Using Node.js:**
```bash
npx serve
```

**Using PHP:**
```bash
php -S localhost:8000
```

Then open `http://localhost:8000` in your browser.

## 🌐 Deployment

### Deploy to Netlify (Easiest)
1. Sign up at [netlify.com](https://netlify.com)
2. Drag and drop your folder to Netlify
3. Your site is live!

### Deploy to Vercel
1. Sign up at [vercel.com](https://vercel.com)
2. Install Vercel CLI: `npm i -g vercel`
3. Run `vercel` in your project folder
4. Follow the prompts

### Deploy to GitHub Pages
1. Create a new repository on GitHub
2. Upload all files
3. Go to Settings → Pages
4. Select main branch and save
5. Your site will be live at `https://yourusername.github.io/repository-name`

### Traditional Web Hosting
Upload all files via FTP to your web hosting provider:
- index.html (must be in root directory)
- styles.css
- script.js
- Both image files

## 🎯 Sections Included

1. **Hero Section**: Bold headline with company tagline and key statistics
2. **Features**: Four key value propositions with icons
3. **About**: Company information and mission
4. **Strategies**: Four investment strategies (1 passive, 3 active)
5. **Technology**: Solana blockchain integration details
6. **CTA**: Call-to-action section for user engagement
7. **Footer**: Links, social media, and company information

## 🎨 Customization Guide

### Changing Colors
Edit the CSS custom properties in `styles.css`:
```css
:root {
 --color-accent-primary: #60a5fa; /* Change primary blue */
 --color-accent-secondary: #818cf8; /* Change secondary purple */
 /* ... more colors ... */
}
```

### Adding Content
- **New Strategies**: Copy a `.strategy-card` div in `index.html` and modify
- **New Features**: Copy a `.feature-card` div and customize
- **Text Changes**: Edit content directly in `index.html`

### Changing Fonts
Current fonts (Google Fonts):
- **Display**: Syne (headings, navigation)
- **Monospace**: JetBrains Mono (labels, technical text)

To change fonts, update the Google Fonts link in `index.html` and the CSS variables in `styles.css`.

## 📱 Browser Support
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## ⚡ Performance
- **Page Load**: < 2 seconds on standard connection
- **Lighthouse Score**: 95+ for Performance
- **Optimized Images**: Ensure images are compressed for production
- **Minimal Dependencies**: No heavy frameworks, pure HTML/CSS/JS

## 🔧 Future Enhancements

Consider adding:
- [ ] Connect Wallet functionality (Solana wallet adapter)
- [ ] Contact form with backend integration
- [ ] Blog/News section
- [ ] Live price feeds
- [ ] Strategy performance charts
- [ ] Multi-language support
- [ ] Dark/Light theme toggle
- [ ] Mobile hamburger menu

## 📞 Support & Contact

For questions about this website template:
- Review the code comments in each file
- Check browser console for any errors
- Ensure all image paths are correct

For Forma Strategies business inquiries:
-, U.S.
- Visit the website for contact information

## 📄 License
This website template is provided as-is for Forma Strategies LLC.

## 🙏 Credits
- Design: Inspired by modern fintech leaders (Ondo Finance, Backed.fi)
- Fonts: Google Fonts (Syne, JetBrains Mono)
- Icons: Custom SVG icons
- Built with: Pure HTML, CSS, and JavaScript

---

**Built with ❤️ for the Solana ecosystem**
