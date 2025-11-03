import requests

API_KEY = "044c2a14177a4bb0b01110212253009"
BASE_URL = "https://api.weatherapi.com/v1/current.json"

# Change this to your desired location
location = "Bergen"

# Make the request
response = requests.get(BASE_URL, params={
    "key": API_KEY,
    "q": location
})

# Parse JSON
data = response.json()

# Extract condition text (e.g., "Light rain", "Sunny", etc.)
condition = data["current"]["condition"]["text"]

# Determine if it's raining
if "rain" in condition.lower():
    print("\033[91mRED - It's raining!\033[0m")   
else:
    print("\033[92mGREEN - No rain.\033[0m")  
