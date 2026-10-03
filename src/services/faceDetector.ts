/**
 * faceDetector.ts
 *
 * Robust in-browser human face presence detection.
 *
 * Strategy (in priority order):
 * 1. Native W3C FaceDetector API (Chromium/Edge) — hardware-accelerated, most accurate
 * 2. Canvas-based multi-factor analysis:
 *    a. Skin chrominance cluster (YCbCr) — TIGHTENED thresholds vs previous version
 *    b. Face-region internal luminance variance — rejects flat walls/hair/reflections
 *    c. Cluster geometry validation — skin must form a plausible oval shape
 *    d. Minimum cluster size gate — rejects tiny spurious blobs
 *    e. Vertical distribution check — real faces have skin in upper+lower center, not just one band
 *
 * False-positive sources addressed:
 * - Hair only (dark, low skin ratio — falls below threshold)
 * - Bright light / screen glare (high luminance stdDev globally but near-zero internal texture)
 * - Warm-tinted walls / wooden surfaces (too uniform — fails variance check)
 * - Partial shapes / background objects (fail geometry / distribution checks)
 * - Screen reflections (near-zero variance in the reflection region)
 */

interface NativeFaceDetector {
  detect(image: ImageBitmapSource): Promise<Array<{
    boundingBox: DOMRectReadOnly
    landmarks?: Array<{ type: string; locations: Array<{ x: number; y: number }> }>
  }>>
}

declare global {
  interface Window {
    FaceDetector?: new (options?: { fastMode?: boolean; maxDetectedFaces?: number }) => NativeFaceDetector
  }
}

let nativeDetectorInstance: NativeFaceDetector | null = null

function getNativeFaceDetector(): NativeFaceDetector | null {
  if (typeof window === 'undefined' || !('FaceDetector' in window) || !window.FaceDetector) return null
  if (!nativeDetectorInstance) {
    try {
      // fastMode: false for higher accuracy (false-positive reduction is worth the slight latency)
      nativeDetectorInstance = new window.FaceDetector({ fastMode: false, maxDetectedFaces: 2 })
    } catch (err) {
      console.warn('[faceDetector] Could not initialise native FaceDetector:', err)
    }
  }
  return nativeDetectorInstance
}

// Single reusable offscreen canvas — 160×120 is enough for chrominance analysis
// and keeps per-frame cost low
let analysisCanvas: HTMLCanvasElement | null = null
let analysisCtx: CanvasRenderingContext2D | null = null

function getAnalysisContext(): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } | null {
  if (typeof document === 'undefined') return null
  if (!analysisCanvas) {
    analysisCanvas = document.createElement('canvas')
    analysisCanvas.width = 160
    analysisCanvas.height = 120
    analysisCtx = analysisCanvas.getContext('2d', { willReadFrequently: true })
  }
  if (!analysisCtx) return null
  return { canvas: analysisCanvas, ctx: analysisCtx }
}

// ─── Tuneable constants ───────────────────────────────────────────────────────
// Raised from 0.15 → 0.20: native detector must find a face that is at least 20%
// of the smaller camera dimension (filters out tiny background-face detections)
const NATIVE_MIN_FACE_FRACTION = 0.20

// Skin chrominance gate — TIGHTENED from previous [77,133] / [130,178]
// These tighter ranges come from the Kovac/Peer dataset and reduce warm-wall / wood hits
const CB_MIN = 80
const CB_MAX = 120  // was 133 — tightened upper bound removes more warm non-skin tones
const CR_MIN = 133  // was 130 — raised to reduce orange/brown object hits
const CR_MAX = 173  // was 178 — tightened

// Minimum skin fraction in the central face oval to even start further checks
// Raised from 0.16 → 0.22 to reject low-coverage non-face objects
const SKIN_RATIO_MIN = 0.22

// Maximum skin fraction — a face never fills the entire oval at 100%; very high values
// indicate a blob/object covering the lens rather than a face (unchanged at 0.88)
const SKIN_RATIO_MAX = 0.88

// Internal luminance variance threshold — a real face has eyes/nose/chin shadows.
// A flat wall, hair blob, or glare reflection will be near-uniform.
// Minimum stdDev within the skin cluster region: 12 → raised to 18
const MIN_FACE_REGION_VARIANCE = 18

// Minimum vertical SPAN of the skin cluster as a fraction of the center oval height.
// A real face — even with hair covering the forehead, viewed from below, or with
// uneven lighting — still has skin spread across at least 40% of the vertical range.
// A horizontal hair-band, a single chin, or a flat wall object will span far less.
// NOTE: this is a SPAN check (distance from topmost to bottommost skin row),
// NOT an equal-distribution-per-third check. That was the previous over-strict design.
const VERTICAL_SPAN_MIN = 0.40

// Minimum skin pixel count (absolute) to reject tiny spurious blobs
const SKIN_PIXEL_COUNT_MIN = 80

// Confidence output floors/ceilings
const NATIVE_CONFIDENCE = 95
const CANVAS_CONFIDENCE_MAX = 88
const CANVAS_CONFIDENCE_BASE = 62

// ─────────────────────────────────────────────────────────────────────────────

export interface FaceDetectionResult {
  faceDetected: boolean
  confidence: number
  reason?: string
}

/**
 * Checks whether a live HTMLVideoElement currently shows a real human face.
 *
 * Returns:
 *   faceDetected: true only when a valid, sufficiently confident human face is present
 *   confidence:   0–100 estimate of detection certainty
 *   reason:       debug string explaining a negative result
 */
export async function detectHumanFaceInVideo(
  video: HTMLVideoElement,
): Promise<FaceDetectionResult> {

  // ── Guard: video must be playing and have real dimensions ─────────────────
  if (
    !video ||
    video.readyState < 2 ||
    video.videoWidth === 0 ||
    video.videoHeight === 0 ||
    video.paused ||
    video.ended
  ) {
    return { faceDetected: false, confidence: 0, reason: 'Video stream not ready' }
  }

  // ── 1. Native W3C FaceDetector (Chromium / Edge) ─────────────────────────
  const nativeDetector = getNativeFaceDetector()
  if (nativeDetector) {
    try {
      const faces = await nativeDetector.detect(video)

      if (!faces || faces.length === 0) {
        // Native detector explicitly confirmed zero faces — trust it
        console.debug('[faceDetector] Native: 0 faces in frame')
        return { faceDetected: false, confidence: 0, reason: 'Native detector: no face found' }
      }

      // Validate the largest face bounding box
      const face = faces[0]
      const minDim = Math.min(video.videoWidth, video.videoHeight)
      const boxOk =
        face.boundingBox.width >= minDim * NATIVE_MIN_FACE_FRACTION &&
        face.boundingBox.height >= minDim * NATIVE_MIN_FACE_FRACTION

      if (!boxOk) {
        console.debug(
          `[faceDetector] Native: face box too small (${Math.round(face.boundingBox.width)}×${Math.round(face.boundingBox.height)}, need ≥${Math.round(minDim * NATIVE_MIN_FACE_FRACTION)})`
        )
        return { faceDetected: false, confidence: 15, reason: 'Native detector: face box too small (likely background)' }
      }

      // If landmarks are available, require at least eyes to be present
      if (face.landmarks && face.landmarks.length > 0) {
        const hasEye = face.landmarks.some(lm => lm.type === 'eye')
        if (!hasEye) {
          console.debug('[faceDetector] Native: no eye landmarks — rejecting')
          return { faceDetected: false, confidence: 20, reason: 'Native detector: no eye landmarks found' }
        }
      }

      console.debug(`[faceDetector] Native: face confirmed (${Math.round(face.boundingBox.width)}×${Math.round(face.boundingBox.height)})`)
      return { faceDetected: true, confidence: NATIVE_CONFIDENCE }

    } catch (err) {
      console.debug('[faceDetector] Native detector threw, falling back to canvas:', err)
      // Fall through to canvas analysis
    }
  }

  // ── 2. Canvas-based multi-factor analysis ────────────────────────────────
  const surface = getAnalysisContext()
  if (!surface) {
    return { faceDetected: false, confidence: 0, reason: 'Canvas context unavailable' }
  }

  const { canvas, ctx } = surface
  const W = canvas.width   // 160
  const H = canvas.height  // 120

  try {
    ctx.drawImage(video, 0, 0, W, H)
    const imgData = ctx.getImageData(0, 0, W, H)
    const data = imgData.data

    // ── Step A: global frame sanity checks ───────────────────────────────

    let globalLumSum = 0
    const globalLums: number[] = []

    for (let i = 0; i < data.length; i += 4) {
      const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
      globalLums.push(lum)
      globalLumSum += lum
    }

    const globalMean = globalLumSum / globalLums.length
    let globalVarSum = 0
    for (const l of globalLums) globalVarSum += (l - globalMean) * (l - globalMean)
    const globalStdDev = Math.sqrt(globalVarSum / globalLums.length)

    // Pitch black, blown-out white, or perfectly flat frame → no face
    if (globalStdDev < 10 || globalMean < 12 || globalMean > 248) {
      return {
        faceDetected: false, confidence: 0,
        reason: `Frame is too dark/bright/uniform (mean=${globalMean.toFixed(1)}, stdDev=${globalStdDev.toFixed(1)})`,
      }
    }

    // ── Step B: skin chrominance analysis in center oval ─────────────────
    // Center oval: 60% width × 70% height of the frame
    const cxMin = Math.floor(W * 0.20)
    const cxMax = Math.floor(W * 0.80)
    const cyMin = Math.floor(H * 0.15)
    const cyMax = Math.floor(H * 0.85)

    let skinCount = 0
    let totalCenter = 0

    // Luminance values within the skin cluster — for internal variance check
    const skinLums: number[] = []
    // Per-column skin counts — for horizontal geometry check
    const colSkinCounts = new Int32Array(W)
    // Track topmost and bottommost skin row for vertical SPAN check
    let skinRowMin = cyMax   // will decrease as we find skin rows
    let skinRowMax = cyMin   // will increase as we find skin rows

    for (let y = cyMin; y <= cyMax; y += 2) {
      for (let x = cxMin; x <= cxMax; x += 2) {
        const idx = (y * W + x) * 4
        const r = data[idx]
        const g = data[idx + 1]
        const b = data[idx + 2]

        totalCenter++

        // YCbCr conversion
        const cb = -0.168736 * r - 0.331264 * g + 0.5  * b + 128
        const cr =  0.5      * r - 0.418688 * g - 0.081312 * b + 128
        const lum = 0.299 * r + 0.587 * g + 0.114 * b

        // TIGHTENED skin test
        const isSkin =
          cb >= CB_MIN && cb <= CB_MAX &&
          cr >= CR_MIN && cr <= CR_MAX &&
          r > 50 &&         // reject very dark pixels (shadows / hair)
          g > 30 &&
          b > 15 &&
          r > g &&          // red channel must dominate (rejects cyan/blue glare)
          r >= b &&
          Math.abs(r - g) >= 10 &&   // stronger colour differentiation
          lum > 40 &&       // reject dark pixels that happen to land in range
          lum < 230         // reject blown-out highlights / glare

        if (isSkin) {
          skinCount++
          skinLums.push(lum)
          colSkinCounts[x]++
          if (y < skinRowMin) skinRowMin = y
          if (y > skinRowMax) skinRowMax = y
        }
      }
    }

    const skinRatio = totalCenter > 0 ? skinCount / totalCenter : 0

    console.debug(
      `[faceDetector] Canvas: skinRatio=${(skinRatio * 100).toFixed(1)}% (need ${(SKIN_RATIO_MIN * 100).toFixed(0)}–${(SKIN_RATIO_MAX * 100).toFixed(0)}%), skinCount=${skinCount}`
    )

    // Gate 1: skin ratio out of range
    if (skinRatio < SKIN_RATIO_MIN) {
      return {
        faceDetected: false,
        confidence: Math.round(skinRatio * 100),
        reason: `Insufficient skin coverage (${(skinRatio * 100).toFixed(1)}% < ${(SKIN_RATIO_MIN * 100).toFixed(0)}%)`,
      }
    }
    if (skinRatio > SKIN_RATIO_MAX) {
      return {
        faceDetected: false,
        confidence: 10,
        reason: `Skin coverage too high — lens covered or too close (${(skinRatio * 100).toFixed(1)}%)`,
      }
    }

    // Gate 2: absolute skin pixel count (rejects tiny blobs)
    if (skinCount < SKIN_PIXEL_COUNT_MIN) {
      return {
        faceDetected: false,
        confidence: 5,
        reason: `Skin pixel count too low (${skinCount} < ${SKIN_PIXEL_COUNT_MIN})`,
      }
    }

    // ── Step C: internal variance of the skin region ─────────────────────
    // A real face has texture: shadows under eyes, bridge of nose, chin edge.
    // A flat wall, hair blob, or reflection is near-uniform.
    let skinLumMean = 0
    for (const l of skinLums) skinLumMean += l
    skinLumMean /= skinLums.length

    let skinVarSum = 0
    for (const l of skinLums) skinVarSum += (l - skinLumMean) * (l - skinLumMean)
    const skinStdDev = Math.sqrt(skinVarSum / skinLums.length)

    console.debug(`[faceDetector] Canvas: skinRegion stdDev=${skinStdDev.toFixed(1)} (need ≥${MIN_FACE_REGION_VARIANCE})`)

    if (skinStdDev < MIN_FACE_REGION_VARIANCE) {
      return {
        faceDetected: false,
        confidence: 18,
        reason: `Skin region too uniform — likely wall, object, or glare (stdDev=${skinStdDev.toFixed(1)} < ${MIN_FACE_REGION_VARIANCE})`,
      }
    }

    // ── Step D: vertical SPAN check ──────────────────────────────────────
    // Require the skin cluster to span at least VERTICAL_SPAN_MIN of the center
    // oval height. This accepts:
    //   - faces with hair covering forehead (most skin is lower, but span is still large)
    //   - faces viewed from any angle
    //   - darker skin tones with fewer detected pixels
    //   - uneven lighting / side-lit faces
    // And rejects:
    //   - a thin horizontal hair-band (spans only a few rows → tiny span fraction)
    //   - a single chin or forehead fragment in frame
    //   - flat rectangular objects (will already fail Gate C, but belt-and-suspenders)
    const ovalHeight = cyMax - cyMin
    const verticalSpan = skinCount > 0 ? (skinRowMax - skinRowMin) / ovalHeight : 0

    console.debug(
      `[faceDetector] Canvas: verticalSpan=${(verticalSpan * 100).toFixed(0)}% ` +
      `(rows ${skinRowMin}–${skinRowMax} of ${cyMin}–${cyMax}, need ≥${(VERTICAL_SPAN_MIN * 100).toFixed(0)}%)`
    )

    if (verticalSpan < VERTICAL_SPAN_MIN) {
      return {
        faceDetected: false,
        confidence: 20,
        reason: `Skin cluster vertical span too small — likely hair-band, chin-only, or partial object ` +
                `(span=${(verticalSpan * 100).toFixed(0)}% < ${(VERTICAL_SPAN_MIN * 100).toFixed(0)}%)`,
      }
    }

    // ── Step E: horizontal geometry — skin cluster must have oval-ish width ─
    // Count columns that have any skin pixels; the span should be
    // at least 30% and at most 90% of the center oval width.
    const centerWidth = cxMax - cxMin
    let firstSkinCol = -1
    let lastSkinCol  = -1
    for (let x = cxMin; x <= cxMax; x++) {
      if (colSkinCounts[x] > 0) {
        if (firstSkinCol === -1) firstSkinCol = x
        lastSkinCol = x
      }
    }
    const skinSpan = firstSkinCol >= 0 ? (lastSkinCol - firstSkinCol) / centerWidth : 0

    console.debug(`[faceDetector] Canvas: horizontal skinSpan=${(skinSpan * 100).toFixed(0)}%`)

    if (skinSpan < 0.28) {
      return {
        faceDetected: false,
        confidence: 22,
        reason: `Skin cluster too narrow — likely partial face or thin object (span=${(skinSpan * 100).toFixed(0)}%)`,
      }
    }

    // ── All gates passed — confidence calculation ─────────────────────────
    // Weight: skin ratio contribution + variance contribution
    const ratioScore    = Math.min(1, (skinRatio - SKIN_RATIO_MIN) / (0.55 - SKIN_RATIO_MIN))
    const varianceScore = Math.min(1, (skinStdDev - MIN_FACE_REGION_VARIANCE) / 25)
    const spanScore     = Math.min(1, (skinSpan - 0.28) / 0.40)

    const confidence = Math.round(
      CANVAS_CONFIDENCE_BASE +
      ratioScore    * 12 +
      varianceScore * 10 +
      spanScore     * 6
    )

    const finalConfidence = Math.min(CANVAS_CONFIDENCE_MAX, confidence)

    console.debug(`[faceDetector] Canvas: FACE CONFIRMED confidence=${finalConfidence}`)

    return { faceDetected: true, confidence: finalConfidence }

  } catch (err) {
    console.warn('[faceDetector] Canvas analysis error:', err)
    return { faceDetected: false, confidence: 0, reason: `Analysis error: ${String(err)}` }
  }
}
