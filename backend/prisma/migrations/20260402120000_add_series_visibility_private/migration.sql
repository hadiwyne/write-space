-- Add PRIVATE value to SeriesVisibility enum
ALTER TYPE "SeriesVisibility" ADD VALUE IF NOT EXISTS 'PRIVATE';
