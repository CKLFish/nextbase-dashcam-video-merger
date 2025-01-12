import {
  AppBar,
  Dialog,
  DialogProps,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography
} from '@mui/material'
import { FC } from 'react'
import Transition from '../Transition'
import { ChevronRight, Close } from '@mui/icons-material'

const SettingDialog: FC<DialogProps> = ({ open, onClose }) => {
  const handleClose = (e) => {
    onClose?.(e, 'backdropClick')
  }
  return (
    <Dialog fullScreen onClose={handleClose} open={open} TransitionComponent={Transition}>
      <AppBar sx={{ position: 'relative' }}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={handleClose} aria-label="close">
            <Close />
          </IconButton>
          <Typography variant="h6">Settings</Typography>
        </Toolbar>
      </AppBar>
      <List>
        <ListItem>
          <ListItemButton onClick={() => {}}>
            <ListItemText primary="FFMpeg location" secondary="Customize your ffmpeg location" />
            <ListItemIcon>
              <ChevronRight></ChevronRight>
            </ListItemIcon>
          </ListItemButton>
        </ListItem>
      </List>
    </Dialog>
  )
}

export default SettingDialog
