const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

// ------------------ GOOGLE DRIVE CONFIG ------------------
const GOOGLE_DRIVE_FOLDER_ID = '1CbO11lCNlmam55uIUemNHWC_QuNPYxQW';

const SERVICE_ACCOUNT_CREDENTIALS = {
  type: "service_account",
  project_id: "file-upload-427811",
  private_key_id: "d391df159dae3fe4fb4d75e94079dbadf8e7f3ce",
  private_key: `-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDFUQtw/W0CY7AY\nEVhlecq0HFJ5v4p2CG7AZjchwrArjngOnPzX5nmMLMAendGm/wr5CRSrTQe7lP2s\nlhWx5GPMEo/87ZGPP3C93PRveilGNVPHS2S+0m4ui95UDa4SPXuuNpKsXFJ6dIOX\nKv4jFVQYvx44dFXs5L/DN7EqDHGF2TXXl3dAeJyWTMZYcSVzpRXEgtqhWu6G7Bn5\nk8cH8uuHhYE26ioOCvpbNQzL0+badMLF/yYIRyEA/eVGKlzYNmIHXRVZcHOtK4hO\n0c0t9kNncVUre1iDMsNZaTo/fYe0zgwPgRMuX2IHL6ysvAC/SgF9OzkAzKL6udF9\nofgaDqAfAgMBAAECggEAANLNQuvz1AI5fmg4H7hJ5cWGfJaVi9eOKsRib4Qh+xSN\noLX8AiSmljSrmpUbBmDjGVX13Z8lLJ27D0jTD1p+JiBftHUDWf8wR8KPzJVMbcwU\nLO0+HuO+7PfNdjlWZCIYjYoRw6FhALzSvcNCqz/QCYhmpmKp5yKvQC/Pz/acVKwp\nAI0Oh97JEAuFDuzuAdetLad1g8p050LFWBcDzRLYkdePcLW0GADRfk2rdoJkaxbn\n9N9OGQt/rgV9K03EFr8igYdeGakXnZUuNF5NoOjlYQcd/RY4Vn3ZbPe2QlKYPKFR\nfiqW/gcsIdK2OwtZAL+GW15vw09v0I6ozLSM9QFadQKBgQD2rNQv6u22RdPUnGIL\nB8xV1ayEJr+lfvWblN1Qk9rVqqhsLtI6H+VcPtRLVtqfP5ETU9jw52kUuCh5fnZ2\nnY/X87D70U+i8TO7u41F1/Uox0ivsw7bcRYqSXnGv9QvYl+g9Gd7OJjx34q8Ib+S\nUFVLtCobZJg6Al73ZDbC5gwWrQKBgQDMxo3Za7YE5MDrs6VlhALZ1PfgTqP+4eQk\nqpPupgiBy+TGJ1DAAAN0z/CnFLMldSUpzaJB564Z1ntinSy+55qaTdLS1hrw3Otc\nrQAz1M+xZTGF7EtUn74jS7YkX4GCO3KD7LCch6On2hnkIowQvgXtk+hGkFFPPD2A\nXlskxUUHewKBgFpdJb4ICdzj553TS/dOfARVqkUfDMXLpJ3CAvEpuNjdE6XN4SV5\n2cPZIFwZDS2ZU8QIy0g0/cGhVPJs6Wi6f59UnlkhbFL8mT8EjdQwMJcnqfDzX1X0\nL3J+SCYOz+Qr3WxRHDd/nEe+5EvW8R7gXt7EuUgfqcRWagOmqojrTTJhAoGBAJoo\nS7dHMBMFBvsqFbSTqfXFLwotCaai9bZot88sLTFRhptqE49HM1LoC9osaiUjyGNt\nC96jhFytK9v0STA6eRf6yGCykDuNhJ4TGxjp96UrchnI5nkBfQljQO6m+39IM5B/\nSgG81wZQ2bb2Dw23kAznkTA2CxAkYIRYBDNtUucrAoGAYI0kxCs4CRW0foZUlYCJ\nKR0uIChuSQwjwF8shFq117+ndO1D8B7XTPybm3t+iey9ww95vw1Uh2qjqvygAZYV\n1WzPR2CK4uccsGiREUaldtbSPDZ1QKKFEFLWV5OXTK0fAKBv05AIteuyM3dVvgWD\nYM0sH2Zhw8exKwPQQSAdSo0=\n-----END PRIVATE KEY-----\n`,
  client_email: "talha-khalid@file-upload-427811.iam.gserviceaccount.com",
  client_id: "103160677148251988136",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/talha-khalid%40file-upload-427811.iam.gserviceaccount.com",
  universe_domain: "googleapis.com"
};

// Initialize Google Drive API
const auth = new google.auth.GoogleAuth({
  credentials: SERVICE_ACCOUNT_CREDENTIALS,
  scopes: ['https://www.googleapis.com/auth/drive']
});

const drive = google.drive({ version: 'v3', auth });

// Utility function to determine MIME type from filename
function mimeTypeFromFilename(filename) {
  const ext = path.extname(filename).toLowerCase();
  const map = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp'
  };
  return map[ext] || 'application/octet-stream';
}

// Upload file to Google Drive
async function uploadFileToDrive(localPath, originalName) {
  try {
    const fileMetadata = {
      name: originalName,
      parents: [GOOGLE_DRIVE_FOLDER_ID]
    };

    const media = {
      mimeType: mimeTypeFromFilename(originalName),
      body: fs.createReadStream(localPath)
    };

    const response = await drive.files.create({
      resource: fileMetadata,
      media,
      fields: 'id, name'
    });

    const fileId = response.data.id;

    // Set public permissions
    await drive.permissions.create({
      fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone'
      }
    });

    const publicUrl = `https://drive.google.com/thumbnail?id=${fileId}`;
    return { id: fileId, url: publicUrl };
  } catch (error) {
    console.error('Error uploading to Google Drive:', error);
    throw error;
  }
}

// Upload multiple files to Google Drive
async function uploadMultipleFilesToDrive(files) {
  const uploadPromises = files.map(file => 
    uploadFileToDrive(file.path, file.originalname)
  );
  
  try {
    const results = await Promise.all(uploadPromises);
    return results;
  } catch (error) {
    console.error('Error uploading multiple files to Google Drive:', error);
    throw error;
  }
}

// Clean up local files after upload
function cleanupLocalFiles(files) {
  files.forEach(file => {
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
  });
}

// Safe JSON parse utility
function safeJsonParse(str) {
  try { 
    return JSON.parse(str); 
  } catch (e) { 
    return undefined; 
  }
}

module.exports = {
  uploadFileToDrive,
  uploadMultipleFilesToDrive,
  cleanupLocalFiles,
  mimeTypeFromFilename,
  safeJsonParse,
  drive
};
