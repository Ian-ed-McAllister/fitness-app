# FitTrack

A personal fitness tracking app built with React Native and Expo. All data is stored locally on-device — no account required.

## Why I Built This

I wanted a simple way to track my workouts, but every app I tried was bloated with features I had no interest in using. So I built my own — focused on what actually matters to me, without the noise.

## What It Does

- Track daily food intake with calorie and macro breakdowns
- Scan barcodes to log food instantly
- Log daily water intake against a personal goal
- Record body weight over time and visualise the trend
- Create workout templates and log live sessions with a timer
- Detect and track personal records per exercise
- View progress charts for calories, weight, and training volume
- Set body goals and activity level to get a personalised calorie target
- Track logging, workout, and hydration streaks

## Features

### Nutrition Tracking
- Log meals across Breakfast, Lunch, Dinner, and Snacks
- Search a built-in food database or create custom foods
- Scan barcodes to pull nutritional data automatically
- Save multi-item meals for quick re-logging
- Daily macro breakdown (calories, protein, carbs, fat) with a visual ring
- Custom meal slot names

### Water Tracking
- Quick-add buttons (+200ml, +350ml, +500ml, +750ml) on the Nutrition tab
- Set a daily water goal
- Daily progress bar and streak tracking

### Weight Tracking
- Log daily weight in kg or lbs
- Line chart with 30 / 60 / 90 day views
- 7-day rolling average overlay to smooth out daily noise
- Goal-aware colour logic — weight change is shown as positive or negative based on whether your goal is to lose, maintain, or gain

### Workouts
- Create reusable workout templates with exercises, sets, reps, and default weights
- Start a live session with a running timer
- Previous session data shown as a guide while logging sets
- Automatic personal record (PR) detection per exercise
- Session history per template

### Progress
- Calorie bar chart (last 7 days)
- Weight trend over time
- Personal records leaderboard by exercise
- Volume chart (total weight lifted over time)

### Profile & Goals
- Set your display name, date of birth, biological sex, and height
- TDEE estimate using Mifflin-St Jeor formula based on your stats
- One-tap apply to set your calorie goal to the suggested estimate
- Body goal picker: Lose Fat · Maintain · Gain Muscle · Bulk · Recomp
- Activity level picker (Sedentary → Athlete)
- Weekly workout target with progress bar
- Goal weight with progress tracking
- Logging streak, workout streak, and hydration streak

### General
- Fully offline — all data stored locally via SQLite
- Dark theme throughout
- Haptic feedback on set completion

## Tech Stack

- React Native + Expo (SDK 54)
- Expo Router (file-based navigation)
- expo-sqlite for local storage
- Zustand for state management
- react-native-svg for charts
- date-fns for date utilities
- expo-camera for barcode scanning

## Package

`com.ianmc.fittrack`
