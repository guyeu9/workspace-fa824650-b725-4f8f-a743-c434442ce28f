import JSZip from 'jszip'

self.onmessage = async (event) => {
  const { type, data } = event.data

  try {
    switch (type) {
      case 'unzip':
        await handleUnzip(data)
        break
      case 'validate':
        await handleValidate(data)
        break
      default:
        throw new Error(`Unknown message type: ${type}`)
    }
  } catch (error) {
    self.postMessage({
      type: 'error',
      error: error instanceof Error ? error.message : String(error)
    })
  }
}

async function handleUnzip(data: { file: ArrayBuffer; onProgress?: boolean }) {
  const { file, onProgress } = data
  const zip = new JSZip()
  const contents = await zip.loadAsync(file)

  const jsonFiles: JSZip.JSZipObject[] = []
  const assetFiles: Map<string, JSZip.JSZipObject> = new Map()
  const fileContents: Map<string, string | ArrayBuffer> = new Map()

  let processedFiles = 0
  const totalFiles = Object.keys(contents.files).length

  for (const [relativePath, zipEntry] of Object.entries(contents.files)) {
    if (!zipEntry.dir) {
      if (relativePath.endsWith('.json')) {
        jsonFiles.push(zipEntry)
      } else if (/\.(jpg|jpeg|png|gif|webp|svg|mp3|wav|ogg)$/i.test(relativePath)) {
        assetFiles.set(relativePath, zipEntry)
      }

      const content = await zipEntry.async('arraybuffer')
      fileContents.set(relativePath, content)

      processedFiles++
      if (onProgress) {
        self.postMessage({
          type: 'progress',
          progress: (processedFiles / totalFiles) * 100,
          currentFile: relativePath
        })
      }
    }
  }

  self.postMessage({
    type: 'unzip-complete',
    data: {
      jsonFiles: jsonFiles.map(f => f.name),
      assetFiles: Array.from(assetFiles.keys()),
      fileContents: Array.from(fileContents.entries())
    }
  })
}

async function handleValidate(data: { fileData: string }) {
  const { fileData } = data
  const parsed = JSON.parse(fileData)

  const errors: string[] = []
  const warnings: string[] = []

  if (!parsed) {
    errors.push('游戏数据不能为空')
  } else {
    if (!parsed.game_title && !parsed.title) {
      errors.push('缺少游戏标题')
    }

    if (!parsed.branches && !parsed.scenes) {
      errors.push('缺少游戏分支或场景数据')
    }

    if (parsed.branches && Array.isArray(parsed.branches) && parsed.branches.length === 0) {
      warnings.push('游戏没有任何分支')
    }
  }

  self.postMessage({
    type: 'validate-complete',
    data: {
      valid: errors.length === 0,
      errors,
      warnings
    }
  })
}
