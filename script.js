class WeatherDashboard {
    constructor() {
        this.apiKey = 'caad85d084447b6786020e6eafb70d2d'; // Your API key
        this.baseUrl = 'https://api.openweathermap.org/data/2.5/weather';
        this.forecastUrl = 'https://api.openweathermap.org/data/2.5/forecast';
        this.currentUnit = 'imperial'; // Default to Fahrenheit
        this.currentWeatherData = null; // Store current weather data for unit conversion
        
        this.initializeElements();
        this.bindEvents();
        this.loadDefaultCity();
    }

    initializeElements() {
        // Search elements
        this.cityInput = document.getElementById('cityInput');
        this.searchBtn = document.getElementById('searchBtn');
        this.quickCityBtns = document.querySelectorAll('.quick-city');
        
        // Display elements
        this.loadingSpinner = document.getElementById('loadingSpinner');
        this.weatherContainer = document.getElementById('weatherContainer');
        this.errorMessage = document.getElementById('errorMessage');
        this.errorText = document.getElementById('errorText');
        
        // Weather data elements
        this.cityName = document.getElementById('cityName');
        this.currentTime = document.getElementById('currentTime');
        this.mainWeatherIcon = document.getElementById('mainWeatherIcon');
        this.currentTemp = document.getElementById('currentTemp');
        this.weatherStatus = document.getElementById('weatherStatus');
        this.weatherDescription = document.getElementById('weatherDescription');
        this.feelsLike = document.getElementById('feelsLike');
        
        // Detail elements
        this.tempMax = document.getElementById('tempMax');
        this.tempMin = document.getElementById('tempMin');
        this.tempRangeIndicator = document.getElementById('tempRangeIndicator');
        this.humidity = document.getElementById('humidity');
        this.pressure = document.getElementById('pressure');
        this.visibility = document.getElementById('visibility');
        this.windSpeed = document.getElementById('windSpeed');
        this.sunrise = document.getElementById('sunrise');
        this.sunset = document.getElementById('sunset');
        this.lastUpdated = document.getElementById('lastUpdated');
        
        // Forecast elements
        this.forecastContainer = document.getElementById('forecastContainer');
        
        // Unit toggle elements
        this.fahrenheitBtn = document.getElementById('fahrenheitBtn');
        this.celsiusBtn = document.getElementById('celsiusBtn');
        this.tempUnit = document.querySelector('.temp-unit');
    }

    bindEvents() {
        // Search functionality
        this.searchBtn.addEventListener('click', () => this.searchWeather());
        this.cityInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.searchWeather();
            }
        });

        // Quick city buttons
        this.quickCityBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const city = btn.getAttribute('data-city');
                this.cityInput.value = city;
                this.searchWeather();
            });
        });

        // Unit toggle buttons
        this.fahrenheitBtn.addEventListener('click', () => this.switchUnit('imperial'));
        this.celsiusBtn.addEventListener('click', () => this.switchUnit('metric'));
    }

    async loadDefaultCity() {
        await this.getWeatherData('London');
    }

    async searchWeather() {
        const city = this.cityInput.value.trim();
        if (!city) {
            this.showError('Please enter a city name');
            return;
        }
        await this.getWeatherData(city);
    }

    async getWeatherData(city) {
        try {
            this.showLoading();
            
            const url = `${this.baseUrl}?q=${encodeURIComponent(city)}&appid=${this.apiKey}&units=${this.currentUnit}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            this.displayWeatherData(data);
            
            // Also fetch forecast data
            await this.getForecastData(city);
            
        } catch (error) {
            console.error('Weather API Error:', error);
            this.showError(this.getErrorMessage(error));
        } finally {
            this.hideLoading();
        }
    }

    displayWeatherData(data) {
        // Parse the complex JSON structure
        const parsedData = this.parseWeatherData(data);
        
        // Update location and time
        this.updateLocationHeader(parsedData);
        
        // Update main weather display
        this.updateMainWeatherCard(parsedData);
        
        // Update detailed weather information
        this.updateWeatherDetails(parsedData);
        
        // Show the weather container
        this.showWeatherContainer();
        
        // Update last updated time
        this.updateLastUpdatedTime();
        
        // Store current weather data for unit conversion
        this.currentWeatherData = parsedData;
    }

    parseWeatherData(data) {
        return {
            location: {
                city: data.name,
                country: data.sys.country,
                coordinates: {
                    lat: data.coord.lat,
                    lon: data.coord.lon
                }
            },
            weather: {
                main: data.weather[0].main,
                description: data.weather[0].description,
                icon: data.weather[0].icon
            },
            temperature: {
                current: Math.round(data.main.temp),
                feels_like: Math.round(data.main.feels_like),
                min: Math.round(data.main.temp_min),
                max: Math.round(data.main.temp_max)
            },
            atmosphere: {
                humidity: data.main.humidity,
                pressure: data.main.pressure,
                visibility: data.visibility ? (data.visibility / 1000).toFixed(1) : 'N/A'
            },
            wind: {
                speed: data.wind ? data.wind.speed : 0,
                direction: data.wind ? data.wind.deg : 0
            },
            system: {
                sunrise: new Date(data.sys.sunrise * 1000),
                sunset: new Date(data.sys.sunset * 1000),
                timezone: data.timezone
            }
        };
    }

    updateLocationHeader(data) {
        this.cityName.textContent = `${data.location.city}, ${data.location.country}`;
        this.currentTime.textContent = new Date().toLocaleString();
    }

    updateMainWeatherCard(data) {
        // Set weather icon
        this.mainWeatherIcon.className = `weather-icon ${this.getWeatherIconClass(data.weather.main)}`;
        
        // Set temperature with burning animation if over 80°F
        this.currentTemp.textContent = data.temperature.current;
        this.addBurningEffect(data.temperature.current);
        
        // Set weather description
        this.weatherStatus.textContent = data.weather.main;
        this.weatherDescription.textContent = this.capitalizeWords(data.weather.description);
        this.feelsLike.textContent = `Feels like ${data.temperature.feels_like}°F`;
        
        // Add heat warning if over 80°F
        this.checkHeatWarning(data.temperature.current);

        // Show Pursuit closed message if over 85 in current unit
        this.showPursuitClosedMessage(data.temperature.current);
    }

    updateWeatherDetails(data) {
        // Temperature details
        this.tempMax.textContent = `${data.temperature.max}°F`;
        this.tempMin.textContent = `${data.temperature.min}°F`;
        this.updateTemperatureRange(data.temperature);
        
        // Atmospheric conditions
        this.humidity.textContent = `${data.atmosphere.humidity}%`;
        this.pressure.textContent = `${data.atmosphere.pressure} hPa`;
        this.visibility.textContent = `${data.atmosphere.visibility} km`;
        
        // Wind and sun information
        this.windSpeed.textContent = `${data.wind.speed} m/s`;
        this.sunrise.textContent = data.system.sunrise.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
        this.sunset.textContent = data.system.sunset.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    updateTemperatureRange(tempData) {
        const range = tempData.max - tempData.min;
        const currentPosition = tempData.current - tempData.min;
        const percentage = range > 0 ? (currentPosition / range) * 100 : 50;
        
        this.tempRangeIndicator.style.width = `${Math.max(5, Math.min(100, percentage))}%`;
    }

    getWeatherIconClass(weatherMain) {
        const iconMap = {
            'Clear': 'fas fa-sun',
            'Clouds': 'fas fa-cloud',
            'Rain': 'fas fa-cloud-rain',
            'Drizzle': 'fas fa-cloud-drizzle',
            'Thunderstorm': 'fas fa-bolt',
            'Snow': 'fas fa-snowflake',
            'Mist': 'fas fa-smog',
            'Smoke': 'fas fa-smog',
            'Haze': 'fas fa-smog',
            'Dust': 'fas fa-smog',
            'Fog': 'fas fa-smog',
            'Sand': 'fas fa-smog',
            'Ash': 'fas fa-smog',
            'Squall': 'fas fa-wind',
            'Tornado': 'fas fa-tornado'
        };
        
        return iconMap[weatherMain] || 'fas fa-cloud';
    }

    capitalizeWords(str) {
        return str.replace(/\w\S*/g, (txt) => 
            txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
        );
    }

    updateLastUpdatedTime() {
        const now = new Date();
        this.lastUpdated.textContent = `Last updated: ${now.toLocaleTimeString()}`;
    }

    showLoading() {
        this.hideAllSections();
        this.loadingSpinner.classList.remove('hidden');
    }

    hideLoading() {
        this.loadingSpinner.classList.add('hidden');
    }

    showWeatherContainer() {
        this.hideError();
        this.weatherContainer.classList.remove('hidden');
    }

    showError(message) {
        this.hideAllSections();
        this.errorText.textContent = message;
        this.errorMessage.classList.remove('hidden');
    }

    hideError() {
        this.errorMessage.classList.add('hidden');
    }

    hideAllSections() {
        this.weatherContainer.classList.add('hidden');
        this.errorMessage.classList.add('hidden');
    }

    async getForecastData(city) {
        try {
            const url = `${this.forecastUrl}?q=${encodeURIComponent(city)}&appid=${this.apiKey}&units=${this.currentUnit}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            this.displayForecastData(data);
            
            // Store the full forecast data for hourly display
            this.fullForecastData = data;
            
        } catch (error) {
            console.error('Forecast API Error:', error);
            // Don't show error for forecast, just hide the section
            this.forecastContainer.innerHTML = '<p style="text-align: center; color: rgba(255,255,255,0.7);">Forecast data unavailable</p>';
        }
    }

    displayForecastData(data) {
        // Process forecast data - get one forecast per day (around noon)
        const dailyForecasts = this.processForecastData(data.list);
        
        // Clear previous forecast
        this.forecastContainer.innerHTML = '';
        
        // Create forecast cards
        dailyForecasts.forEach((forecast, index) => {
            const forecastCard = this.createForecastCard(forecast, index);
            this.forecastContainer.appendChild(forecastCard);
        });
    }

    processForecastData(forecastList) {
        const dailyData = [];
        const processedDates = new Set();
        
        // Group forecasts by date and take the midday forecast (12:00)
        forecastList.forEach(item => {
            const date = new Date(item.dt * 1000);
            const dateString = date.toDateString();
            const hour = date.getHours();
            
            // Take forecast around noon (12:00) or closest available
            if (!processedDates.has(dateString) && (hour >= 11 && hour <= 13)) {
                processedDates.add(dateString);
                dailyData.push({
                    date: date,
                    temp_max: Math.round(item.main.temp_max),
                    temp_min: Math.round(item.main.temp_min),
                    description: item.weather[0].description,
                    main: item.weather[0].main,
                    humidity: item.main.humidity,
                    windSpeed: item.wind.speed
                });
            }
        });
        
        // Limit to 5 days
        return dailyData.slice(0, 5);
    }

    createForecastCard(forecast, index) {
        const card = document.createElement('div');
        card.className = 'forecast-card clickable';
        card.style.animationDelay = `${index * 0.1}s`;
        card.setAttribute('data-date', forecast.date.toDateString());
        
        const dayName = forecast.date.toLocaleDateString('en-US', { weekday: 'short' });
        const dateString = forecast.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const iconClass = this.getWeatherIconClass(forecast.main);
        
        // Use current unit for temperature display and heat warning
        const unitSymbol = this.currentUnit === 'imperial' ? '°F' : '°C';
        const heatThreshold = this.currentUnit === 'imperial' ? 80 : 27; // 80°F = ~27°C
        const burningHigh = forecast.temp_max >= heatThreshold ? ' burning-temp' : '';
        const fireIcon = forecast.temp_max >= heatThreshold ? '<div class="fire-animation" style="font-size: 0.8rem; top: -10px; right: -8px;">🔥</div>' : '';
        
        card.innerHTML = `
            <div class="forecast-day">${dayName}</div>
            <div class="forecast-date">${dateString}</div>
            <i class="${iconClass} forecast-icon"></i>
            <div class="forecast-temps">
                <span class="forecast-high${burningHigh}">${forecast.temp_max}${unitSymbol}${fireIcon}</span>
                <span class="forecast-low">${forecast.temp_min}${unitSymbol}</span>
            </div>
            <div class="forecast-desc">${this.capitalizeWords(forecast.description)}</div>
            <div class="forecast-details">
                <div class="forecast-detail">
                    <i class="fas fa-tint"></i>
                    <span>${forecast.humidity}%</span>
                </div>
                <div class="forecast-detail">
                    <i class="fas fa-wind"></i>
                    <span>${forecast.windSpeed.toFixed(1)} m/s</span>
                </div>
            </div>
            <div class="forecast-click-hint">
                <i class="fas fa-clock"></i>
                <span>Click for hourly forecast</span>
            </div>
        `;
        
        // Add click event listener for hourly weather
        card.addEventListener('click', () => this.showHourlyWeather(forecast.date));
        
        return card;
    }

    checkHeatWarning(temperature) {
        const heatThreshold = this.currentUnit === 'imperial' ? 80 : 27; // 80°F = ~27°C
        if (temperature >= heatThreshold) {
            this.showHeatWarning(temperature);
        } else {
            this.hideHeatWarning();
        }
    }

    showHeatWarning(temp) {
        // Remove existing warning if any
        this.hideHeatWarning();
        
        const unitSymbol = this.currentUnit === 'imperial' ? '°F' : '°C';
        const funnyMessages = [
            `🥵 It's ${temp}${unitSymbol}! Time to pretend you're a vampire and avoid sunlight at all costs!`,
            `🔥 ${temp}${unitSymbol}?! Even your phone is probably overheating. Stay hydrated and indoors!`,
            `☀️ ${temp}${unitSymbol} detected! Perfect weather for... absolutely nothing outside. Netflix & AC recommended!`,
            `🌡️ ${temp}${unitSymbol}! Your car's steering wheel is now officially lava. Handle with oven mitts!`,
            `🥤 ${temp}${unitSymbol}! Reminder: You're 60% water, don't become a raisin. Drink up and stay cool!`,
            `🧊 ${temp}${unitSymbol} outside! Time to become one with your air conditioner. Embrace the chill!`,
            `🌞 ${temp}${unitSymbol}! Even the sun is probably feeling guilty right now. Seek shade, brave soul!`
        ];
        
        const randomMessage = funnyMessages[Math.floor(Math.random() * funnyMessages.length)];
        
        const warning = document.createElement('div');
        warning.id = 'heatWarning';
        warning.className = 'heat-warning';
        warning.innerHTML = `
            <div class="heat-warning-content">
                <div class="warning-icon-container burning-temp">
                    <i class="fas fa-temperature-hot"></i>
                    <div class="fire-animation">🔥</div>
                    <div class="fire-animation" style="animation-delay: 0.2s; right: -25px; top: -15px;">🔥</div>
                    <div class="fire-trail" style="animation-delay: 0.1s;">💨</div>
                </div>
                <div class="heat-warning-text">
                    <h4>🚨 EXTREME HEAT ALERT! 🔥</h4>
                    <p>${randomMessage}</p>
                    <div class="heat-safety-tips">
                        <small>💡 Safety Tips: Stay hydrated • Avoid direct sunlight • Use sunscreen • Take frequent breaks</small>
                    </div>
                </div>
            </div>
        `;
        
        // Insert warning after the main weather card
        const mainCard = document.querySelector('.main-weather-card');
        mainCard.insertAdjacentElement('afterend', warning);
        
        // Add animation
        setTimeout(() => warning.classList.add('show'), 100);
    }

    hideHeatWarning() {
        const existingWarning = document.getElementById('heatWarning');
        if (existingWarning) {
            existingWarning.remove();
        }
    }

    addBurningEffect(temperature) {
        // Remove existing burning effects
        this.removeBurningEffect();
        
        const heatThreshold = this.currentUnit === 'imperial' ? 80 : 27; // 80°F = ~27°C
        if (temperature >= heatThreshold) {
            const tempDisplay = document.querySelector('.temperature-display');
            const currentTempElement = document.getElementById('currentTemp');
            
            // Add burning class to temperature container
            currentTempElement.classList.add('burning-temp');
            
            // Add heat waves background
            const heatWaves = document.createElement('div');
            heatWaves.className = 'heat-waves';
            heatWaves.id = 'heatWaves';
            tempDisplay.appendChild(heatWaves);
            
            // Add multiple fire animations
            const fireEmojis = ['🔥', '🔥', '🔥'];
            fireEmojis.forEach((emoji, index) => {
                setTimeout(() => {
                    const fireElement = document.createElement('div');
                    fireElement.className = `fire-animation fire-${index}`;
                    fireElement.textContent = emoji;
                    fireElement.style.animationDelay = `${index * 0.2}s`;
                    fireElement.style.right = `${-15 + (index * 8)}px`;
                    fireElement.style.top = `${-20 + (index * -5)}px`;
                    currentTempElement.appendChild(fireElement);
                }, index * 100);
            });
            
            // Add fire trail effects
            const trailEmojis = ['💨', '🌪️'];
            trailEmojis.forEach((emoji, index) => {
                setTimeout(() => {
                    const trailElement = document.createElement('div');
                    trailElement.className = 'fire-trail';
                    trailElement.textContent = emoji;
                    trailElement.style.animationDelay = `${index * 0.3}s`;
                    trailElement.style.right = `${-10 + (index * 12)}px`;
                    currentTempElement.appendChild(trailElement);
                }, index * 150);
            });
            
            // Add burning effect to main weather card
            const mainCard = document.querySelector('.main-weather-card');
            mainCard.classList.add('extreme-heat');
            
            // Add pulsing red glow
            mainCard.style.boxShadow = '0 0 30px rgba(255, 0, 0, 0.6), 0 0 60px rgba(255, 100, 0, 0.4)';
            mainCard.style.animation = 'heatPulse 1s infinite alternate';
        }
    }

    removeBurningEffect() {
        // Remove burning class
        const currentTempElement = document.getElementById('currentTemp');
        if (currentTempElement) {
            currentTempElement.classList.remove('burning-temp');
            
            // Remove all fire animations
            const fireElements = currentTempElement.querySelectorAll('.fire-animation, .fire-trail');
            fireElements.forEach(element => element.remove());
        }
        
        // Remove heat waves
        const heatWaves = document.getElementById('heatWaves');
        if (heatWaves) {
            heatWaves.remove();
        }
        
        // Reset main card styling
        const mainCard = document.querySelector('.main-weather-card');
        if (mainCard) {
            mainCard.classList.remove('extreme-heat');
            mainCard.style.boxShadow = '';
            mainCard.style.animation = '';
        }
    }

    getErrorMessage(error) {
        if (error.message.includes('401')) {
            return 'Invalid API key. Please check your configuration.';
        } else if (error.message.includes('404')) {
            return 'City not found. Please check the spelling and try again.';
        } else if (error.message.includes('Failed to fetch')) {
            return 'Network error. Please check your internet connection.';
        } else {
            return 'An unexpected error occurred. Please try again.';
        }
    }

    switchUnit(newUnit) {
        if (this.currentUnit === newUnit) return;
        
        this.currentUnit = newUnit;
        
        // Update button states
        this.fahrenheitBtn.classList.toggle('active', newUnit === 'imperial');
        this.celsiusBtn.classList.toggle('active', newUnit === 'metric');
        
        // Update unit display
        this.tempUnit.textContent = newUnit === 'imperial' ? '°F' : '°C';
        
        // If we have current weather data, refresh the display with new units
        if (this.currentWeatherData) {
            this.refreshWeatherDisplay();
        }
    }

    async refreshWeatherDisplay() {
        // Re-fetch weather data with new units
        const city = this.currentWeatherData.location.city;
        await this.getWeatherData(city);
    }

    showHourlyWeather(date) {
        if (!this.fullForecastData) return;
        
        const targetDate = new Date(date);
        const targetDateString = targetDate.toDateString();
        
        // Filter hourly data for the selected date
        const hourlyData = this.fullForecastData.list.filter(item => {
            const itemDate = new Date(item.dt * 1000);
            return itemDate.toDateString() === targetDateString;
        });
        
        if (hourlyData.length === 0) return;
        
        // Create and show hourly weather modal
        this.createHourlyWeatherModal(targetDate, hourlyData);
    }

    createHourlyWeatherModal(date, hourlyData) {
        // Remove existing modal if any
        this.removeHourlyWeatherModal();
        
        const modal = document.createElement('div');
        modal.id = 'hourlyWeatherModal';
        modal.className = 'hourly-weather-modal';
        
        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
        const dateString = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        const unitSymbol = this.currentUnit === 'imperial' ? '°F' : '°C';
        
        modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-clock"></i> Hourly Forecast - ${dayName}, ${dateString}</h3>
                    <button class="modal-close-btn" id="closeHourlyModal">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="hourly-weather-grid">
                    ${hourlyData.map((hour, index) => this.createHourlyCard(hour, unitSymbol, index)).join('')}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add close functionality
        const closeBtn = document.getElementById('closeHourlyModal');
        const overlay = modal.querySelector('.modal-overlay');
        
        closeBtn.addEventListener('click', () => this.removeHourlyWeatherModal());
        overlay.addEventListener('click', () => this.removeHourlyWeatherModal());
        
        // Add escape key functionality
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.removeHourlyWeatherModal();
            }
        });
        
        // Show modal with animation
        setTimeout(() => modal.classList.add('show'), 10);
    }

    createHourlyCard(hourData, unitSymbol, index) {
        const time = new Date(hourData.dt * 1000);
        const timeString = time.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            hour12: true 
        });
        const iconClass = this.getWeatherIconClass(hourData.weather[0].main);
        const temp = Math.round(hourData.main.temp);
        const feelsLike = Math.round(hourData.main.feels_like);
        const humidity = hourData.main.humidity;
        const windSpeed = hourData.wind.speed;
        const description = this.capitalizeWords(hourData.weather[0].description);
        
        // Heat warning for hourly data
        const heatThreshold = this.currentUnit === 'imperial' ? 80 : 27;
        const isHot = temp >= heatThreshold;
        const heatClass = isHot ? ' hot-temp' : '';
        const fireIcon = isHot ? '<div class="fire-animation" style="font-size: 0.7rem; top: -8px; right: -6px;">🔥</div>' : '';
        
        // Pursuit closed message for hourly
        const pursuitClosedMsg = temp > 85 ? '<div class="pursuit-closed-msg"><i class="fas fa-door-closed"></i> Pursuit is closed. Enjoy your day!</div>' : '';
        
        return `
            <div class="hourly-card${heatClass}" style="animation-delay: ${index * 0.1}s">
                <div class="hourly-time">${timeString}</div>
                <i class="${iconClass} hourly-icon"></i>
                <div class="hourly-temp">
                    <span class="hourly-current">${temp}${unitSymbol}${fireIcon}</span>
                    <span class="hourly-feels">Feels like ${feelsLike}${unitSymbol}</span>
                </div>
                <div class="hourly-desc">${description}</div>
                <div class="hourly-details">
                    <div class="hourly-detail">
                        <i class="fas fa-tint"></i>
                        <span>${humidity}%</span>
                    </div>
                    <div class="hourly-detail">
                        <i class="fas fa-wind"></i>
                        <span>${windSpeed.toFixed(1)} m/s</span>
                    </div>
                </div>
                ${pursuitClosedMsg}
            </div>
        `;
    }

    removeHourlyWeatherModal() {
        const modal = document.getElementById('hourlyWeatherModal');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        }
    }

    showPursuitClosedMessage(temp) {
        // Remove existing message
        let msg = document.getElementById('pursuitClosedMsg');
        if (msg) msg.remove();
        const threshold = 85;
        if (temp > threshold) {
            const mainCard = document.querySelector('.main-weather-card');
            msg = document.createElement('div');
            msg.id = 'pursuitClosedMsg';
            msg.className = 'pursuit-closed-msg';
            msg.innerHTML = '<i class="fas fa-door-closed"></i> Pursuit is closed. Enjoy your day!';
            mainCard.appendChild(msg);
        }
    }
}

// Initialize the weather dashboard when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new WeatherDashboard();
});

// Add some interactive effects
document.addEventListener('DOMContentLoaded', () => {
    // Add floating animation to weather cards
    const cards = document.querySelectorAll('.detail-card');
    cards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
    });

    // Add hover effects to quick city buttons
    const quickCities = document.querySelectorAll('.quick-city');
    quickCities.forEach(btn => {
        btn.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-3px) scale(1.05)';
        });
        
        btn.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });

    // Add click animation to search button
    const searchBtn = document.getElementById('searchBtn');
    searchBtn.addEventListener('click', function() {
        this.style.transform = 'scale(0.95)';
        setTimeout(() => {
            this.style.transform = 'scale(1)';
        }, 150);
    });
}); 