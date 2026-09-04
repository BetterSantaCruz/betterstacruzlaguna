-- OpenLGU Baseline Data — intentionally empty until reviewed records exist
-- Migration: 002_baseline_data.sql
--
-- This migration preserves the reusable migration boundary without seeding
-- unverified terms, people, memberships, or committees into the Santa Cruz
-- database.
--
-- Run AFTER 001_initial_schema.sql and BEFORE data migration script.

INSERT INTO schema_migrations (name) VALUES ('001_initial_schema.sql');
INSERT INTO schema_migrations (name) VALUES ('002_baseline_data.sql');
