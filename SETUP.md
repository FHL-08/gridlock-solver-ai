# 🚀 Quick Setup Guide

## Prerequisites
- Node.js v18+ or Bun
- Modern web browser with WebGL support

## Installation

### 1. Install Dependencies
```bash
cd gridlock-solver-ai-main
npm install
# or
bun install
```

### 2. Environment Configuration
The `.env` file is already configured with:
- Mapbox API token (for realistic maps)
- Supabase credentials (for AI agents)

If you need to use your own tokens:
```env
VITE_MAPBOX_TOKEN=your_token_here
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_key
```

### 3. Run Development Server
```bash
npm run dev
# or
bun dev
```

Open http://localhost:5173 in your browser.

### 4. Build for Production
```bash
npm run build
# or
bun run build
```

The production files will be in the `dist/` directory.

## Testing the Uber-Style Map

1. Navigate to **Patient View** tab
2. Enter NHS Number: **9912003072** (John Smith - stroke patient)
3. Select hospital: **City General Hospital**
4. Describe symptoms: **"My father's face is drooping and he can't speak."**
5. Upload video: **Suspected Stroke Symptoms**
6. Click **Submit Assessment**
7. Click **Confirm 999 Dispatch**
8. **See the realistic Uber-style map appear!**

The map will show:
- Real London streets and buildings
- 3D perspective (tilted view)
- Animated ambulance moving along routes
- Live speed indicator
- Real-time ETA countdown
- Smooth camera following

## Key Features

### Map Features:
✅ Interactive Mapbox GL map  
✅ 3D building rendering  
✅ Smooth ambulance animation  
✅ Real-time tracking  
✅ Speed indicator (45-80 km/h)  
✅ Dynamic camera following  
✅ Custom markers with animations  

### UI Enhancements:
✅ Glassmorphism effects  
✅ Premium animations  
✅ Micro-interactions  
✅ Loading states  
✅ Accessibility improvements  

## Troubleshooting

### Map not loading?
- Check browser console for errors
- Ensure WebGL is enabled in your browser
- Verify `VITE_MAPBOX_TOKEN` is set in `.env`

### Dependencies not installing?
```bash
# Try with legacy peer deps
npm install --legacy-peer-deps
```

### Build errors?
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

## Next Steps

After setup, check out:
- `README_ENHANCED.md` - Full documentation
- `IMPROVEMENTS.md` - What was changed
- Demo scenarios in the README

Enjoy the enhanced tracking experience! 🚑✨
