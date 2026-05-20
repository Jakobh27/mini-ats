# Database Schema (Supabase)
- profiles (id, role: 'admin' | 'customer', company_name)
- jobs (id, customer_id, title, description, created_at)
- candidates (id, job_id, customer_id, name, linkedin_url, stage: 'Ny' | 'Intervju' | 'Anställd', created_at)