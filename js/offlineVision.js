/* ==========================================================================
   KrishiMitra AI — True Offline Vision Inference Engine (TensorFlow.js)
   Provides 100% browser-side AI vision predictions when offline/disconnected.
   ========================================================================== */

'use strict';

(function () {
  const MODEL_PATHS = {
    disease: {
      model: '/ai/browser-models/disease/model.json',
      labels: '/ai/browser-models/disease/labels.json',
      indexedDB: 'indexeddb://krishimitra-disease-v1'
    },
    soil: {
      model: '/ai/browser-models/soil/model.json',
      labels: '/ai/browser-models/soil/soil_labels_v4.json',
      indexedDB: 'indexeddb://krishimitra-soil-v1'
    }
  };

  let diseaseModel = null;
  let diseaseLabels = null;
  let isDiseaseLoading = false;

  let soilModel = null;
  let soilLabels = null;
  let isSoilLoading = false;

  /**
   * Helper to ensure TensorFlow.js core is loaded
   */
  async function ensureTFJS() {
    if (typeof tf !== 'undefined') return true;
    
    console.log('[OfflineVision] Loading local TensorFlow.js script...');
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = '/js/lib/tf.min.js';
      script.onload = () => {
        console.log('[OfflineVision] Local TensorFlow.js runtime loaded successfully.');
        resolve(true);
      };
      script.onerror = (err) => {
        console.error('[OfflineVision] Failed to load local TensorFlow.js runtime:', err);
        reject(new Error('Local TensorFlow.js runtime failed to load'));
      };
      document.head.appendChild(script);
    });
  }


  /**
   * Load Disease Model Lazily with IndexedDB caching
   */
  async function loadDiseaseModel(onProgress = null) {
    if (diseaseModel && diseaseLabels) return { model: diseaseModel, labels: diseaseLabels };
    if (isDiseaseLoading) {
      while (isDiseaseLoading) {
        await new Promise(r => setTimeout(r, 100));
      }
      return { model: diseaseModel, labels: diseaseLabels };
    }

    isDiseaseLoading = true;
    try {
      await ensureTFJS();

      // 1. Fetch labels first
      if (!diseaseLabels) {
        const res = await fetch(MODEL_PATHS.disease.labels);
        diseaseLabels = await res.json();
      }

      // 2. Try loading model from IndexedDB first
      try {
        console.log('[OfflineVision] Attempting to load Disease Model from IndexedDB...');
        diseaseModel = await tf.loadGraphModel(MODEL_PATHS.disease.indexedDB);
        console.log('[OfflineVision] ✓ Disease Model loaded from IndexedDB cache.');
      } catch (e) {
        console.log('[OfflineVision] IndexedDB cache miss, downloading Disease Model from server...');
        if (onProgress) onProgress(0.1);
        
        diseaseModel = await tf.loadGraphModel(MODEL_PATHS.disease.model, {
          onProgress: (fraction) => {
            if (onProgress) onProgress(fraction);
          }
        });

        // Save to IndexedDB asynchronously for next session
        try {
          await diseaseModel.save(MODEL_PATHS.disease.indexedDB);
          console.log('[OfflineVision] ✓ Disease Model saved to IndexedDB for offline use.');
        } catch (saveErr) {
          console.warn('[OfflineVision] Could not save Disease Model to IndexedDB:', saveErr);
        }
      }

      console.log('[OfflineVision] Plant Disease Model is ready for browser inference.');
      return { model: diseaseModel, labels: diseaseLabels };
    } catch (err) {
      console.error('[OfflineVision] Failed to load Plant Disease Model:', err);
      throw err;
    } finally {
      isDiseaseLoading = false;
    }
  }

  /**
   * Load Soil Model Lazily with IndexedDB caching
   */
  async function loadSoilModel(onProgress = null) {
    if (soilModel && soilLabels) return { model: soilModel, labels: soilLabels };
    if (isSoilLoading) {
      while (isSoilLoading) {
        await new Promise(r => setTimeout(r, 100));
      }
      return { model: soilModel, labels: soilLabels };
    }

    isSoilLoading = true;
    try {
      await ensureTFJS();

      // 1. Fetch labels first
      if (!soilLabels) {
        const res = await fetch(MODEL_PATHS.soil.labels);
        soilLabels = await res.json();
      }

      // 2. Try loading model from IndexedDB first
      try {
        console.log('[OfflineVision] Attempting to load Soil Model from IndexedDB...');
        soilModel = await tf.loadGraphModel(MODEL_PATHS.soil.indexedDB);
        console.log('[OfflineVision] ✓ Soil Model loaded from IndexedDB cache.');
      } catch (e) {
        console.log('[OfflineVision] IndexedDB cache miss, downloading Soil Model from server...');
        if (onProgress) onProgress(0.1);
        
        soilModel = await tf.loadGraphModel(MODEL_PATHS.soil.model, {
          onProgress: (fraction) => {
            if (onProgress) onProgress(fraction);
          }
        });

        // Save to IndexedDB asynchronously for next session
        try {
          await soilModel.save(MODEL_PATHS.soil.indexedDB);
          console.log('[OfflineVision] ✓ Soil Model saved to IndexedDB for offline use.');
        } catch (saveErr) {
          console.warn('[OfflineVision] Could not save Soil Model to IndexedDB:', saveErr);
        }
      }

      console.log('[OfflineVision] Soil Classifier Model v4 is ready for browser inference.');
      return { model: soilModel, labels: soilLabels };
    } catch (err) {
      console.error('[OfflineVision] Failed to load Soil Classifier Model:', err);
      throw err;
    } finally {
      isSoilLoading = false;
    }
  }

  /**
   * Predict Plant Disease from an HTML Image, Canvas, or Video element
   * Preprocessing: RGB -> 224x224 -> float32 -> pixel / 255.0 -> batch dim
   */
  async function predictDisease(imageSource) {
    const { model, labels } = await loadDiseaseModel();

    console.log('[OfflineVision] Running Plant Disease local browser inference...');
    
    // Memory leak protection: wrap tensor operations in tf.tidy
    const predictionTensor = tf.tidy(() => {
      // Load tensor from HTML image/canvas element (3 channels RGB)
      let tensor = tf.browser.fromPixels(imageSource, 3);
      
      // Resize bilinear to 224x224
      tensor = tf.image.resizeBilinear(tensor, [224, 224]);
      
      // Convert to float32
      tensor = tensor.toFloat();
      
      // Normalize: pixel / 255.0 (exact match to Python image_utils.py)
      tensor = tensor.div(255.0);
      
      // Add batch dimension [1, 224, 224, 3]
      tensor = tensor.expandDims(0);
      
      // Execute inference on local model
      return model.predict(tensor);
    });

    // Get probability array asynchronously
    const probabilities = await predictionTensor.data();
    predictionTensor.dispose(); // clean up output tensor

    // Find top predicted class
    let maxIdx = 0;
    let maxProb = probabilities[0];
    for (let i = 1; i < probabilities.length; i++) {
      if (probabilities[i] > maxProb) {
        maxProb = probabilities[i];
        maxIdx = i;
      }
    }

    const predictedClass = labels[String(maxIdx)] || labels[maxIdx] || 'Unknown';
    const confidence = parseFloat(maxProb.toFixed(4));

    console.log(`[OfflineVision] Disease Prediction: ${predictedClass} (${(confidence * 100).toFixed(2)}%)`);

    return {
      success: true,
      disease: predictedClass,
      confidence: confidence,
      offline: true,
      source: 'Browser TensorFlow.js Model',
      detection: {
        disease: predictedClass,
        confidence: confidence,
        offline: true
      }
    };
  }

  /**
   * Predict Soil Type from an HTML Image, Canvas, or Video element
   * Preprocessing: RGB -> 224x224 -> float32 [0..255] -> batch dim (exact match to Python soil_predictor.py)
   */
  async function predictSoil(imageSource) {
    const { model, labels } = await loadSoilModel();

    console.log('[OfflineVision] Running Soil Classification local browser inference...');

    // Memory leak protection: wrap tensor operations in tf.tidy
    const predictionTensor = tf.tidy(() => {
      // Load tensor from HTML image/canvas element (3 channels RGB)
      let tensor = tf.browser.fromPixels(imageSource, 3);
      
      // Resize bilinear to 224x224
      tensor = tf.image.resizeBilinear(tensor, [224, 224]);
      
      // Convert to float32 [0.0..255.0] (no /255 division, internal rescaling layer handles it)
      tensor = tensor.toFloat();
      
      // Add batch dimension [1, 224, 224, 3]
      tensor = tensor.expandDims(0);
      
      // Execute inference on local model
      return model.predict(tensor);
    });

    // Get probability array asynchronously
    const probabilities = await predictionTensor.data();
    predictionTensor.dispose(); // clean up output tensor

    // Map probabilities to classes
    const classProbs = [];
    for (let i = 0; i < probabilities.length; i++) {
      const className = labels[String(i)] || labels[i] || `Class_${i}`;
      classProbs.push({ className, probability: probabilities[i] });
    }

    classProbs.sort((a, b) => b.probability - a.probability);
    const best = classProbs[0];

    console.log(`[OfflineVision] Soil Prediction: ${best.className} (${(best.probability * 100).toFixed(2)}%)`);

    return {
      success: true,
      soilType: best.className,
      confidence: parseFloat(best.probability.toFixed(4)),
      classProbabilities: classProbs,
      offline: true,
      source: 'Browser TensorFlow.js Model'
    };
  }

  /**
   * Run repeated inferences and track memory usage to prove zero tensor memory leak.
   */
  async function testMemoryLeak(imageSource, iterations = 20) {
    await ensureTFJS();
    console.log(`[OfflineVision] Starting Memory Leak Test (${iterations} iterations)...`);
    const initialMemory = tf.memory();
    console.log(`[OfflineVision] Initial Tensors: ${initialMemory.numTensors}, Bytes: ${initialMemory.numBytes}`);

    for (let i = 0; i < iterations; i++) {
      await predictDisease(imageSource);
      await predictSoil(imageSource);
    }

    const finalMemory = tf.memory();
    console.log(`[OfflineVision] Final Tensors: ${finalMemory.numTensors}, Bytes: ${finalMemory.numBytes}`);
    const leakedTensors = finalMemory.numTensors - initialMemory.numTensors;
    
    if (leakedTensors === 0) {
      console.log(`[OfflineVision] ✓ PASSED: Zero memory leak detected after ${iterations} consecutive inferences!`);
    } else {
      console.warn(`[OfflineVision] ⚠️ WARNING: ${leakedTensors} tensors remaining after test.`);
    }

    return {
      passed: leakedTensors === 0,
      initialTensors: initialMemory.numTensors,
      finalTensors: finalMemory.numTensors,
      leakedTensors
    };
  }

  // Export to window global
  window.OfflineVision = {
    ensureTFJS,
    loadDiseaseModel,
    loadSoilModel,
    predictDisease,
    predictSoil,
    testMemoryLeak,
    isDiseaseReady: () => !!(diseaseModel && diseaseLabels),
    isSoilReady: () => !!(soilModel && soilLabels)
  };

  console.log('[OfflineVision] Module initialized.');
})();

