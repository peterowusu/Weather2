# Weather Dashboard

A beautiful, modern weather dashboard web app that shows real-time weather, 5-day forecasts, and hourly details for any city. Built with HTML, CSS, JavaScript, and Python (for API integration).

## Features
- 🌤️ Real-time weather for any city
- 📅 5-day forecast with clickable daily cards
- ⏰ Hourly weather details in a modal
- 🌡️ Switch between Fahrenheit (°F) and Celsius (°C)
- 🔥 Heat warnings and fun messages for hot weather
- 🚪 "Pursuit is closed. Enjoy your day!" message when over 85°F/85°C
- ⚡ Quick access to popular cities
- 🎨 Beautiful, responsive UI with animations

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) or [Python 3](https://www.python.org/) (for running a local server)
- A free [OpenWeatherMap API key](https://openweathermap.org/api)

### Setup
1. **Clone the repository:**
   ```bash
   git clone https://github.com/peterowusu/Weather2.git
   cd Weather2
   ```
2. **Add your OpenWeatherMap API key:**
   - Create a file named `weather_api.key` in the project root.
   - Paste your API key inside (no spaces or quotes).

3. **Start a local server:**
   - With Python:
     ```bash
     python -m http.server 8000
     # or
     py -m http.server 8000
     ```
   - With Node.js:
     ```bash
     npx http-server -p 8000 --cors
     ```

4. **Open your browser:**
   - Go to [http://localhost:8000](http://localhost:8000)

## Usage
- Search for any city to see current weather and forecast
- Click a day in the 5-day forecast to see hourly details
- Switch between °F and °C using the toggle
- If the temperature is over 85°F/85°C, you'll see a "Pursuit is closed" message

## Technologies Used
- HTML5, CSS3, JavaScript (ES6)
- Python (for API integration)
- [OpenWeatherMap API](https://openweathermap.org/api)
- Font Awesome for icons

## Credits
- Developed by [peterowusu](https://github.com/peterowusu)
- Weather data from [OpenWeatherMap](https://openweathermap.org/)

## License
This project is open source and available under the [MIT License](LICENSE). 