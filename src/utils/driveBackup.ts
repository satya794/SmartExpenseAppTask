import { GoogleSignin, statusCodes, User } from '@react-native-google-signin/google-signin';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Tx = any; // replace with your Transaction type

// Configure once (call at app start, e.g. in App.tsx)
export function configureGoogleSignIn(webClientId: string) {
  GoogleSignin.configure({
    webClientId, // from Google Cloud Console (OAuth client ID for web)
    scopes: ['https://www.googleapis.com/auth/drive.file'], // access to files created/opened by the app
    offlineAccess: true,
  });
}

// Sign in and return access token
export async function signInWithGoogle() : Promise<string> {
  try {
    await GoogleSignin.hasPlayServices();
    const userInfo: User = await GoogleSignin.signIn();
    const tokens = await GoogleSignin.getTokens();
    return tokens.accessToken;
  } catch (err: any) {
    if (err.code === statusCodes.SIGN_IN_CANCELLED) throw new Error('Sign in cancelled');
    if (err.code === statusCodes.IN_PROGRESS) throw new Error('Sign in in progress');
    throw err;
  }
}

// Sign out (optional)
export async function signOutGoogle() {
  try { await GoogleSignin.signOut(); } catch (e) { /* ignore */ }
}

// Upload backup JSON to Google Drive (creates file in user's Drive)
export async function uploadBackupToDrive(accessToken: string, transactions: Tx[], filename?: string) {
  const name = filename || `smartexpense_backup_${new Date().toISOString()}.json`;
  const metadata = { name, mimeType: 'application/json' };
  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadataPart = `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}`;
  const filePart = `${delimiter}Content-Type: application/json\r\n\r\n${JSON.stringify(transactions)}`;
  const body = metadataPart + filePart + closeDelimiter;

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Drive upload failed: ${res.status} ${text}`);
  }
  return await res.json(); // contains file id etc
}

// List backup files created by this app (search by name prefix)
export async function listBackups(accessToken: string, namePrefix = 'smartexpense_backup_') {
  const q = `name contains '${namePrefix.replace("'", "\\'")}' and trashed = false`;
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name,createdTime,size)&orderBy=createdTime desc`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Drive list failed: ${res.status}`);
  const json = await res.json();
  return json.files || [];
}

// Download backup file contents (returns parsed JSON)
export async function downloadBackup(accessToken: string, fileId: string) {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Drive download failed: ${res.status}`);
  const text = await res.text();
  return JSON.parse(text);
}

// Example: local AsyncStorage -> upload
export async function backupLocalTransactionsToDrive(webClientId: string) {
  configureGoogleSignIn(webClientId);
  const accessToken = await signInWithGoogle();
  // adapt key to your storage
  const raw = await AsyncStorage.getItem('transactions');
  const txs: Tx[] = raw ? JSON.parse(raw) : [];
  const res = await uploadBackupToDrive(accessToken, txs);
  return res;
}