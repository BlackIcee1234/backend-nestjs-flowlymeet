# Supabase Setup and Migration Guide

This directory contains the Supabase configuration and database migration files for the FlowlyMeet backend.

## Project Structure

```
supabase/
├── config.toml         # Supabase configuration
├── migrations/         # Database migrations
│   └── 20240101000000_initial_schema.sql
└── seed.sql           # Seed data for development
```

## Getting Started

1. Install Supabase CLI:
```bash
npm install -g supabase
```

2. Login to Supabase:
```bash
supabase login
```

3. Link your project:
```bash
supabase link --project-ref your-project-ref
```

## Working with Migrations

### Create a New Migration

```bash
supabase migration new your_migration_name
```

### Apply Migrations

```bash
supabase db push
```

### Reset Database

```bash
supabase db reset
```

### Generate Types

```bash
supabase gen types typescript --local > src/types/supabase.ts
```

## Development Workflow

1. Create a new migration when making database changes
2. Test migrations locally
3. Push changes to the remote database
4. Generate updated TypeScript types

## Notes

- Always backup your database before applying migrations
- Test migrations in a development environment first
- Keep migrations idempotent when possible
- Use `supabase db reset` carefully as it will clear all data