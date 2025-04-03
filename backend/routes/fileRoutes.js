const express = require('express');
const multer = require('multer');
const fs = require('fs-extra');
const path = require('path');

const router = express.Router();

const upload = multer({
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

// Upload a file
router.post('/upload', upload.single('file'), (req, res) => {
    res.json({ message: 'File uploaded successfully' });
});

// List files
router.get('/', (req, res) => {
    const uploadDir = 'backend/uploads';
    const files = [];

    const getFiles = (dir, prefix = '') => {
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
});

// ✅ Fixed Delete Function
router.delete('/delete', (req, res) => {
    const { filePath } = req.body;

    if (!filePath) {
        return res.status(400).json({ error: 'File path is required' });
    }
    const fullPath = path.join(__dirname, '../backend/uploads', filePath);

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
});


module.exports = router;
