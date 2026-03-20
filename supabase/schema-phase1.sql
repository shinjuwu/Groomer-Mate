-- Phase 1: Customers & Pets schema migration
-- Run AFTER schema.sql has been applied

-- ============================================
-- customers table
-- ============================================
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    line_id TEXT,
    notes TEXT
);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deny all direct access" ON public.customers
    FOR ALL
    USING (false)
    WITH CHECK (false);

CREATE INDEX IF NOT EXISTS idx_customers_user_id
    ON public.customers (user_id);

CREATE INDEX IF NOT EXISTS idx_customers_user_name
    ON public.customers (user_id, name);

-- ============================================
-- pets table
-- ============================================
CREATE TABLE IF NOT EXISTS public.pets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    species TEXT DEFAULT '狗',
    breed TEXT,
    weight_kg NUMERIC(5,2),
    birth_date DATE,
    notes TEXT
);

ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deny all direct access" ON public.pets
    FOR ALL
    USING (false)
    WITH CHECK (false);

CREATE INDEX IF NOT EXISTS idx_pets_customer_id
    ON public.pets (customer_id);

CREATE INDEX IF NOT EXISTS idx_pets_user_id
    ON public.pets (user_id);

-- ============================================
-- grooming_logs: add pet_id column
-- ============================================
ALTER TABLE public.grooming_logs
    ADD COLUMN IF NOT EXISTS pet_id UUID REFERENCES public.pets(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_grooming_logs_pet_id
    ON public.grooming_logs (pet_id);

-- ============================================
-- Storage: allow service-role uploads to audio_uploads bucket
-- ============================================
DROP POLICY IF EXISTS "Deny all storage access" ON storage.objects;

CREATE POLICY "Service role upload only" ON storage.objects
    FOR ALL
    USING (bucket_id = 'audio_uploads' AND auth.role() = 'service_role')
    WITH CHECK (bucket_id = 'audio_uploads' AND auth.role() = 'service_role');
