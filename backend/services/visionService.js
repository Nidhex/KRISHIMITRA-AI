'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');

const DAEMON_PORT = parseInt(process.env.VISION_DAEMON_PORT || '5005', 10);


/**
 * Attempt to query warm Python HTTP daemon running locally on port 5001.
 */
function tryDaemonInference(imagePath, moduleType) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      image_path: imagePath,
      mode: moduleType
    });

    const req = http.request({
      hostname: '127.0.0.1',
      port: DAEMON_PORT,
      path: '/predict',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 3000
    }, (res) => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const parsed = JSON.parse(body);
            if (parsed && typeof parsed.success !== 'undefined') {
              return resolve(parsed);
            }
          } catch (e) {}
        }
        reject(new Error(`Daemon returned status ${res.statusCode}`));
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Daemon request timed out'));
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Analyse a crop image using local TensorFlow model.
 * Uses warm HTTP daemon if available (< 200ms), otherwise spawns Python.
 */
async function analyseImage(imagePath, moduleType = 'disease') {
  if (!imagePath || !fs.existsSync(imagePath)) {
    return {
      success: false,
      error: "Image file not found."
    };
  }

  // 1. Try warm Python HTTP daemon
  try {
    const daemonResult = await tryDaemonInference(imagePath, moduleType);
    if (daemonResult && daemonResult.success) {
      daemonResult.source = 'warm-daemon';
      return daemonResult;
    }
  } catch (daemonErr) {
    // Warm daemon unavailable or timed out; falling back to process spawn
  }

  // 2. Fallback: Process spawn execution
  return new Promise((resolve) => {
    const AI_DIR = path.resolve(__dirname, '..', '..', 'ai');

    let PYTHON = process.env.PYTHON_PATH || '';
    if (!PYTHON || !fs.existsSync(PYTHON)) {
      PYTHON = path.join(AI_DIR, '.venv', 'Scripts', 'python.exe');
      if (!fs.existsSync(PYTHON)) {
        PYTHON = path.join(AI_DIR, '.venv', 'bin', 'python');
        if (!fs.existsSync(PYTHON)) {
          PYTHON = process.platform === 'win32' ? 'python' : 'python3';
        }
      }
    }

    const python = spawn(
      PYTHON,
      ['-m', 'prediction.api', imagePath, moduleType],
      {
        cwd: AI_DIR,
        env: {
          ...process.env,
          KERAS_BACKEND: 'tensorflow',
          TF_CPP_MIN_LOG_LEVEL: '3',
          TF_ENABLE_ONEDNN_OPTS: '0'
        }
      }
    );

    let stdout = '';
    let stderr = '';

    python.stdout.on('data', (data) => { stdout += data.toString(); });
    python.stderr.on('data', (data) => { stderr += data.toString(); });

    python.on('error', (err) => {
      return resolve({
        success: false,
        error: `Failed to start Python process: ${err.message}`
      });
    });

    python.on('close', (code) => {
      const lines = stdout.trim().split('\n');
      const jsonLine = lines.find(line => line.trim().startsWith('{'));

      if (jsonLine) {
        try {
          const parsed = JSON.parse(jsonLine);
          if (parsed && typeof parsed.success !== 'undefined') {
            return resolve(parsed);
          }
        } catch (e) {}
      }

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