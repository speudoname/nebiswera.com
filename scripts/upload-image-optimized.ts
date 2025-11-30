#!/usr/bin/env node
/**
 * Optimized Image Upload to Bunny CDN
 *
 * Usage:
 *   npm run upload-image <path-to-image> [destination-name]
 *
 * Examples:
 *   npm run upload-image ~/Downloads/frustating.png frustration
 *   npm run upload-image ./public/hero.jpg hero-image
 */

import { readFileSync } from 'fs'
import { resolve, basename, extname } from 'path'
import { execSync } from 'child_process'

// Load environment variables from .env file
const envPath = resolve(__dirname, '../.env')
const envContent = readFileSync(envPath, 'utf-8')
const envVars: Record<string, string> = {}

envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/)
  if (match) {
    const key = match[1].trim()
    let value = match[2].trim()
    // Remove quotes if present
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1)
    }
    envVars[key] = value
  }
})

const BUNNY_STORAGE_ZONE = envVars.BUNNY_STORAGE_ZONE_NAME!
const BUNNY_STORAGE_PASSWORD = envVars.BUNNY_STORAGE_PASSWORD!
const BUNNY_STORAGE_HOSTNAME = envVars.BUNNY_STORAGE_HOSTNAME!
const BUNNY_CDN_URL = envVars.BUNNY_CDN_URL!

// Max width for web images (desktop display)
const MAX_WIDTH = 1200
const JPEG_QUALITY = 75

async function optimizeImage(inputPath: string): Promise<Buffer> {
  const ext = extname(inputPath).toLowerCase()
  const tempOutput = `/tmp/optimized-${Date.now()}${ext === '.png' ? '.jpg' : ext}`

  console.log(`📐 Optimizing image...`)

  try {
    if (ext === '.png') {
      // Convert PNG to JPEG for better compression
      console.log(`  Converting PNG → JPEG (quality ${JPEG_QUALITY})`)
      execSync(
        `sips -s format jpeg -s formatOptions ${JPEG_QUALITY} "${inputPath}" --out "${tempOutput}" --resampleWidth ${MAX_WIDTH}`,
        { stdio: 'pipe' }
      )
    } else {
      // Optimize JPEG/JPG
      console.log(`  Resizing to max width ${MAX_WIDTH}px, quality ${JPEG_QUALITY}`)
      execSync(
        `sips -s format jpeg -s formatOptions ${JPEG_QUALITY} "${inputPath}" --out "${tempOutput}" --resampleWidth ${MAX_WIDTH}`,
        { stdio: 'pipe' }
      )
    }

    const optimized = readFileSync(tempOutput)
    const original = readFileSync(inputPath)

    const savings = ((1 - optimized.length / original.length) * 100).toFixed(1)
    console.log(`  Original: ${(original.length / 1024).toFixed(1)} KB`)
    console.log(`  Optimized: ${(optimized.length / 1024).toFixed(1)} KB`)
    console.log(`  Savings: ${savings}%`)

    return optimized
  } catch (error) {
    console.error('⚠️  Optimization failed, using original')
    return readFileSync(inputPath)
  }
}

async function uploadToBunny(buffer: Buffer, path: string): Promise<string> {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path
  const url = `https://${BUNNY_STORAGE_HOSTNAME}/${BUNNY_STORAGE_ZONE}/${cleanPath}`

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      AccessKey: BUNNY_STORAGE_PASSWORD,
      'Content-Type': 'image/jpeg',
    },
    body: buffer,
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to upload to Bunny: ${error}`)
  }

  return `${BUNNY_CDN_URL}/${cleanPath}`
}

async function main() {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    console.log('Usage: npm run upload-image <path-to-image> [destination-name]')
    console.log('Example: npm run upload-image ~/Downloads/frustating.png frustration')
    process.exit(1)
  }

  const inputPath = resolve(args[0])
  const destinationName = args[1] || basename(inputPath, extname(inputPath))

  console.log(`🚀 Uploading image to Bunny CDN\n`)
  console.log(`Input: ${inputPath}`)
  console.log(`Destination: ${destinationName}.jpg\n`)

  // Optimize the image
  const optimizedBuffer = await optimizeImage(inputPath)

  // Upload to Bunny
  console.log(`\n☁️  Uploading to Bunny CDN...`)
  const bunnyPath = `images/${destinationName}.jpg`
  const url = await uploadToBunny(optimizedBuffer, bunnyPath)

  console.log(`\n✅ Upload successful!`)
  console.log(`\n📋 CDN URL:\n${url}\n`)
}

main().catch((error) => {
  console.error('❌ Error:', error.message)
  process.exit(1)
})
