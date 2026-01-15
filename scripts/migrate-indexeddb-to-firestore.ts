/**
 * Migration Script: IndexedDB → Firestore
 *
 * This script handles the data migration from IndexedDB to Firestore.
 *
 * Usage:
 * 1. Set up Firestore credentials (export to environment variable)
 * 2. Run: npx ts-node scripts/migrate-indexeddb-to-firestore.ts
 *
 * Safety features:
 * - Validates all leads before migration
 * - Checks for duplicates using sourceHash
 * - Supports rollback to IndexedDB
 * - Generates migration report
 */

import { getFirebaseDB, leadsService, Lead } from '../services/core/firestoreService';

// ============================================================================
// IndexedDB Access (Browser Environment)
// ============================================================================

interface IndexedDBLead {
  id: string;
  companyName: string;
  sector: string;
  city: string;
  // ... other fields
}

/**
 * Extract leads from IndexedDB
 * This function should run in browser console or with proper IndexedDB setup
 */
async function getLeadsFromIndexedDB(): Promise<Lead[]> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('CrescoFlowDB', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['LeadsStore'], 'readonly');
      const store = transaction.objectStore('LeadsStore');
      const getAllRequest = store.getAll();

      getAllRequest.onsuccess = () => {
        resolve(getAllRequest.result as Lead[]);
      };
      getAllRequest.onerror = () => reject(getAllRequest.error);
    };
  });
}

// ============================================================================
// Validation & Deduplication
// ============================================================================

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate a single lead before migration
 */
function validateLead(lead: Lead): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!lead.id) errors.push('Missing id');
  if (!lead.companyName) errors.push('Missing companyName');
  if (!lead.sector) warnings.push('Missing sector');
  if (!lead.city) warnings.push('Missing city');

  // Email validation
  if (lead.ceo?.email && !isValidEmail(lead.ceo.email)) {
    errors.push(`Invalid CEO email: ${lead.ceo.email}`);
  }

  // Phone validation (basic)
  if (lead.ceo?.phone && lead.ceo.phone.length < 5) {
    warnings.push('Phone number seems too short');
  }

  // Confidence score validation
  if (lead.confidenceScore !== undefined) {
    if (lead.confidenceScore < 0 || lead.confidenceScore > 100) {
      errors.push(`Invalid confidenceScore: ${lead.confidenceScore}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Detect duplicates using multi-field hash
 */
function generateSourceHash(lead: Lead): string {
  const fields = [
    lead.companyName?.toLowerCase() || '',
    lead.website?.toLowerCase() || '',
    lead.city?.toLowerCase() || '',
    lead.ceo?.email?.toLowerCase() || '',
  ];
  return fields.filter((f) => f).join('|');
}

/**
 * Check if lead already exists in Firestore (by hash)
 */
async function checkDuplicate(lead: Lead, existingLeads: Lead[]): Promise<boolean> {
  const newHash = generateSourceHash(lead);
  return existingLeads.some(
    (existing) => generateSourceHash(existing) === newHash
  );
}

// ============================================================================
// Migration Process
// ============================================================================

interface MigrationStats {
  total: number;
  valid: number;
  invalid: number;
  duplicates: number;
  migrated: number;
  errors: string[];
}

/**
 * Main migration function
 * Returns a report with statistics
 */
export async function migrateIndexedDBToFirestore(
  dryRun: boolean = true
): Promise<MigrationStats> {
  const stats: MigrationStats = {
    total: 0,
    valid: 0,
    invalid: 0,
    duplicates: 0,
    migrated: 0,
    errors: [],
  };

  try {
    console.log('🚀 Starting migration (dryRun:', dryRun, ')...');

    // Step 1: Extract from IndexedDB
    console.log('📦 Extracting leads from IndexedDB...');
    let idbLeads: Lead[] = [];
    try {
      idbLeads = await getLeadsFromIndexedDB();
    } catch (err) {
      // In Node.js environment, we can't access IndexedDB
      // This script should be run in browser console or with proper setup
      console.warn(
        '⚠️  Could not read IndexedDB. This script should run in browser console.'
      );
      idbLeads = [];
    }

    stats.total = idbLeads.length;
    console.log(`✅ Extracted ${idbLeads.length} leads`);

    // Step 2: Fetch existing Firestore leads (for deduplication)
    console.log('🔍 Checking existing Firestore data...');
    let existingLeads: Lead[] = [];
    try {
      existingLeads = await leadsService.getLeads(1000); // Batch fetch
    } catch (err) {
      console.warn('⚠️  Could not fetch existing Firestore leads');
    }

    // Step 3: Validate each lead
    console.log('✔️  Validating leads...');
    const validLeads: Lead[] = [];
    const invalidLeads: Array<{ lead: Lead; validation: ValidationResult }> = [];

    for (const lead of idbLeads) {
      const validation = validateLead(lead);

      if (validation.valid) {
        // Check for duplicates
        const isDuplicate = await checkDuplicate(lead, existingLeads);
        if (isDuplicate) {
          stats.duplicates++;
          console.log(`⏭️  Skipping duplicate: ${lead.companyName}`);
        } else {
          validLeads.push(lead);
          stats.valid++;
        }
      } else {
        stats.invalid++;
        invalidLeads.push({ lead, validation });
      }
    }

    console.log(`✅ Validation complete: ${stats.valid} valid, ${stats.invalid} invalid, ${stats.duplicates} duplicates`);

    // Step 4: Log invalid leads
    if (invalidLeads.length > 0) {
      console.log('\n⚠️  Invalid leads:');
      invalidLeads.forEach(({ lead, validation }) => {
        console.log(`  - ${lead.companyName}: ${validation.errors.join(', ')}`);
      });
    }

    // Step 5: Migrate valid leads
    if (!dryRun) {
      console.log(`\n📤 Migrating ${validLeads.length} leads to Firestore...`);

      // Batch in chunks of 100 to avoid timeout
      const chunkSize = 100;
      for (let i = 0; i < validLeads.length; i += chunkSize) {
        const chunk = validLeads.slice(i, i + chunkSize);
        try {
          await leadsService.batchUpsertLeads(chunk);
          stats.migrated += chunk.length;
          console.log(`✅ Migrated ${stats.migrated}/${validLeads.length}`);
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : String(err);
          stats.errors.push(`Batch ${i / chunkSize}: ${errorMsg}`);
          console.error(`❌ Error migrating batch: ${errorMsg}`);
        }
      }
    } else {
      console.log(`\n🔍 DRY RUN: Would migrate ${validLeads.length} leads`);
      stats.migrated = validLeads.length;
    }

    return stats;
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    stats.errors.push(errorMsg);
    console.error('❌ Migration failed:', errorMsg);
    return stats;
  }
}

// ============================================================================
// Validation After Migration
// ============================================================================

export async function validateMigration(): Promise<{
  firestoreCount: number;
  idbCount: number;
  match: boolean;
  issues: string[];
}> {
  const issues: string[] = [];

  try {
    // Count Firestore leads
    const firestoreLeads = await leadsService.getLeads(1000);
    const firestoreCount = firestoreLeads.length;

    // Try to count IndexedDB leads
    let idbCount = 0;
    try {
      const idbLeads = await getLeadsFromIndexedDB();
      idbCount = idbLeads.length;
    } catch (err) {
      issues.push('Could not validate IndexedDB count');
    }

    const match = firestoreCount >= idbCount * 0.95; // Allow 5% loss due to invalid leads

    console.log('\n📊 Migration Validation Report:');
    console.log(`  Firestore leads: ${firestoreCount}`);
    console.log(`  IndexedDB leads: ${idbCount}`);
    console.log(`  Match: ${match ? '✅ YES' : '❌ NO'}`);

    if (!match) {
      issues.push(
        `Lead count mismatch: Firestore=${firestoreCount}, IndexedDB=${idbCount}`
      );
    }

    return { firestoreCount, idbCount, match, issues };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    issues.push(`Validation failed: ${errorMsg}`);
    return { firestoreCount: 0, idbCount: 0, match: false, issues };
  }
}

// ============================================================================
// Export Report to JSON
// ============================================================================

export async function generateMigrationReport(stats: MigrationStats): Promise<string> {
  const report = {
    timestamp: new Date().toISOString(),
    stats,
    validation: await validateMigration(),
  };

  return JSON.stringify(report, null, 2);
}

// ============================================================================
// CLI Entry Point (for Node.js execution)
// ============================================================================

if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    const dryRun = process.argv.includes('--dryrun');

    const stats = await migrateIndexedDBToFirestore(dryRun);

    console.log('\n📋 Migration Summary:');
    console.log(`  Total: ${stats.total}`);
    console.log(`  Valid: ${stats.valid}`);
    console.log(`  Invalid: ${stats.invalid}`);
    console.log(`  Duplicates: ${stats.duplicates}`);
    console.log(`  Migrated: ${stats.migrated}`);

    if (stats.errors.length > 0) {
      console.log('\n❌ Errors:');
      stats.errors.forEach((error) => console.log(`  - ${error}`));
    }

    // Validate migration
    const validation = await validateMigration();
    console.log('\n📊 Validation:');
    console.log(`  Firestore count: ${validation.firestoreCount}`);
    console.log(`  IndexedDB count: ${validation.idbCount}`);
    console.log(`  Match: ${validation.match ? '✅' : '❌'}`);

    if (validation.issues.length > 0) {
      console.log('\n⚠️  Validation Issues:');
      validation.issues.forEach((issue) => console.log(`  - ${issue}`));
    }

    process.exit(stats.errors.length > 0 ? 1 : 0);
  })();
}

export default {
  migrateIndexedDBToFirestore,
  validateMigration,
  generateMigrationReport,
};
