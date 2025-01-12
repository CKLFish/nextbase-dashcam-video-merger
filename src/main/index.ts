import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import fs from 'fs/promises'
import { path as staticFFMpegPath } from '@ffmpeg-installer/ffmpeg'
import { spawn } from 'child_process'

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  ipcMain.handle('select-directory', async () => {
    const { filePaths } = await dialog.showOpenDialog({
      properties: ['openDirectory']
    })
    return filePaths
  })

  ipcMain.handle('list-files', async (_event, dir) => {
    const paths = await fs.readdir(dir)
    return paths
  })

  ipcMain.handle('group_files', async (_event, dateMap: Map<string, string[]>) => {
    const regExps = [/_FR$/gm, /_RE$/gm]
    const iterator = dateMap.entries()
    let next = iterator.next()

    const groupDateMap = new Map<string, string[][]>()
    while (!next.done) {
      const [d, files] = next.value ?? []

      const groupFiles = regExps.map((regExp) => files.filter((f) => regExp.test(f)))
      groupDateMap.set(d, groupFiles)
      next = iterator.next()
    }
    return groupDateMap
  })

  ipcMain.on(
    'merge-files',
    async (e, dateMap: Map<string, string[][]>, inputPath, outputPath, ffmpegPath) => {
      console.log('merge files')
      const _ffmpegPath = ffmpegPath ? ffmpegPath : staticFFMpegPath
      if (!_ffmpegPath) {
        console.log('merge-files-error')
        e.reply('merge-files-error', `ffmpegPath invalid ${_ffmpegPath}`)
        return
      }
      e.reply('merge-files-loading-start')
      console.log('merge-files-loading-start', ffmpegPath)

      const iterator = dateMap.entries()
      let next = iterator.next()
      while (!next.done) {
        const [d, files] = next.value ?? []
        console.log(`process: ${d} ${files}`)
        // e.reply('merge-files-progress-start', d)
        for (let i = 0; i < files.length; i++) {
          const videos = files[i]
          e.reply('merge-files-progress-start', d, i)
          const fileListContent = videos.map((v) => `file '${inputPath}\\${v}.mp4'`).join('\n')

          const txt = `${videos[0]}.txt`
          try {
            await fs.rm(txt)
          } catch (error) {}

          await fs.writeFile(txt, fileListContent)

          const dateRegExp = /(\d{6})_(\d{6})_(\d{3}_\w{2})/gm
          const matches = dateRegExp.exec(videos[0])
          const date = matches?.[1]
          const outputFileName = [
            date,
            files.length > 2 ? '' : i === 0 ? 'FR' : 'RE',
            'merged.mp4'
          ].join('_')

          try {
            await fs.rm(`${outputPath}/${outputFileName}`)
          } catch (error) {}

          await new Promise((resolve, reject) => {
            const ffmpegProcess = spawn(_ffmpegPath!, [
              '-f',
              'concat', // Use FFmpeg concat demuxer
              '-safe',
              '0', // Safe file paths (handles spaces or special characters)
              '-i',
              txt, // Input file list
              '-c',
              'copy', // Copy streams without re-encoding
              `${outputPath}/${outputFileName}` // Output file
            ])

            // Handle FFmpeg process events
            ffmpegProcess.stdout.on('data', () => {
              // console.log(`FFmpeg stdout: ${data}`)
            })

            ffmpegProcess.stderr.on('data', () => {
              // console.error(`FFmpeg stderr: ${data}`)
            })

            ffmpegProcess.on('close', async (code) => {
              if (code === 0) {
                await fs.rm(txt)
                e.reply('merge-files-progress-end', d, i)
                resolve(code)
                console.log(`Combining completed! Output file: ${outputFileName}`)
              } else {
                reject(code)
                console.error(`FFmpeg process exited with code ${code}`)
              }
            })
          })
        }
        // e.reply('merge-files-progress-end', d)
        next = iterator.next()
      }
      console.log('merge-files-loading-end')
      e.reply('merge-files-loading-end')
    }
  )

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
