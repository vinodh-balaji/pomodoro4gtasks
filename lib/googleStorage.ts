// lib/googleStorage.ts

const TASKS_BASE_URL = 'https://tasks.googleapis.com/tasks/v1';
const DRIVE_BASE_URL = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3';
const SYNC_FILE_NAME = 'pomodoro_data.json';

export interface LocalAppData {
  localLists?: any[];
  localTasks?: any[];
  sessions: any[];
  taskEstimates?: Record<string, number>;
  settings: Record<string, any>;
}

// ==========================================
// 1. DIRECT GOOGLE TASKS API (PARALLEL FETCH)
// ==========================================

export async function fetchDirectGoogleLists(accessToken: string) {
  const res = await fetch(`${TASKS_BASE_URL}/users/@me/lists`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch Google Task lists');
  const data = await res.json();
  return (data.items || []).map((item: any) => ({
    _id: item.id,
    gtask_list_id: item.id,
    title: item.title,
    type: 'google',
    is_visible: true,
  }));
}

export async function fetchDirectGoogleTasks(accessToken: string, listId: string, updatedMin?: string) {
    let url = `${TASKS_BASE_URL}/lists/${listId}/tasks?showCompleted=false&showDeleted=false&showHidden=false`;
    if (updatedMin) {
        url += `&updatedMin=${encodeURIComponent(updatedMin)}`;
    }
    const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: 'no-store',
    });
  if (!res.ok) throw new Error('Failed to fetch Google Tasks');
  const data = await res.json();
  return (data.items || [])
    .filter((item: any) => item.status !== 'completed' && !item.deleted && !item.hidden)
    .map((item: any) => ({
    _id: item.id,
    gtask_id: item.id,
    list_id: listId,
    title: item.title,
    status: item.status === 'completed' ? 'completed' : 'needsAction',
    estimated_pomos: 1,
    completed_pomos: 0,
  }));
}

// Parallel fetch eliminates network waterfalls across multiple lists
export async function fetchAllGoogleDataDirectly(accessToken: string, updatedMin?: string) {
  const lists = await fetchDirectGoogleLists(accessToken);
  const taskPromises = lists.map((list: any) =>
    fetchDirectGoogleTasks(accessToken, list.gtask_list_id, updatedMin)
  );
  const taskResults = await Promise.all(taskPromises);
  return {
    lists,
    tasks: taskResults.flat(),
  };
}

export async function createDirectGoogleTask(accessToken: string, listId: string, title: string) {
  const res = await fetch(`${TASKS_BASE_URL}/lists/${listId}/tasks`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error('Failed to create Google Task');
  return await res.json();
}

export async function completeDirectGoogleTask(accessToken: string, listId: string, taskId: string) {
    const res = await fetch(`${TASKS_BASE_URL}/lists/${listId}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'completed' }),
    });
    if (!res.ok) throw new Error('Failed to complete Google Task');
    return await res.json();
}

export async function updateDirectGoogleTask(accessToken: string, listId: string, taskId: string, title: string) {
    const res = await fetch(`${TASKS_BASE_URL}/lists/${listId}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title }),
    });
    if (!res.ok) throw new Error('Failed to update Google Task');
    return await res.json();
}


export async function createDirectGoogleList(accessToken: string, title: string) {
    const res = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title }),
    });
    if (!res.ok) {
        throw new Error(`Failed to create Google Task List: ${res.statusText}`);
    }
    return await res.json();
}

// ==========================================
// 2. GOOGLE DRIVE APPDATAFOLDER (ZERO-SERVER SYNC)
// ==========================================

async function findDriveAppDataFileId(accessToken: string): Promise<string | null> {
  const q = encodeURIComponent(`name = '${SYNC_FILE_NAME}' and 'appDataFolder' in parents`);
  const res = await fetch(`${DRIVE_BASE_URL}/files?spaces=appDataFolder&q=${q}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.files && data.files.length > 0 ? data.files[0].id : null;
}

export async function readAppDataFromDrive(accessToken: string): Promise<LocalAppData | null> {
  try {
    const fileId = await findDriveAppDataFileId(accessToken);
    if (!fileId) return null;

    const res = await fetch(`${DRIVE_BASE_URL}/files/${fileId}?alt=media`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error('Failed to read AppData from Drive:', err);
    return null;
  }
}

export async function saveAppDataToDrive(accessToken: string, appData: LocalAppData): Promise<boolean> {
  try {
    const fileId = await findDriveAppDataFileId(accessToken);
    const metadata = {
      name: SYNC_FILE_NAME,
      parents: ['appDataFolder'],
    };

    if (fileId) {
      // Update existing file
      const res = await fetch(`${DRIVE_UPLOAD_URL}/files/${fileId}?uploadType=media`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appData),
      });
      return res.ok;
    } else {
      // Create new file via Multipart upload
      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', new Blob([JSON.stringify(appData)], { type: 'application/json' }));

      const res = await fetch(`${DRIVE_UPLOAD_URL}/files?uploadType=multipart`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: form,
      });
      return res.ok;
    }
  } catch (err) {
    console.error('Failed to save AppData to Drive:', err);
    return false;
  }
}