'use strict';

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

/**
 * Analyse a crop image using local TensorFlow model (prediction.api).
 *
 * @param {string} imagePath - absolute path to the uploaded image file
 * @returns {Promise<{
 *   success: boolean,
 *   disease?: string,
 *   confidence?: number,
 *   error?: string
 * }>}
 */
async function analyseImage(imagePath, moduleType = 'disease') {
  if (!imagePath || !fs.existsSync(imagePath)) {
    return {
      success: false,
      error: "Image file not found."
    };
  }

  return new Promise((resolve) => {
    const AI_DIR = path.resolve(__dirname, '..', '..', 'ai');

    // Python executable check
    let PYTHON = process.env.PYTHON_PATH || '';
    if (!PYTHON || !fs.existsSync(PYTHON)) {
      if (process.platform === 'win32') {
        const venvWin = path.join(AI_DIR, '.venv', 'Scripts', 'python.exe');
        PYTHON = fs.existsSync(venvWin) ? venvWin : 'python';
      } else {
        PYTHON = 'python3';
      }
    }

    const python = spawn(
      PYTHON,
      ['-m', 'prediction.api', imagePath, moduleType],
      {
        cwd: AI_DIR,
        env: {
          ...process.env,
          TF_CPP_MIN_LOG_LEVEL: '3',
          TF_ENABLE_ONEDNN_OPTS: '0',
          OMP_NUM_THREADS: '1',
          MKL_NUM_THREADS: '1',
          TF_NUM_INTRAOP_THREADS: '1',
          TF_NUM_INTEROP_THREADS: '1'
        }
      }
    );

    let stdout = '';
    let stderr = '';

    python.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    python.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    python.on('error', (err) => {
      return resolve({
        success: false,
        error: `Failed to start Python process: ${err.message}`
      });
    });

    python.on('close', (code) => {
      // Extract JSON line from stdout
      const lines = stdout.trim().split('\n');
      const jsonLine = lines.find(line => line.trim().startsWith('{'));

      if (jsonLine) {
        try {
          const parsed = JSON.parse(jsonLine);
          if (parsed && typeof parsed.success !== 'undefined') {
            return resolve(parsed);
          }
        } catch (e) {
          // JSON parse fallback
        }
      }

      // If no JSON or python error
      if (code !== 0) {
        return resolve({
          success: false,
          error: stderr.trim() || stdout.trim() || `Python process exited with code ${code}`
        });
      }

      return resolve({
        success: false,
        error: stderr.trim() || "Python returned unparseable output.",
        raw: stdout
      });
    });
  });
}

function imageToBase64(imagePath) {
  return fs.readFileSync(imagePath).toString('base64');
}

module.exports = {
  analyseImage,
  imageToBase64
};