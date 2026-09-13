# Technical Specification

## Introduction
The goal of this project is to create a personal companion app that syncs with Google Tasks for tracking Pomodoros and visualizing daily focus via a heatmap.

## Core Features
1. GTasks OAuth integration & task fetching.
2. Estimated vs. actual Pomodoro count tracking per task.
3. Interactive Pomodoro timer tied to selected task.
4. GitLab-style daily Pomodoro completion heatmap (darker shade = higher completed Pomodoros).

## Database Schema (Convex)
### tasks
- gtask_id
- title
- estimated_pomos
- completed_pomos
- status

### pomodoro_sessions
- task_id
- duration_minutes
- completed_at (timestamp for heatmap aggregation)

## OAuth Integration Strategy
To integrate with Google Tasks API, we will use the OAuth 2.0 authorization framework. The app will redirect the user to the Google authentication page, where they will grant access to their Google Tasks account. After authorization, the app will receive an access token, which will be used to fetch tasks and update task status.

## Heatmap Visualization Approach
We will use the react-activity-calendar library to create a GitLab-style daily Pomodoro completion heatmap. The heatmap will display the number of completed Pomodoros for each day, with darker shades indicating more completed Pomodoros. The library will be configured to fetch data from the pomodoro_sessions table in the Convex database.

## Component Hierarchy and Next.js App Router Structure
The app will have the following component hierarchy:
- App
  - Header
  - TaskList
    - Task
  - PomodoroTimer
  - Heatmap

The Next.js App Router structure will be as follows:
- /
  - TaskList
- /tasks/:id
  - Task
- /pomodoro
  - PomodoroTimer
- /heatmap
  - Heatmap

## Routing Structure
Change from multi-page routing to a single-page unified dashboard (/) containing Header, TaskList, PomodoroTimer, and Heatmap on one screen.
## Convex Schema
Define strict TypeScript schema types using Convex validators (defineTable, v.string(), v.number(), v.id()).
## Google OAuth
Add offline access (access_type: 'offline', prompt: 'consent') to ensure refresh tokens are stored for background Google Tasks API syncs.
## Heatmap Data Pipeline
Detail a Convex query that aggregates pomodoro_sessions timestamps into YYYY-MM-DD string counts formatted specifically for react-activity-calendar.