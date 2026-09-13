'use strict';

const express = require('express');
const multer  = require('multer');
const path    = require('path');
const router  = express.Router();

const visionService = require('../services/visionService');

// ======================================================
// Multer Configuration (Uploads directory)
// ======================================================
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `scan_${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp|gif|bmp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    const err = new Error('Invalid file format. Only JPEG, JPG, PNG, WEBP, GIF, and BMP image formats are accepted.');
    err.status = 400;
    cb(err);
  }
});

// ======================================================
// GET /api/vision/diag (Diagnostic)
// ======================================================
router.get('/diag', (_req, res) => {
  const { exec } = require('child_process');
  const AI_DIR = path.resolve(__dirname, '..', '..', 'ai');
  const cmd = `python3 -c "import sys, tensorflow as tf, keras; print('PYTHON:', sys.version); print('TF:', tf.__version__); print('KERAS:', keras.__version__); print('BACKEND:', keras.backend.backend())"`;
  
  exec(cmd, { cwd: AI_DIR }, (err, stdout, stderr) => {
    res.json({
      error: err ? err.message : null,
      stdout: stdout.trim(),
      stderr: stderr.trim()
    });
  });
});

// ======================================================
// POST /api/vision
// ======================================================
router.post('/', upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image uploaded.'
      });
    }

    const imagePath = req.file.path;
    const moduleType = req.body.module || 'disease';

    // Call TensorFlow Model via visionService
    const result = await visionService.analyseImage(imagePath, moduleType);

    if (!result || !result.success) {
      return res.status(500).json({
        success: false,
        error: result?.error || 'Crop disease prediction failed.'
      });
    }

    // Return exact required JSON format
    return res.json({
      success: true,
      disease: result.disease,
      soil: result.soil,
      confidence: result.confidence,
      probabilities: result.probabilities,
      imagePath: `/uploads/${req.file.filename}`
    });

  } catch (err) {
    next(err);
  }
});

module.exports = router;