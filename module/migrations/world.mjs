import { SYSTEM_ID } from "../config.mjs";

/**
 * One-time world migration (dnd5e pattern; see z/phase-9a-impl-plan.md 9a-1).
 *
 * WHY a blanket re-save: on the client, a constructed document's _source has
 * already been passed through migrateData + schema cleaning — legacy shapes
 * exist only in the raw DB, which client code cannot inspect. Re-saving the
 * source therefore IS the migration; the systemMigrationVersion world setting
 * guarantees it happens once per needs-migration version. Re-saving is
 * idempotent, so a failed or interrupted pass simply retries next launch.
 *
 * Deliberately OUT OF SCOPE:
 * - Unlinked-token ActorDeltas: a {diff:false} full-object write against a
 *   synthetic token actor would convert a sparse delta into a total override,
 *   decoupling the token from future base-actor edits. Deltas keep being
 *   migrated in memory by migrateData on every construction, which is safe
 *   indefinitely.
 * - Compendium packs: system packs ship in current shape; world packs receive
 *   core + migrateData treatment on read, and rewriting GM-owned packs
 *   unprompted is not this system's call to make.
 */

/** The newest system version whose migrations must be persisted by a re-save. */
export const NEEDS_MIGRATION_VERSION = "0.4.0";

/**
 * Does a world whose stamp is `storedVersion` need the one-time pass?
 * @param {string} storedVersion  The systemMigrationVersion world setting ("" = never stamped).
 * @param {(v1: string, v0: string) => boolean} [isNewer]  Injected for node testing.
 * @returns {boolean}
 */
export function needsMigration(storedVersion, isNewer = (a, b) => foundry.utils.isNewerVersion(a, b)) {
	return !storedVersion || isNewer(NEEDS_MIGRATION_VERSION, storedVersion);
}

/** Full-source write options: replace, don't merge, don't spam renders. */
const WRITE_OPTS = { diff: false, recursive: false, render: false };

/**
 * Re-save every world actor and item so the migrated in-memory source becomes
 * the stored source. Never throws for a single bad document.
 * @returns {Promise<{migrated: number, failed: number}>}
 */
export async function migrateWorld() {
	const version = game.system.version;
	ui.notifications.info(game.i18n.format("HELLAS.migration.begun", { version }));

	let migrated = 0;
	let failed = 0;

	// toObject(true): explicit source serialization — derived values
	// (skillid, fullName, level.max recomputation, modifiers.armor) never
	// reach the DB because they are not part of the source.
	for ( const item of game.items ) {
		try {
			const data = item.toObject(true);
			delete data.effects;
			await item.update(data, WRITE_OPTS);
			migrated++;
		} catch(err) {
			failed++;
			console.error(`HELLAS migration failed for Item ${item.id} (${item.name})`, err);
		}
	}

	for ( const actor of game.actors ) {
		try {
			const data = actor.toObject(true);
			delete data.items;
			delete data.effects;
			await actor.update(data, WRITE_OPTS);
			if ( actor.items.size ) {
				await actor.updateEmbeddedDocuments("Item", actor.items.map(i => {
					const d = i.toObject(true);
					delete d.effects;
					return d;
				}), WRITE_OPTS);
			}
			migrated += 1 + actor.items.size;
		} catch(err) {
			failed++;
			console.error(`HELLAS migration failed for Actor ${actor.id} (${actor.name})`, err);
		}
	}

	if ( failed ) {
		ui.notifications.warn(game.i18n.format("HELLAS.migration.completedWithFailures", {
			version, count: migrated, failed
		}));
	}
	else {
		ui.notifications.info(game.i18n.format("HELLAS.migration.completed", {
			version, count: migrated
		}));
	}
	return { migrated, failed };
}

/**
 * The ready-hook entry point: run the pass once per needs-migration version,
 * from a single GM client, stamping only after a zero-failure pass.
 */
export async function migrateWorldIfNeeded() {
	if ( game.users.activeGM !== game.user ) return;
	const stored = game.settings.get(SYSTEM_ID, "systemMigrationVersion");
	if ( !needsMigration(stored) ) return;

	const isFresh = !stored && !game.actors.size && !game.items.size && !game.scenes.size;
	let ok = true;
	if ( !isFresh ) {
		const { failed } = await migrateWorld();
		ok = failed === 0;
	}
	if ( ok ) await game.settings.set(SYSTEM_ID, "systemMigrationVersion", game.system.version);
}
