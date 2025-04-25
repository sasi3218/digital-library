const express = require('express');
const multer = require('multer');
const fs = require('fs-extra');
const path = require('path');
const { BlobServiceClient } = require('@azure/storage-blob');

const router = express.Router();

// Setup Azure Storage (if connection string is provided)
const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const useAzureStorage = !!connectionString;
let blobServiceClient;
const containerName = 'file-uploads';

if (useAzureStorage) {
  blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
}

// Ensure container exists for Azure Storage
async function ensureContainer() {
  if (!useAzureStorage) return null;
  
  try {
    const containerClient = blobServiceClient.getContainerClient(containerName);
    await containerClient.createIfNotExists({ access: 'blob' });
    return containerClient;
  } catch (error) {
    console.error('Error creating container:', error);
    throw error;
  }
}

// Local storage configuration
const localUpload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            const { year, month } = req.body;
            const uploadPath = `backend/uploads/${year}/${month}`;
            fs.mkdirsSync(uploadPath);
            cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
            cb(null, file.originalname);
        },
    }),
});

// Azure Storage configuration
const azureUpload = multer({ storage: multer.memoryStorage() });

// Choose the appropriate upload middleware
const upload = useAzureStorage ? azureUpload : localUpload;

// Upload a file
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        
        if (useAzureStorage) {
            // Azure Storage upload
            const { year, month } = req.body;
            const containerClient = await ensureContainer();
            
            // Create blob path similar to your folder structure
            const blobPath = `${year}/${month}/${req.file.originalname}`;
            const blockBlobClient = containerClient.getBlockBlobClient(blobPath);
            
            // Upload from buffer
            await blockBlobClient.upload(req.file.buffer, req.file.size);
            
            res.json({ 
                message: 'File uploaded successfully',
                url: blockBlobClient.url
            });
        } else {
            // Local upload already handled by multer
            res.json({ message: 'File uploaded successfully' });
        }
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Failed to upload file' });
    }
});

// List files
router.get('/', async (req, res) => {
    try {
        if (useAzureStorage) {
            // Azure Storage listing
            const containerClient = await ensureContainer();
            const files = [];
            
            // List all blobs in the container
            for await (const blob of containerClient.listBlobsFlat()) {
                // Format to match your existing path structure
                files.push(blob.name);
            }
            
            res.json(files);
        } else {
            // Local filesystem listing
            const uploadDir = 'backend/uploads';
            const files = [];

            const getFiles = (dir, prefix = '') => {
                if (!fs.existsSync(dir)) return;
                fs.readdirSync(dir).forEach(file => {
                    const filePath = path.join(dir, file);
                    const stat = fs.statSync(filePath);

                    if (stat.isDirectory()) {
                        getFiles(filePath, `${prefix}/${file}`);
                    } else {
                        files.push(`${prefix}/${file}`);
                    }
                });
            };

            getFiles(uploadDir);
            res.json(files);
        }
    } catch (error) {
        console.error('Error listing files:', error);
        res.status(500).json({ error: 'Failed to list files' });
    }
});

// Delete a file
router.delete('/delete', async (req, res) => {
    try {
        const { filePath } = req.body;
        
        if (!filePath) {
            return res.status(400).json({ error: 'File path is required' });
        }
        
        if (useAzureStorage) {
            // Azure Storage deletion
            const containerClient = await ensureContainer();
            const blockBlobClient = containerClient.getBlockBlobClient(filePath);
            
            console.log(`🔍 Deleting File: ${filePath}`);
            
            const exists = await blockBlobClient.exists();
            if (!exists) {
                return res.status(404).json({ error: 'File not found' });
            }
            
            await blockBlobClient.delete();
            res.json({ message: 'File deleted successfully' });
        } else {
            // Local filesystem deletion
            const fullPath = path.join(__dirname, '../uploads', filePath);

            console.log(`🔍 Deleting File: ${fullPath}`);

            if (fs.existsSync(fullPath)) {
                fs.unlink(fullPath, (err) => {
                    if (err) {
                        console.error('❌ Error deleting file:', err);
                        return res.status(500).json({ error: 'Error deleting file' });
                    }
                    res.json({ message: 'File deleted successfully' });
                });
            } else {
                res.status(404).json({ error: 'File not found' });
            }
        }
    } catch (error) {
        console.error('❌ Error deleting file:', error);
        res.status(500).json({ error: 'Error deleting file' });
    }
});

// Download route for Azure Storage
if (useAzureStorage) {
    router.get('/download/:year/:month/:filename', async (req, res) => {
        try {
            const { year, month, filename } = req.params;
            const blobPath = `${year}/${month}/${filename}`;
            
            const containerClient = await ensureContainer();
            const blockBlobClient = containerClient.getBlockBlobClient(blobPath);
            
            const exists = await blockBlobClient.exists();
            if (!exists) {
                return res.status(404).json({ error: 'File not found' });
            }
            
            // Set content disposition
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            
            // Download the blob and pipe to response
            const downloadResponse = await blockBlobClient.download(0);
            downloadResponse.readableStreamBody.pipe(res);
        } catch (error) {
            console.error('Error downloading file:', error);
            res.status(500).json({ error: 'Failed to download file' });
        }
    });
}

module.exports = router;
