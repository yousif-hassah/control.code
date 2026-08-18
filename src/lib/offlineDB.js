// ============================================================
// offlineDB.js — نظام Offline الكامل باستخدام IndexedDB
// يعمل بدون انترنت ويزامن البيانات عند العودة للاتصال
// ============================================================

const DB_NAME = 'ControlOfflineDB';
const DB_VERSION = 3;

const STORES = {
  todos: 'todos',
  journals: 'journals',
  pinnedNotes: 'pinned_notes',
  wikiPages: 'wiki_pages',
  kanbanTasks: 'kanban_tasks',
  kanbanBoards: 'kanban_boards',
  kanbanColumns: 'kanban_columns',
  teamEvents: 'team_events',
  timeLogs: 'time_logs',
  files: 'workspace_files',
  syncQueue: 'sync_queue',
  notifications: 'notifications',
  groups: 'groups',
  profiles: 'profiles',
  chatMessages: 'chat_messages',
  chatOutbox: 'chat_outbox',
  processedMsgIds: 'processed_msg_ids',
  deviceIdentities: 'device_identities',
};

// ── Open / Initialize DB ───────────────────────────────────
let dbInstance = null;

export const openDB = () => {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Create all object stores
      Object.values(STORES).forEach((storeName) => {
        if (!db.objectStoreNames.contains(storeName)) {
          const store = db.createObjectStore(storeName, {
            keyPath: 'id',
            autoIncrement: false,
          });

          // Add indexes per store
          if (storeName === 'todos') {
            store.createIndex('user_id', 'user_id', { unique: false });
            store.createIndex('date', 'date', { unique: false });
          }
          if (storeName === 'journals') {
            store.createIndex('user_id', 'user_id', { unique: false });
            store.createIndex('date', 'date', { unique: false });
          }
          if (storeName === 'kanban_tasks') {
            store.createIndex('column_id', 'column_id', { unique: false });
            store.createIndex('board_id', 'board_id', { unique: false });
            store.createIndex('assigned_to', 'assigned_to', { unique: false });
          }
          if (storeName === 'wiki_pages') {
            store.createIndex('group_id', 'group_id', { unique: false });
            store.createIndex('parent_id', 'parent_id', { unique: false });
          }
          if (storeName === 'sync_queue') {
            store.createIndex('synced', 'synced', { unique: false });
            store.createIndex('table_name', 'table_name', { unique: false });
          }
          if (storeName === 'groups') {
            store.createIndex('created_by', 'created_by', { unique: false });
          }
          if (storeName === 'chat_messages') {
            store.createIndex('conversationId', 'conversationId', { unique: false });
            store.createIndex('createdAt', 'createdAt', { unique: false });
            store.createIndex('status', 'status', { unique: false });
          }
          if (storeName === 'chat_outbox') {
            store.createIndex('conversationId', 'conversationId', { unique: false });
            store.createIndex('status', 'status', { unique: false });
          }
          if (storeName === 'processed_msg_ids') {
            store.createIndex('processedAt', 'processedAt', { unique: false });
          }
        }
      });
    };

    request.onsuccess = (event) => {
      dbInstance = event.target.result;
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      console.error('❌ IndexedDB open error:', event.target.error);
      reject(event.target.error);
    };
  });
};

// ── Generic CRUD Operations ────────────────────────────────

export const dbGet = async (storeName, id) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
};

export const dbGetAll = async (storeName, indexName = null, indexValue = null) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    let req;
    if (indexName && indexValue !== null) {
      const index = store.index(indexName);
      req = index.getAll(indexValue);
    } else {
      req = store.getAll();
    }
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
};

export const dbPut = async (storeName, record) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    // Ensure record has an id
    if (!record.id) {
      record.id = crypto.randomUUID ? crypto.randomUUID() : `local_${Date.now()}_${Math.random()}`;
    }
    const req = store.put({ ...record, _updatedAt: Date.now() });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
};

export const dbPutMany = async (storeName, records) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    let count = 0;
    records.forEach((record) => {
      if (!record.id) record.id = `local_${Date.now()}_${Math.random()}`;
      store.put({ ...record, _updatedAt: Date.now() });
      count++;
    });
    tx.oncomplete = () => resolve(count);
    tx.onerror = () => reject(tx.error);
  });
};

export const dbDelete = async (storeName, id) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.delete(id);
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
};

export const dbClear = async (storeName) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.clear();
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
};

// ── Sync Queue Management ─────────────────────────────────

export const addToSyncQueue = async (operation) => {
  // operation: { table_name, operation: 'insert'|'update'|'delete', record_id, payload, user_id }
  const entry = {
    id: `sync_${Date.now()}_${Math.random()}`,
    ...operation,
    synced: false,
    created_at: new Date().toISOString(),
  };
  await dbPut(STORES.syncQueue, entry);
  return entry;
};

export const getPendingSyncItems = async () => {
  return dbGetAll(STORES.syncQueue, 'synced', false);
};

export const markSynced = async (id) => {
  const item = await dbGet(STORES.syncQueue, id);
  if (item) {
    await dbPut(STORES.syncQueue, { ...item, synced: true });
  }
};

// ── Main Sync Engine ──────────────────────────────────────

export const syncToSupabase = async (supabase, userId) => {
  if (!navigator.onLine) return { synced: 0, failed: 0 };

  const pending = await getPendingSyncItems();
  if (pending.length === 0) return { synced: 0, failed: 0 };

  console.log(`🔄 Syncing ${pending.length} offline operations...`);
  let synced = 0;
  let failed = 0;

  for (const item of pending) {
    try {
      let error = null;

      if (item.operation === 'insert' || item.operation === 'update') {
        const { error: e } = await supabase
          .from(item.table_name)
          .upsert(item.payload, { onConflict: 'id' });
        error = e;
      } else if (item.operation === 'delete') {
        const { error: e } = await supabase
          .from(item.table_name)
          .delete()
          .eq('id', item.record_id);
        error = e;
      }

      if (error) {
        console.warn(`⚠️ Sync failed for ${item.table_name}:`, error.message);
        failed++;
      } else {
        await markSynced(item.id);
        synced++;
      }
    } catch (err) {
      console.warn('⚠️ Sync error:', err.message);
      failed++;
    }
  }

  console.log(`✅ Sync complete: ${synced} synced, ${failed} failed`);
  return { synced, failed };
};

// ── Cache Supabase Data to IndexedDB ─────────────────────

export const cacheFromSupabase = async (supabase, userId) => {
  if (!navigator.onLine || !userId) return;

  try {
    console.log('📥 Caching data from Supabase...');

    // Cache todos
    const { data: todos } = await supabase
      .from('todos')
      .select('*')
      .eq('user_id', userId);
    if (todos) await dbPutMany(STORES.todos, todos);

    // Cache journals
    const { data: journals } = await supabase
      .from('journals')
      .select('*')
      .eq('user_id', userId);
    if (journals) await dbPutMany(STORES.journals, journals);

    // Cache pinned notes
    const { data: notes } = await supabase
      .from('pinned_notes')
      .select('*')
      .eq('user_id', userId);
    if (notes) await dbPutMany(STORES.pinnedNotes, notes);

    // Cache groups
    const { data: memberGroups } = await supabase
      .from('group_members')
      .select('group_id, role')
      .eq('user_id', userId);

    if (memberGroups && memberGroups.length > 0) {
      const groupIds = memberGroups.map((m) => m.group_id);
      const { data: groups } = await supabase
        .from('groups')
        .select('*')
        .in('id', groupIds);
      if (groups) await dbPutMany(STORES.groups, groups);

      // Cache kanban boards
      const { data: boards } = await supabase
        .from('kanban_boards')
        .select('*')
        .in('group_id', groupIds);
      if (boards) await dbPutMany(STORES.kanbanBoards, boards);

      // Cache wiki pages
      const { data: pages } = await supabase
        .from('wiki_pages')
        .select('*')
        .in('group_id', groupIds);
      if (pages) await dbPutMany(STORES.wikiPages, pages);

      // Cache team events
      const { data: events } = await supabase
        .from('team_events')
        .select('*')
        .in('group_id', groupIds);
      if (events) await dbPutMany(STORES.teamEvents, events);

      if (boards && boards.length > 0) {
        const boardIds = boards.map((b) => b.id);

        // Cache kanban columns
        const { data: columns } = await supabase
          .from('kanban_columns')
          .select('*')
          .in('board_id', boardIds);
        if (columns) await dbPutMany(STORES.kanbanColumns, columns);

        // Cache kanban tasks
        const { data: tasks } = await supabase
          .from('kanban_tasks')
          .select('*')
          .in('board_id', boardIds);
        if (tasks) await dbPutMany(STORES.kanbanTasks, tasks);
      }
    }

    // Cache time logs
    const { data: timeLogs } = await supabase
      .from('time_logs')
      .select('*')
      .eq('user_id', userId);
    if (timeLogs) await dbPutMany(STORES.timeLogs, timeLogs);

    console.log('✅ Data cached to IndexedDB');
  } catch (err) {
    console.warn('⚠️ Cache error (non-critical):', err.message);
  }
};

// ── Network Status Monitor ────────────────────────────────

export const createNetworkMonitor = (onOnline, onOffline) => {
  const handleOnline = async () => {
    console.log('🌐 Back online!');
    onOnline && onOnline();
  };

  const handleOffline = () => {
    console.log('📴 Gone offline!');
    onOffline && onOffline();
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
};

// ── Offline-aware Data Operations ────────────────────────
// Use these instead of direct Supabase calls for offline support

export const offlineCreate = async (supabase, tableName, storeName, data, userId) => {
  const record = {
    ...data,
    id: data.id || (crypto.randomUUID ? crypto.randomUUID() : `local_${Date.now()}`),
    created_at: new Date().toISOString(),
    _offline: !navigator.onLine,
  };

  // Save to IndexedDB immediately
  await dbPut(storeName, record);

  if (navigator.onLine) {
    // Sync to Supabase
    const { error } = await supabase.from(tableName).upsert(record);
    if (error) {
      // Failed to sync - add to queue
      await addToSyncQueue({ table_name: tableName, operation: 'insert', record_id: record.id, payload: record, user_id: userId });
    }
  } else {
    // Queue for later sync
    await addToSyncQueue({ table_name: tableName, operation: 'insert', record_id: record.id, payload: record, user_id: userId });
  }

  return record;
};

export const offlineUpdate = async (supabase, tableName, storeName, id, updates, userId) => {
  const existing = await dbGet(storeName, id);
  const updated = { ...existing, ...updates, updated_at: new Date().toISOString(), _offline: !navigator.onLine };

  await dbPut(storeName, updated);

  if (navigator.onLine) {
    const { error } = await supabase.from(tableName).update(updates).eq('id', id);
    if (error) {
      await addToSyncQueue({ table_name: tableName, operation: 'update', record_id: id, payload: updated, user_id: userId });
    }
  } else {
    await addToSyncQueue({ table_name: tableName, operation: 'update', record_id: id, payload: updated, user_id: userId });
  }

  return updated;
};

export const offlineDelete = async (supabase, tableName, storeName, id, userId) => {
  await dbDelete(storeName, id);

  if (navigator.onLine) {
    const { error } = await supabase.from(tableName).delete().eq('id', id);
    if (error) {
      await addToSyncQueue({ table_name: tableName, operation: 'delete', record_id: id, payload: { id }, user_id: userId });
    }
  } else {
    await addToSyncQueue({ table_name: tableName, operation: 'delete', record_id: id, payload: { id }, user_id: userId });
  }
};

export { STORES };
export default { openDB, dbGet, dbGetAll, dbPut, dbPutMany, dbDelete, dbClear, syncToSupabase, cacheFromSupabase, createNetworkMonitor, offlineCreate, offlineUpdate, offlineDelete, STORES };
