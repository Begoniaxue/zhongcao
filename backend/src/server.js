import express from 'express'
import cors from 'cors'
import multer from 'multer'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = 3001

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads')
const CHUNKS_DIR = path.join(UPLOAD_DIR, 'chunks')
const MERGED_DIR = path.join(UPLOAD_DIR, 'merged')

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true })
if (!fs.existsSync(CHUNKS_DIR)) fs.mkdirSync(CHUNKS_DIR, { recursive: true })
if (!fs.existsSync(MERGED_DIR)) fs.mkdirSync(MERGED_DIR, { recursive: true })

app.use(cors())
app.use(express.json())
app.use(express.static(path.join(__dirname, '..', 'public')))

const storage = multer.memoryStorage()
const upload = multer({ storage })

const fileStatus = new Map()

const generateMockImages = (count = 2000) => {
  const images = []
  const categories = ['nature', 'city', 'food', 'people', 'animals', 'architecture', 'travel', 'art']
  const widths = [300, 350, 400, 280, 320]
  const heights = [400, 450, 500, 550, 380, 420, 480, 520]
  
  for (let i = 1; i <= count; i++) {
    const category = categories[i % categories.length]
    const width = widths[i % widths.length]
    const height = heights[i % heights.length]
    
    images.push({
      id: i,
      url: `https://picsum.photos/seed/image-${i}/${width}/${height}`,
      thumbnailUrl: `https://picsum.photos/seed/image-${i}/${width * 0.5}/${height * 0.5}`,
      width,
      height,
      title: `图片 ${i} - ${category}`,
      category,
      likes: Math.floor(Math.random() * 10000),
      author: `用户${Math.floor(Math.random() * 100) + 1}`
    })
  }
  
  return images
}

const MOCK_IMAGES = generateMockImages(2000)

const saveChunk = (hash, index, buffer) => {
  return new Promise((resolve, reject) => {
    const hashDir = path.join(CHUNKS_DIR, hash)
    if (!fs.existsSync(hashDir)) {
      fs.mkdirSync(hashDir, { recursive: true })
    }
    
    const chunkPath = path.join(hashDir, String(index))
    fs.writeFile(chunkPath, buffer, (err) => {
      if (err) reject(err)
      else resolve(chunkPath)
    })
  })
}

const getUploadedChunks = (hash) => {
  const hashDir = path.join(CHUNKS_DIR, hash)
  if (!fs.existsSync(hashDir)) return []
  
  const files = fs.readdirSync(hashDir)
  return files
    .map(f => parseInt(f, 10))
    .filter(n => !isNaN(n))
    .sort((a, b) => a - b)
}

app.get('/api/upload/check', (req, res) => {
  try {
    const { hash, fileName } = req.query
    
    if (!hash) {
      return res.status(400).json({
        success: false,
        message: 'Hash is required'
      })
    }
    
    const hashDir = path.join(CHUNKS_DIR, String(hash))
    const uploadedChunks = []
    
    if (fs.existsSync(hashDir)) {
      const files = fs.readdirSync(hashDir)
      files.forEach(file => {
        const index = parseInt(file, 10)
        if (!isNaN(index)) {
          uploadedChunks.push(index)
        }
      })
    }
    
    const safeFileName = fileName || 'unknown'
    const mergedPath = path.join(MERGED_DIR, `${hash}_${safeFileName}`)
    const isCompleted = fs.existsSync(mergedPath)
    
    res.json({
      success: true,
      isCompleted,
      uploadedChunks: uploadedChunks.sort((a, b) => a - b),
      mergedUrl: isCompleted ? `/uploads/merged/${hash}_${safeFileName}` : null
    })
  } catch (error) {
    console.error('Check error:', error)
    res.status(500).json({
      success: false,
      message: 'Check failed',
      error: error.message
    })
  }
})

app.post('/api/upload/chunk', upload.single('file'), async (req, res) => {
  try {
    const { hash, index, fileName, total, fileSize } = req.body
    const file = req.file
    
    if (!hash || index === undefined || !file) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: hash, index, or file'
      })
    }
    
    const indexNum = parseInt(index, 10)
    const totalNum = total ? parseInt(total, 10) : 0
    const fileSizeNum = fileSize ? parseInt(fileSize, 10) : 0
    
    const hashDir = path.join(CHUNKS_DIR, hash)
    if (!fs.existsSync(hashDir)) {
      fs.mkdirSync(hashDir, { recursive: true })
    }
    
    const chunkPath = path.join(hashDir, String(indexNum))
    const chunkExists = fs.existsSync(chunkPath)
    
    if (!chunkExists) {
      await saveChunk(hash, indexNum, file.buffer)
    }
    
    const key = hash
    if (!fileStatus.has(key)) {
      fileStatus.set(key, {
        hash,
        fileName: fileName || 'unknown',
        total: totalNum,
        fileSize: fileSizeNum,
        uploaded: new Set()
      })
    }
    
    const status = fileStatus.get(key)
    const uploadedChunks = getUploadedChunks(hash)
    uploadedChunks.forEach(idx => status.uploaded.add(idx))
    
    res.json({
      success: true,
      message: chunkExists ? 'Chunk already exists' : 'Chunk uploaded successfully',
      uploaded: uploadedChunks,
      remaining: totalNum > 0 ? totalNum - uploadedChunks.length : -1
    })
  } catch (error) {
    console.error('Chunk upload error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to upload chunk',
      error: error.message
    })
  }
})

app.post('/api/upload/merge', async (req, res) => {
  try {
    const { hash, fileName, total, fileSize } = req.body
    
    if (!hash || !fileName || total === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: hash, fileName, or total'
      })
    }
    
    const totalNum = parseInt(total, 10)
    const hashDir = path.join(CHUNKS_DIR, hash)
    const mergedFileName = `${hash}_${fileName}`
    const mergedPath = path.join(MERGED_DIR, mergedFileName)
    
    if (fs.existsSync(mergedPath)) {
      const stats = fs.statSync(mergedPath)
      return res.json({
        success: true,
        message: 'File already exists',
        url: `/uploads/merged/${mergedFileName}`,
        fileName,
        fileSize: stats.size
      })
    }
    
    if (!fs.existsSync(hashDir)) {
      return res.status(400).json({
        success: false,
        message: 'Chunks not found'
      })
    }
    
    const uploadedChunks = getUploadedChunks(hash)
    
    if (uploadedChunks.length !== totalNum) {
      return res.status(400).json({
        success: false,
        message: `Missing chunks. Expected ${totalNum}, got ${uploadedChunks.length}`,
        uploaded: uploadedChunks
      })
    }
    
    for (let i = 0; i < totalNum; i++) {
      const chunkPath = path.join(hashDir, String(i))
      if (!fs.existsSync(chunkPath)) {
        return res.status(400).json({
          success: false,
          message: `Missing chunk ${i}`
        })
      }
    }
    
    const writeStream = fs.createWriteStream(mergedPath)
    
    for (let i = 0; i < totalNum; i++) {
      const chunkPath = path.join(hashDir, String(i))
      await new Promise((resolve, reject) => {
        const readStream = fs.createReadStream(chunkPath)
        readStream.pipe(writeStream, { end: false })
        readStream.on('end', resolve)
        readStream.on('error', reject)
      })
    }
    
    writeStream.end()
    
    await new Promise((resolve, reject) => {
      writeStream.on('finish', resolve)
      writeStream.on('error', reject)
    })
    
    try {
      fs.rmSync(hashDir, { recursive: true, force: true })
    } catch (e) {
      console.warn('Warning: Could not remove chunk directory:', e.message)
    }
    
    fileStatus.delete(hash)
    
    const stats = fs.statSync(mergedPath)
    
    res.json({
      success: true,
      message: 'File merged successfully',
      url: `/uploads/merged/${mergedFileName}`,
      fileName,
      fileSize: stats.size
    })
  } catch (error) {
    console.error('Merge error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to merge file',
      error: error.message
    })
  }
})

app.use('/uploads/merged', express.static(MERGED_DIR))

app.get('/api/images', (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const pageSize = parseInt(req.query.pageSize) || 10
    const category = req.query.category
    
    let filteredImages = MOCK_IMAGES
    if (category) {
      filteredImages = MOCK_IMAGES.filter(img => img.category === category)
    }
    
    const total = filteredImages.length
    const totalPages = Math.ceil(total / pageSize)
    const startIndex = (page - 1) * pageSize
    const endIndex = Math.min(startIndex + pageSize, total)
    
    const items = filteredImages.slice(startIndex, endIndex)
    
    setTimeout(() => {
      res.json({
        success: true,
        data: {
          items,
          pagination: {
            page,
            pageSize,
            total,
            totalPages,
            hasNext: page < totalPages
          }
        },
        timestamp: new Date().toISOString()
      })
    }, 100)
  } catch (error) {
    console.error('Get images error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get images',
      error: error.message
    })
  }
})

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  })
})

app.listen(PORT, () => {
  console.log(`Chunk upload server running on http://localhost:${PORT}`)
  console.log(`Upload directory: ${UPLOAD_DIR}`)
})
