let modelsLoaded = false

async function loadTinyFaceModel(faceapi: typeof import('face-api.js')) {
  if (modelsLoaded && (faceapi.nets.tinyFaceDetector.params as any)) {
    return true
  }

  const basePaths = Array.from(new Set([
    typeof window !== 'undefined' ? (window as any).__FACE_API_MODELS_URL as string | undefined : undefined,
    process.env.NEXT_PUBLIC_FACEAPI_MODELS_URL,
    '/face-models/tiny_face_detector',
    '/models',
    'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights'
  ].filter(Boolean))) as string[]

  for (const base of basePaths) {
    try {
      await faceapi.nets.tinyFaceDetector.loadFromUri(base)
      modelsLoaded = true
      return true
    } catch (error) {
      // log once per base to help diagnose missing assets
      console.warn('[face-auto-center] tinyFaceDetector load failed from', base, error)
    }
  }

  return false
}

export async function ensureFaceApi(): Promise<typeof import('face-api.js') | null> {
  try {
    const faceapi = await import('face-api.js')
    const hasParams = Boolean((faceapi.nets.tinyFaceDetector.params as any))
    if (!hasParams) {
      const loaded = await loadTinyFaceModel(faceapi)
      if (!loaded) {
        return null
      }
    }
    return faceapi
  } catch (error) {
    console.warn('[face-auto-center] failed to load face-api.js', error)
    return null
  }
}

export async function getAutoCenter(file: File): Promise<{ center: { x: number; y: number }; zoom: number } | null> {
  const faceapi = await ensureFaceApi()
  if (!faceapi) return null
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => { const i = new Image(); i.onload = () => resolve(i); i.onerror = reject; i.src = url })
    const detection = await faceapi.detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
    if (!detection) return null
    const box = detection.box
    const cx = (box.x + box.width / 2) / img.width
    const cy = (box.y + box.height / 2) / img.height
    const faceRatio = Math.max(box.width / img.width, box.height / img.height)
    const zoom = Math.min(3, Math.max(1, 0.8 / faceRatio))
    return { center: { x: cx, y: cy }, zoom }
  } catch { return null } finally { URL.revokeObjectURL(url) }
}
