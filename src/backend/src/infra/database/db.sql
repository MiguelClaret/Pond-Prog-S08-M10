CREATE SCHEMA IF NOT EXISTS public;
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA public;

-- =========================
-- ENUMS
-- =========================

CREATE TYPE public.user_role AS ENUM ('PATIENT', 'PSYCHOLOGIST');

CREATE TYPE public.session_type AS ENUM ('ONLINE', 'IN_PERSON');

CREATE TYPE public.session_status AS ENUM ('SCHEDULED', 'DONE', 'CANCELED');

-- =========================
-- USERS
-- =========================

CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT public.gen_random_uuid(),

    name VARCHAR(150) NOT NULL,
    email VARCHAR(180) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,

    role public.user_role NOT NULL,

    first_access BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================
-- PATIENT PROFILES
-- Vínculo entre psicóloga e paciente
-- =========================

CREATE TABLE public.patient_profiles (
    id UUID PRIMARY KEY DEFAULT public.gen_random_uuid(),

    psychologist_id UUID NOT NULL,
    patient_user_id UUID NOT NULL,

    phone VARCHAR(30),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_patient_profiles_psychologist
        FOREIGN KEY (psychologist_id)
        REFERENCES public.users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_patient_profiles_patient_user
        FOREIGN KEY (patient_user_id)
        REFERENCES public.users(id)
        ON DELETE CASCADE,

    CONSTRAINT unique_psychologist_patient
        UNIQUE (psychologist_id, patient_user_id)
);

-- =========================
-- DIARY ENTRIES
-- =========================

CREATE TABLE public.diary_entries (
    id UUID PRIMARY KEY DEFAULT public.gen_random_uuid(),

    patient_id UUID NOT NULL,

    title VARCHAR(180),
    text TEXT,

    mood VARCHAR(80) NOT NULL,
    intensity INTEGER NOT NULL,

    audio_url TEXT,

    is_shared_with_psychologist BOOLEAN NOT NULL DEFAULT FALSE,

    weather_temperature DECIMAL(5,2),
    weather_description VARCHAR(120),
    latitude DECIMAL(10,7),
    longitude DECIMAL(10,7),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_diary_entries_patient
        FOREIGN KEY (patient_id)
        REFERENCES public.users(id)
        ON DELETE CASCADE,

    CONSTRAINT check_diary_intensity
        CHECK (intensity >= 1 AND intensity <= 5),

    CONSTRAINT check_diary_content
        CHECK (
            text IS NOT NULL
            OR audio_url IS NOT NULL
        )
);

-- =========================
-- THERAPY SESSIONS
-- =========================

CREATE TABLE public.therapy_sessions (
    id UUID PRIMARY KEY DEFAULT public.gen_random_uuid(),

    patient_profile_id UUID NOT NULL,

    scheduled_at TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 50,

    type public.session_type NOT NULL DEFAULT 'ONLINE',
    status public.session_status NOT NULL DEFAULT 'SCHEDULED',

    notes TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_therapy_sessions_patient_profile
        FOREIGN KEY (patient_profile_id)
        REFERENCES public.patient_profiles(id)
        ON DELETE CASCADE,

    CONSTRAINT check_session_duration
        CHECK (duration_minutes > 0)
);


-- =========================
-- UPDATED_AT AUTOMÁTICO
-- =========================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_patient_profiles_updated_at
BEFORE UPDATE ON public.patient_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_diary_entries_updated_at
BEFORE UPDATE ON public.diary_entries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_therapy_sessions_updated_at
BEFORE UPDATE ON public.therapy_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();