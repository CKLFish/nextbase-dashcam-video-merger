import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardActions from '@mui/material/CardActions'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import { FC } from 'react'

export interface DirectorySelectorCardProps {
  title: string
  label: string
  value?: string
  setValue: (newValue?: string) => void
}

const DirectorySelectorCard: FC<DirectorySelectorCardProps> = ({
  title,
  label,
  value,
  setValue
}) => {
  return (
    <Card sx={{ minWidth: 275 }}>
      <CardContent>
        <Typography gutterBottom sx={{ color: 'text.secondary', fontSize: 14 }}>
          {title}
        </Typography>
        <Typography component={'div'}>{label}</Typography>
        <Typography sx={{ fontSize: 14 }}>{value ?? ' '}</Typography>
      </CardContent>
      <CardActions>
        <Button
          size={'small'}
          color="error"
          disabled={!value}
          onClick={async () => {
            setValue(undefined)
          }}
        >
          Reset
        </Button>
        <Button
          size={'small'}
          variant="contained"
          onClick={async () => {
            const filePaths = await window.electron.ipcRenderer.invoke('select-directory')
            // console.log(filePaths)
            setValue(filePaths[0])
          }}
        >
          {[value ? 'Re' : null, 'Select'].filter((v) => !!v).join('-')}
        </Button>
      </CardActions>
    </Card>
  )
}

export default DirectorySelectorCard
