import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');


function loadCredentials() {
  if (process.env.GOOGLE_CREDENTIALS_JSON) {
    return JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
  }
  const content = fs.readFileSync(CREDENTIALS_PATH, 'utf8');
  return JSON.parse(content);
}

export async function authorize() {
  const credentials = loadCredentials();
  const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  if (process.env.GOOGLE_TOKEN_JSON) {
    oAuth2Client.setCredentials(JSON.parse(process.env.GOOGLE_TOKEN_JSON));
    return oAuth2Client;
  } else if (fs.existsSync(TOKEN_PATH)) {
    const token = fs.readFileSync(TOKEN_PATH, 'utf8');
    oAuth2Client.setCredentials(JSON.parse(token));
    return oAuth2Client;
  } else {
    throw new Error('token.json não encontrado. Gere o token OAuth2 manualmente.');
  }
}

export async function uploadFileToDrive(
  auth: any,
  filePath: string,
  folderId: string,
  fileName: string
): Promise<string> {
  const drive = google.drive({ version: 'v3', auth });
  const fileMetadata = {
    name: fileName,
    parents: [folderId],
  };
  const media = {
    mimeType: 'application/pdf',
    body: fs.createReadStream(filePath),
  };
  const res = await drive.files.create({
    requestBody: fileMetadata,
    media,
    fields: 'id',
  });
  return res.data.id || '';
}
