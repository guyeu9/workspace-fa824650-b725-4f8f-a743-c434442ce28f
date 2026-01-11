export class ZipWorkerManager {
  private worker: Worker | null = null
  private onProgressCallback: ((progress: number, currentFile: string) => void) | null = null
  private onCompleteCallback: ((data: any) => void) | null = null
  private onErrorCallback: ((error: Error) => void) | null = null

  constructor() {
    this.initWorker()
  }

  private initWorker() {
    try {
      const workerCode = `
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
                throw new Error(\`Unknown message type: \${type}\`)
            }
          } catch (error) {
            self.postMessage({
              type: 'error',
              error: error instanceof Error ? error.message : String(error)
            })
          }
        }

        async function handleUnzip(data) {
          const { file, onProgress } = data
          const zip = new JSZip()
          const contents = await zip.loadAsync(file)

          const jsonFiles = []
          const assetFiles = new Map()
          const fileContents = new Map()

          let processedFiles = 0
          const totalFiles = Object.keys(contents.files).length

          for (const [relativePath, zipEntry] of Object.entries(contents.files)) {
            if (!zipEntry.dir) {
              if (relativePath.endsWith('.json')) {
                jsonFiles.push(zipEntry)
              } else if (/\\.(jpg|jpeg|png|gif|webp|svg|mp3|wav|ogg)$/i.test(relativePath)) {
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

        async function handleValidate(data) {
          const { fileData } = data
          const parsed = JSON.parse(fileData)

          const errors = []
          const warnings = []

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
      `

      const blob = new Blob([workerCode], { type: 'application/javascript' })
      const url = URL.createObjectURL(blob)

      this.worker = new Worker(url)

      this.worker.onmessage = (event) => {
        const { type, data, error, progress, currentFile } = event.data

        switch (type) {
          case 'progress':
            this.onProgressCallback?.(progress, currentFile)
            break
          case 'unzip-complete':
          case 'validate-complete':
            this.onCompleteCallback?.(data)
            break
          case 'error':
            this.onErrorCallback?.(new Error(error))
            break
        }
      }

      this.worker.onerror = (error) => {
        this.onErrorCallback?.(new Error(error.message))
      }
    } catch (error) {
      console.error('Failed to initialize worker:', error)
      this.onErrorCallback?.(error instanceof Error ? error : new Error(String(error)))
    }
  }

  public async unzipFile(
    file: ArrayBuffer,
    onProgress?: (progress: number, currentFile: string) => void
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      this.onProgressCallback = onProgress || null
      this.onCompleteCallback = resolve
      this.onErrorCallback = reject

      this.worker?.postMessage({
        type: 'unzip',
        data: {
          file,
          onProgress: !!onProgress
        }
      })
    })
  }

  public async validateFile(
    fileData: string
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      this.onCompleteCallback = resolve
      this.onErrorCallback = reject

      this.worker?.postMessage({
        type: 'validate',
        data: { fileData }
      })
    })
  }

  public terminate() {
    if (this.worker) {
      this.worker.terminate()
      this.worker = null
    }
  }

  public destroy() {
    this.terminate()
    this.onProgressCallback = null
    this.onCompleteCallback = null
    this.onErrorCallback = null
  }
}
