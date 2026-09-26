import { readAppDataFromDrive, saveAppDataToDrive } from './googleStorage';

/**
 * One-time migration utility to backfill task_title and list_title 
 * onto legacy sessions recorded before snapshotting was added.
 */
export function migrateLegacySessions(sessions: any[], tasks: any[], lists: any[]): any[] {
  let hasChanges = false;

  const migrated = sessions.map((sess) => {
    // If session already has a title snapshot, no change needed
    if (sess.task_title) 
    {
      console.log('✅ [1. MIGRATION OK] Session already has title:', sess._id, '->', sess.task_title);
      return sess;
    }

    // Otherwise, attempt to find title from existing tasks
    const matchedTask = tasks.find(
      (t) => t._id === sess.task_id || (t.gtask_id && t.gtask_id === sess.task_id)
    );
    const matchedList = matchedTask
      ? lists.find((l) => l._id === matchedTask.list_id || l.gtask_list_id === matchedTask.list_id)
      : null;

    if (matchedTask) {
      hasChanges = true;
      console.log('🛠️ [1. MIGRATION FIXED] Backfilled title:', {
        sessId: sess._id,
        matchedTitle: matchedTask.title,
      });
      return {
        ...sess,
        task_title: matchedTask.title,
        list_title: matchedList?.title || 'General',
      };
    }
    console.warn('⚠️ [1. MIGRATION FAILED] Could not find task in memory for session:', sess.task_id);
    return sess;
  });

  if (hasChanges) {
    localStorage.setItem('local_sessions', JSON.stringify(migrated));
  }

  return migrated;
}

export async function runDriveSessionTitleMigration(accessToken: string): Promise<number> {
  console.log('🚀 Starting Google Drive AppData Session Migration...');

  // 1. Download current AppData from Google Drive
  const driveData = await readAppDataFromDrive(accessToken);
  if (!driveData) {
    console.error('❌ Failed to read AppData from Drive.');
    return 0;
  }

  const rawSessions: any[] = driveData.sessions || (driveData as any).localSessions || [];
  if (rawSessions.length === 0) {
    console.log('ℹ️ No sessions found in Google Drive AppData.');
    return 0;
  }

  // 2. Identify unique task_ids needing a title lookup
  const missingTaskIds = new Set<string>();
  rawSessions.forEach((s) => {
    if (!s.task_title && s.task_id && s.task_id !== 'unassigned') {
      missingTaskIds.add(s.task_id);
    }
  });

  console.log(`🔍 Found ${missingTaskIds.size} unique task IDs needing title resolution.`);

  // 3. Fetch all Google Task Lists for this account
  const listRes = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!listRes.ok) throw new Error(`Google Tasks API list error: ${listRes.status}`);
  const listData = await listRes.json();
  const taskLists: any[] = listData.items || [];

  // 4. Query Google Tasks API (including completed & hidden items) across all lists
  const taskIdToTitleMap = new Map<string, string>();

  for (const list of taskLists) {
    const tasksRes = await fetch(
      `https://tasks.googleapis.com/tasks/v1/lists/${list.id}/tasks?showCompleted=true&showHidden=true`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (tasksRes.ok) {
      const tasksData = await tasksRes.json();
      const items: any[] = tasksData.items || [];
      items.forEach((t) => {
        if (t.id && t.title) {
          taskIdToTitleMap.set(t.id, t.title);
        }
      });
    }
  }

  console.log(`💡 Resolved ${taskIdToTitleMap.size} task titles from Google Tasks API.`);

  // 5. Backfill sessions
  let fixedCount = 0;
  const migratedSessions = rawSessions.map((sess) => {
    if (sess.task_title) return sess;

    const matchedTitle = taskIdToTitleMap.get(sess.task_id);
    if (matchedTitle) {
      fixedCount++;
      return {
        ...sess,
        task_title: matchedTitle,
      };
    }

    // Fallback for permanently deleted tasks
    return {
      ...sess,
      task_title: 'Focus Session',
    };
  });

  // 6. Save back to Google Drive and local storage
  const updatedPayload = {
    ...driveData,
    sessions: migratedSessions,
  };

  await saveAppDataToDrive(accessToken, updatedPayload);
  localStorage.setItem('local_sessions', JSON.stringify(migratedSessions));

  console.log(`✅ SUCCESS! Backfilled ${fixedCount} sessions and saved to Google Drive & LocalStorage.`);
  return fixedCount;
}