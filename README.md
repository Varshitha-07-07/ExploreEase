# ExploreEase – Travel Planner

ExploreEase is a travel planning web application that helps users discover places, plan trips, and estimate travel budgets.

## Features

- Search for places in different cities
- Explore restaurants, malls, cafes, colleges, and more
- Create trip itineraries
- Estimate hotel, transport, food, activity, and shopping costs
- Set a per-person trip budget
- Save and view planned trips
- View places and directions using Google Maps links

## Technologies Used

- HTML
- CSS
- JavaScript
- Node.js
- Express.js
- Geoapify Places API
- Local Storage

## Project Setup

### 1. Install Node.js

Install Node.js if it is not already installed.

### 2. Open the project folder

Open the ExploreEase folder in VS Code.

### 3. Install dependencies

Open the terminal and run:

```bash
npm install
```

### 4. Configure the API key

Create a `.env` file in the project root and add your Geoapify API key using the environment variable name expected by `server.js`.

**Important:** Do not upload your API key or `.env` file to GitHub.

### 5. Start the application

Run:

```bash
npm start
```

Keep the terminal open while using the application.

### 6. Open the website

Open the `index.html` file in your browser using VS Code Live Server or your existing local setup.

The backend API runs on port 3000 by default.

## Offline Support

Trip budget calculations and saved trips may work locally, but place searches and online map services require an internet connection.

## Future Improvements

- Weather forecasts for selected destinations
- Improved offline support
- Responsive mobile design
- More travel recommendations

## Author

ExploreEase Project
