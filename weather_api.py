import requests
import json
import os
from datetime import datetime

class WeatherAPI:
    def __init__(self, api_key_file="weather_api.key"):
        """Initialize with API key from file"""
        self.base_url = "https://api.openweathermap.org/data/2.5/weather"
        self.forecast_url = "https://api.openweathermap.org/data/2.5/forecast"
        self.api_key = self._load_api_key(api_key_file)
    
    def _load_api_key(self, key_file):
        """Load API key from file"""
        try:
            with open(key_file, 'r') as f:
                api_key = f.read().strip()
                if not api_key or "YOUR_OPENWEATHERMAP_API_KEY" in api_key:
                    raise ValueError("Please add your actual API key to weather_api.key")
                return api_key
        except FileNotFoundError:
            # Create template file
            with open(key_file, 'w') as f:
                f.write("YOUR_OPENWEATHERMAP_API_KEY_HERE")
            raise ValueError(f"Created {key_file}. Please add your actual API key.")
    
    def get_weather_data(self, city):
        """
        Make authenticated API call to get complex weather data
        """
        # Authentication via API key
        params = {
            "q": city,
            "appid": self.api_key,  # API Authentication
            "units": "imperial"
        }
        
        try:
            response = requests.get(self.base_url, params=params, timeout=10)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.HTTPError as err:
            if response.status_code == 401:
                print("❌ Authentication failed: Invalid API key")
            elif response.status_code == 404:
                print(f"❌ City '{city}' not found")
            else:
                print(f"❌ HTTP error: {err}")
            return None
        except requests.exceptions.RequestException as err:
            print(f"❌ Request failed: {err}")
            return None
    
    def parse_complex_json(self, data):
        """
        Parse nested JSON structures efficiently
        Extract 3 specific related pieces of weather data
        """
        if not data:
            return None
        
        try:
            # Parse nested JSON structures
            parsed_data = {
                # Location data (nested in different levels)
                'location': {
                    'city': data.get('name'),
                    'country': data.get('sys', {}).get('country'),
                    'coordinates': {
                        'lat': data.get('coord', {}).get('lat'),
                        'lon': data.get('coord', {}).get('lon')
                    }
                },
                
                # Weather conditions (array with nested objects)
                'weather': {
                    'main': data.get('weather', [{}])[0].get('main'),
                    'description': data.get('weather', [{}])[0].get('description'),
                    'icon_id': data.get('weather', [{}])[0].get('icon')
                },
                
                # Temperature data (nested in 'main' object)
                'temperature': {
                    'current': data.get('main', {}).get('temp'),
                    'feels_like': data.get('main', {}).get('feels_like'),
                    'min': data.get('main', {}).get('temp_min'),
                    'max': data.get('main', {}).get('temp_max')
                },
                
                # Atmospheric data (nested in 'main' object)
                'atmosphere': {
                    'humidity': data.get('main', {}).get('humidity'),
                    'pressure': data.get('main', {}).get('pressure'),
                    'visibility': data.get('visibility', 0) / 1000  # Convert m to km
                },
                
                # Wind data (nested object)
                'wind': {
                    'speed': data.get('wind', {}).get('speed'),
                    'direction': data.get('wind', {}).get('deg')
                },
                
                # System data (nested timestamps)
                'system': {
                    'sunrise': datetime.fromtimestamp(data.get('sys', {}).get('sunrise', 0)),
                    'sunset': datetime.fromtimestamp(data.get('sys', {}).get('sunset', 0)),
                    'timezone': data.get('timezone', 0)
                }
            }
            
            return parsed_data
            
        except (KeyError, IndexError, TypeError) as e:
            print(f"❌ Error parsing JSON: {e}")
            return None
    
    def display_weather_friendly(self, parsed_data):
        """
        Display formatted results in user-friendly way
        Shows 3 related pieces of specific data
        """
        if not parsed_data:
            print("❌ No weather data to display")
            return
        
        loc = parsed_data['location']
        weather = parsed_data['weather']
        temp = parsed_data['temperature']
        atm = parsed_data['atmosphere']
        wind = parsed_data['wind']
        sys = parsed_data['system']
        
        print("\n" + "="*50)
        print(f"🌍 WEATHER REPORT: {loc['city']}, {loc['country']}")
        print("="*50)
        
        # 1. Temperature Information (related data group 1)
        fire_effect = "🔥🔥🔥" if temp['current'] >= 95 else ""
        print(f"🌡️  TEMPERATURE:")
        print(f"   Current: {temp['current']}°F {fire_effect}")
        print(f"   Feels Like: {temp['feels_like']}°F {fire_effect}")
        print(f"   Range: {temp['min']}°F - {temp['max']}°F")
        
        # 2. Weather Conditions (related data group 2)
        print(f"\n☁️  CONDITIONS:")
        print(f"   Status: {weather['main']}")
        print(f"   Details: {weather['description'].title()}")
        
        # 3. Atmospheric Data (related data group 3)
        print(f"\n💨 ATMOSPHERE:")
        print(f"   Humidity: {atm['humidity']}%")
        print(f"   Pressure: {atm['pressure']} hPa")
        print(f"   Visibility: {atm['visibility']:.1f} km")
        
        # Additional wind information
        if wind['speed']:
            print(f"   Wind: {wind['speed']} m/s")
        
        # Sun times
        print(f"\n🌅 SUN TIMES:")
        print(f"   Sunrise: {sys['sunrise'].strftime('%H:%M')}")
        print(f"   Sunset: {sys['sunset'].strftime('%H:%M')}")
        
        print("="*50)
        
        # Check for extreme heat warning
        self.check_heat_warning(temp['current'])
    
    def get_forecast_data(self, city):
        """
        Get 5-day weather forecast for a city
        """
        params = {
            "q": city,
            "appid": self.api_key,
            "units": "imperial"
        }
        
        try:
            response = requests.get(self.forecast_url, params=params, timeout=10)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as err:
            print(f"❌ Forecast request failed: {err}")
            return None
    
    def parse_forecast_data(self, data):
        """
        Parse forecast data and extract daily forecasts
        """
        if not data:
            return None
        
        daily_forecasts = []
        processed_dates = set()
        
        for item in data['list']:
            date = datetime.fromtimestamp(item['dt'])
            date_string = date.strftime('%Y-%m-%d')
            hour = date.hour
            
            # Take midday forecast (around 12:00) for each day
            if date_string not in processed_dates and 11 <= hour <= 13:
                processed_dates.add(date_string)
                daily_forecasts.append({
                    'date': date,
                    'temp_max': round(item['main']['temp_max']),
                    'temp_min': round(item['main']['temp_min']),
                    'description': item['weather'][0]['description'],
                    'main': item['weather'][0]['main'],
                    'humidity': item['main']['humidity'],
                    'wind_speed': item['wind']['speed']
                })
        
        return daily_forecasts[:5]  # Limit to 5 days
    
    def display_forecast(self, forecast_data):
        """
        Display 5-day forecast in a user-friendly way
        """
        if not forecast_data:
            print("❌ No forecast data available")
            return
        
        print("\n" + "="*60)
        print("📅 5-DAY WEATHER FORECAST")
        print("="*60)
        
        for i, day in enumerate(forecast_data):
            day_name = day['date'].strftime('%A')
            date_str = day['date'].strftime('%B %d')
            
            forecast_fire = "🔥" if day['temp_max'] >= 95 else ""
            print(f"\n📍 {day_name}, {date_str}")
            print("-" * 40)
            print(f"🌡️  Temperature: {day['temp_min']}°F - {day['temp_max']}°F {forecast_fire}")
            print(f"☁️  Condition: {day['main']} - {day['description'].title()}")
            print(f"💧 Humidity: {day['humidity']}%")
            print(f"💨 Wind: {day['wind_speed']} m/s")
        
        print("="*60)
    
    def check_heat_warning(self, temperature):
        """
        Display funny heat warning if temperature is over 95°F
        """
        if temperature >= 95:
            import random
            
            funny_messages = [
                f"🥵 It's {temperature}°F! Time to pretend you're a vampire and avoid sunlight at all costs!",
                f"🔥 {temperature}°F?! Even your phone is probably overheating. Stay hydrated and indoors!",
                f"☀️ {temperature}°F detected! Perfect weather for... absolutely nothing outside. Netflix & AC recommended!",
                f"🌡️ {temperature}°F! Your car's steering wheel is now officially lava. Handle with oven mitts!",
                f"🥤 {temperature}°F! Reminder: You're 60% water, don't become a raisin. Drink up and stay cool!",
                f"🧊 {temperature}°F outside! Time to become one with your air conditioner. Embrace the chill!",
                f"🌞 {temperature}°F! Even the sun is probably feeling guilty right now. Seek shade, brave soul!",
                f"🏜️ {temperature}°F! It's so hot, even the cacti are sweating. Time for indoor hibernation!",
                f"🔥 {temperature}°F! Your ice cream has surrendered before you even bought it!",
                f"🥵 {temperature}°F! Congratulations, you're now living in a natural sauna. Embrace the sweat!"
            ]
            
            random_message = random.choice(funny_messages)
            
            print("\n" + "🚨" * 25)
            print("🔥🔥🔥 EXTREME HEAT ALERT! 🔥🔥🔥")
            print("🚨" * 25)
            print(f"\n{random_message}")
            print("\n💡 SAFETY TIPS:")
            print("   • Stay hydrated - drink water constantly!")
            print("   • Avoid direct sunlight between 10 AM - 4 PM")
            print("   • Use sunscreen SPF 30+ and reapply frequently")
            print("   • Take frequent breaks in shade or A/C")
            print("   • Wear light-colored, loose-fitting clothes")
            print("   • Never leave kids/pets in cars!")
            print("\n" + "🚨" * 25)
            print("STAY COOL AND STAY SAFE! 🧊❄️")
            print("🚨" * 25 + "\n")

def main():
    """Main function to demonstrate the API usage"""
    try:
        # Initialize API with authentication
        weather_api = WeatherAPI()
        
        cities = ["London", "New York", "Tokyo"]
        
        for city in cities:
            print(f"\n🔍 Fetching weather for {city}...")
            
            # 1. Make authenticated API call
            raw_data = weather_api.get_weather_data(city)
            
            # 2. Parse complex JSON structures
            parsed_data = weather_api.parse_complex_json(raw_data)
            
            # 3. Display user-friendly results
            weather_api.display_weather_friendly(parsed_data)
            
            # 4. Get and display 5-day forecast
            print(f"\n🔮 Fetching 5-day forecast for {city}...")
            forecast_raw = weather_api.get_forecast_data(city)
            forecast_data = weather_api.parse_forecast_data(forecast_raw)
            weather_api.display_forecast(forecast_data)
            
    except ValueError as e:
        print(f"❌ Configuration error: {e}")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")

if __name__ == "__main__":
    main()
