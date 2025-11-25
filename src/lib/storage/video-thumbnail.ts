/**
 * Generates a thumbnail image from a video blob
 * Captures a frame from the video at a specified time
 */
export async function generateVideoThumbnail(
  videoBlob: Blob,
  timeInSeconds: number = 1
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      reject(new Error('Could not get canvas context'))
      return
    }

    video.preload = 'metadata'
    video.muted = true
    video.playsInline = true

    // Create object URL for the video
    const videoUrl = URL.createObjectURL(videoBlob)
    video.src = videoUrl

    video.addEventListener('loadedmetadata', () => {
      // Set canvas dimensions to video dimensions
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      // Seek to the specified time
      video.currentTime = Math.min(timeInSeconds, video.duration)
    })

    video.addEventListener('seeked', () => {
      try {
        // Draw the current frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

        // Convert canvas to blob
        canvas.toBlob(
          (blob) => {
            // Clean up
            URL.revokeObjectURL(videoUrl)
            video.remove()
            canvas.remove()

            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('Failed to create thumbnail blob'))
            }
          },
          'image/jpeg',
          0.85 // Quality (0-1)
        )
      } catch (error) {
        URL.revokeObjectURL(videoUrl)
        video.remove()
        canvas.remove()
        reject(error)
      }
    })

    video.addEventListener('error', (e) => {
      URL.revokeObjectURL(videoUrl)
      video.remove()
      canvas.remove()
      reject(new Error(`Video loading error: ${e}`))
    })

    // Start loading the video
    video.load()
  })
}
