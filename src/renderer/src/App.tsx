import {
  AppBar,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Checkbox,
  CircularProgress,
  Container,
  Dialog,
  DialogContent,
  FormControlLabel,
  FormGroup,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Toolbar,
  Typography
} from '@mui/material'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { useEffect, useState } from 'react'
import DirectorySelectorCard from './components/DirectorySelectorCard'
import { CheckRounded, Close } from '@mui/icons-material'
import HomeNavBar from './components/HomeNavBar/HomeNavBar'
import Transition from './components/Transition'

type Files = string[]
type DateMap = Map<string, Files>
type GroupDateMap<T = Files> = Map<string, Array<T>>

const getVideoTypeByIndex = (index: number) => {
  return index === 0 ? 'FR' : 'RE'
}

function App(): JSX.Element {
  // const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')

  const [inputDirectory, setInputDirectory] = useState<string | undefined>(undefined)
  const [outputDirectory, setOutputDirectory] = useState<string | undefined>(undefined)

  const [splitFrontAndRear, setSplitFrontAndRear] = useState<boolean>(true)

  const [errors, setErrors] = useState<string | undefined>()

  const [showMergingModal, setShowMergingModal] = useState(false)

  const [files, setFiles] = useState<Files>([])
  const [dateMap, setDateMap] = useState<DateMap>()
  const [progressMap, setProgressMap] = useState<GroupDateMap<Files | null>>()
  const [progressDateFiles, setProgressDateFiles] = useState<string | undefined>()

  useEffect(() => {
    if (inputDirectory && outputDirectory) {
      window.electron.ipcRenderer.invoke('list-files', inputDirectory).then((paths) => {
        setFiles(paths)

        const _dates = new Map<string, Files>()
        if (!paths) {
          return // _dates
        }
        paths.forEach((p) => {
          // 241227_121549_001_FR.MP4
          const dateRegExp = /(\d{6})_(\d{6})_(\d{3}_\w{2})/gm
          const matches = dateRegExp.exec(p)
          const date = matches?.[1]
          if (date) {
            if (!_dates.has(date)) {
              _dates.set(date, [])
            }
            _dates.set(date, [..._dates.get(date)!, matches[0]])
          }
        })
        setDateMap(_dates)
      })
    }
  }, [inputDirectory, outputDirectory])

  useEffect(() => {
    window.electron.ipcRenderer.on('merge-files-loading-start', (_e) => {
      setShowMergingModal(true)
    })
    window.electron.ipcRenderer.on('merge-files-loading-end', (_e) => {
      // setShowMergingModal(false)
    })
    window.electron.ipcRenderer.on('merge-files-error', (_e, errorMessage) => {
      // setShowMergingModal(false)
      setErrors(errorMessage)
    })
    window.electron.ipcRenderer.on('merge-files-progress-start', (_e, date, index) => {
      const processingFile = `${date}_${getVideoTypeByIndex(index)}`
      console.log('merge-files-progress-start:: ', processingFile)
      setProgressDateFiles(processingFile)
    })
    window.electron.ipcRenderer.on('merge-files-progress-end', (_e, date, index) => {
      setProgressDateFiles(undefined)
      setProgressMap((prev) => {
        if (prev && prev.has(date)) {
          const batches = prev.get(date)
          console.log('merge-files-progress-end:: ', date, batches)
          if (batches?.[index]) {
            batches.splice(index, 1, null)
            prev.set(date, batches)
          }
        }
        return prev
      })
    })
  }, [])

  const handleClose = () => {
    setShowMergingModal(false)
  }

  return (
    <>
      <Container
        maxWidth="xl"
        sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column', gap: 1 }}
      >
        <HomeNavBar
          iconActions={[
            {
              type: 'job',
              onClick: () => {
                setShowMergingModal(true)
              }
            },
            {
              type: 'tool'
            }
          ]}
        />
        <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'row', gap: 1 }}>
          <DirectorySelectorCard
            title={'Source'}
            label={'Select the input directory'}
            value={inputDirectory}
            setValue={setInputDirectory}
          />
          {inputDirectory ? (
            <>
              <IconButton color="info">
                <ChevronRightIcon />
              </IconButton>
              <DirectorySelectorCard
                title={'Destination'}
                label={'Select the output directory'}
                value={outputDirectory}
                setValue={setOutputDirectory}
              />
            </>
          ) : null}
        </Box>
        {inputDirectory && outputDirectory ? (
          <>
            <IconButton color="info" sx={{ rotate: '90deg' }}>
              <ChevronRightIcon />
            </IconButton>
            <Card>
              <CardContent>
                <Typography>Files: {files.length}</Typography>
                {dateMap
                  ? [...dateMap.entries()].map(([d, files]) => {
                      return <Typography key={d}>{`${d} count: ${files.length}`}</Typography>
                    })
                  : null}
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={splitFrontAndRear}
                        onChange={() => setSplitFrontAndRear((prev) => !prev)}
                      />
                    }
                    label="Split Front and Rear"
                  />
                </FormGroup>
              </CardContent>
              <CardActions>
                <Button
                  size={'small'}
                  variant="contained"
                  color="primary"
                  disabled={!dateMap}
                  onClick={async () => {
                    let groupDateMap: GroupDateMap<Files> = new Map()
                    if (splitFrontAndRear) {
                      groupDateMap = await window.electron.ipcRenderer.invoke(
                        'group_files',
                        dateMap
                      )
                    } else {
                      const iterator = dateMap!.entries()
                      let next = iterator.next()
                      while (!next.done) {
                        const [d, files] = next.value ?? []
                        groupDateMap.set(d, [files])
                        next = iterator.next()
                      }
                    }
                    console.log('groupDateMap:: ', groupDateMap, splitFrontAndRear)
                    setProgressMap(groupDateMap)
                    window.electron.ipcRenderer.send(
                      'merge-files',
                      groupDateMap,
                      inputDirectory,
                      outputDirectory
                    )
                  }}
                >
                  Merge By Date
                </Button>
              </CardActions>
            </Card>
          </>
        ) : null}
        <Dialog
          fullScreen
          onClose={handleClose}
          open={showMergingModal}
          TransitionComponent={Transition}
        >
          <AppBar sx={{ position: 'relative' }}>
            <Toolbar>
              <IconButton edge="start" color="inherit" onClick={handleClose} aria-label="close">
                <Close />
              </IconButton>
              <Typography variant="h6">{'Merge list'}</Typography>
            </Toolbar>
          </AppBar>
          {progressMap ? (
            <Box>
              <List>
                {[...progressMap.entries()].map(([date, jobs]) => {
                  return jobs.map((job, index) => {
                    const jobName = `${date}_${getVideoTypeByIndex(index)}`
                    console.log(progressMap, jobName)
                    return (
                      <ListItem
                        disablePadding
                        key={jobName}
                        // sx={{ backgroundColor: 'red', justifyContent: 'center' }}
                      >
                        <ListItemButton>
                          <ListItemText
                            primary={jobName}
                            // sx={{ height: '100%', alignSelf: 'center', background: 'green' }}
                          />
                          {jobName === progressDateFiles ? (
                            <Box>
                              <CircularProgress size={14} color="primary" />
                            </Box>
                          ) : job === null ? (
                            <Box>
                              <CheckRounded color="success" />
                            </Box>
                          ) : null}
                        </ListItemButton>
                      </ListItem>
                    )
                  })
                })}
              </List>
            </Box>
          ) : null}
          <DialogContent></DialogContent>
        </Dialog>
        {errors ? (
          <Card>
            <CardContent>
              <Typography>{errors}</Typography>
            </CardContent>
          </Card>
        ) : null}
      </Container>
      {/* <img alt="logo" className="logo" src={electronLogo} /> */}
      {/* <div className="creator">Powered by electron-vite</div> */}
      {/* <div className="text">
        Build an Electron app with <span className="react">React</span>
        &nbsp;and <span className="ts">TypeScript</span>
      </div>
      <p className="tip">
        Please try pressing <code>F12</code> to open the devTool
      </p>
      <div className="actions">
        <div className="action">
          <a href="https://electron-vite.org/" target="_blank" rel="noreferrer">
            Documentation
          </a>
        </div>
        <div className="action">
          <a target="_blank" rel="noreferrer" onClick={ipcHandle}>
            Send IPC
          </a>
        </div>
      </div> */}
      {/* <Versions></Versions> */}
    </>
  )
}

export default App
