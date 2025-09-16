export async function ensureFaceApi(): Promise<typeof import('face-api.js') | null> {
  try {
    const faceapi = await import('face-api.js')
    if (!(faceapi.nets.tinyFaceDetector.params as any)) {
      await faceapi.nets.tinyFaceDetector.loadFromUri('/models')
    }
    return faceapi
  } catch {
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

