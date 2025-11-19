
-- Fix networking_events table columns
DO $$ 
BEGIN
    -- Add organizerId if it doesn't exist (and remove organizer_id if it exists)
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'networking_events' AND column_name = 'organizer_id') THEN
        ALTER TABLE networking_events RENAME COLUMN organizer_id TO "organizerId";
    END IF;

    -- Add organizerId if it doesn't exist at all
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'networking_events' AND column_name = 'organizerId') THEN
        ALTER TABLE networking_events ADD COLUMN "organizerId" VARCHAR NOT NULL REFERENCES users(id);
    END IF;

    -- Add attendeesCount if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'networking_events' AND column_name = 'attendeesCount') THEN
        ALTER TABLE networking_events ADD COLUMN "attendeesCount" INTEGER DEFAULT 0 NOT NULL;
    END IF;

    -- Add eventDate if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'networking_events' AND column_name = 'eventDate') THEN
        ALTER TABLE networking_events ADD COLUMN "eventDate" TIMESTAMP NOT NULL DEFAULT NOW();
    END IF;

    -- Add other missing columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'networking_events' AND column_name = 'eventType') THEN
        ALTER TABLE networking_events ADD COLUMN "eventType" VARCHAR DEFAULT 'virtual';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'networking_events' AND column_name = 'capacity') THEN
        ALTER TABLE networking_events ADD COLUMN capacity INTEGER;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'networking_events' AND column_name = 'registrationUrl') THEN
        ALTER TABLE networking_events ADD COLUMN "registrationUrl" VARCHAR;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'networking_events' AND column_name = 'status') THEN
        ALTER TABLE networking_events ADD COLUMN status VARCHAR DEFAULT 'upcoming';
    END IF;
END $$;

-- Add indexes if they don't exist
CREATE INDEX IF NOT EXISTS "idx_networking_events_organizer" ON networking_events("organizerId");
CREATE INDEX IF NOT EXISTS "idx_networking_events_date" ON networking_events("eventDate");
CREATE INDEX IF NOT EXISTS "idx_networking_events_status" ON networking_events(status);

-- Fix networking_event_attendees table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'networking_event_attendees' AND column_name = 'status') THEN
        ALTER TABLE networking_event_attendees ADD COLUMN status VARCHAR DEFAULT 'registered';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'networking_event_attendees' AND column_name = 'attended') THEN
        ALTER TABLE networking_event_attendees ADD COLUMN attended BOOLEAN DEFAULT false;
    END IF;
END $$;
