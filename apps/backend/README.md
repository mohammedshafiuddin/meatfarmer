# Health Petal Database

This project contains the database schema, seed data, and related tools for the Health Petal application.

## Setup

1. Make sure PostgreSQL is installed and running on your machine
2. Create a database named `health_petal`
3. Configure your `.env` file with the correct database credentials (or use the default ones)

## Database Schema

The database schema includes the following tables:
- profiles (users)
- role_info
- user_roles
- hospital
- specializations
- hospital_specializations
- hospital_employees
- doctor_info
- doctor_specializations
- doctor_secretaries
- doctor_availability
- token_info
- running_counter

## Available Commands

- `npm run migrate` - Generate SQL migration files
- `npm run db:push` - Push schema changes to the database
- `npm run db:seed` - Seed the database with mock data
- `npm run docker:build` - Build Docker image for the backend

## Getting Started

1. First, install dependencies:
   ```
   npm install
   ```

2. Set up the database:
   ```
   # Create a PostgreSQL database
   createdb health_petal
   
   # Generate and push the schema
   npm run migrate
   npm run db:push
   
   # Seed the database with test data
   npm run db:seed
   ```

3. Verify the data:
   ```sql
   -- Connect to the database
   psql health_petal
   
   -- Check the tables
   \dt
   
   -- Check users
   SELECT * FROM profiles;
   
   -- Check doctors
   SELECT p.name, p.email, d.qualifications, d.daily_token_count
   FROM doctor_info d
   JOIN profiles p ON d.user_id = p.id;
   
   -- Check doctor specializations
   SELECT p.name, s.name as specialization
   FROM doctor_specializations ds
   JOIN doctor_info d ON ds.doctor_id = d.id
   JOIN profiles p ON d.user_id = p.id
   JOIN specializations s ON ds.specialization_id = s.id;
   ```

## Docker

This project includes Docker support for easy deployment:

1. Build the Docker image:
   ```
   npm run docker:build
   ```

2. Run with Docker Compose (includes PostgreSQL database):
   ```
   docker-compose up -d
   ```

The Docker Compose setup includes:
- PostgreSQL database with the correct schema
- Backend application with all environment variables configured

Note: For production deployment, make sure to update the environment variables in docker-compose.yml with your actual values.
