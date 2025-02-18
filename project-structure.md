# Project Structure

This document outlines the directory structure of the backend project and describes the purpose of each folder.

## Directory Overview

### 1. `src/common`
Contains shared middleware, error handling utilities, and general helper functions that are used across different parts of the backend.

### 2. `src/config`
Holds configuration files such as environment variables, database connections, authentication settings, and third-party service configurations.

### 3. `src/modules`
This folder organizes the core modules of the backend. Each module should contain its own controllers, services, and routes, following a modular architecture.

### 4. `src/shared`
Stores shared resources such as DTOs (Data Transfer Objects), types, or validation schemas that are used across multiple modules.

### 5. `src/utils`
Contains utility functions, data manipulation helpers, and general-purpose methods that can be reused throughout the backend.

### 6. `src/assets`
This directory is used to store static assets if needed, such as email templates, documentation files, or localization files.


