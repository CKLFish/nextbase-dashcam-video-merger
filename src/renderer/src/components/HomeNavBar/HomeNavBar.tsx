import { Settings, Work } from '@mui/icons-material'
import { AppBar, IconButton, Toolbar, Typography } from '@mui/material'
import React, { FC, useCallback, useState } from 'react'
import SettingDialog from '../SettingDialog/SettingDialog'

export type HomeNavBarActionType = 'tool' | 'job'

export type HomeNavBarAction = {
  type: HomeNavBarActionType
  onClick?: React.MouseEventHandler<HTMLButtonElement>
  icon?: React.ReactElement
}

export interface HomeNavBarProps {
  title?: string
  iconActions?: HomeNavBarAction[]
}

const getIconByActionType = (type: HomeNavBarActionType) => {
  switch (type) {
    case 'job':
      return <Work />
    case 'tool':
      return <Settings />
    default:
      return null
  }
}

const HomeNavBar: FC<HomeNavBarProps> = ({ title = 'Merger', iconActions }) => {
  const [showSetting, setShowSetting] = useState(false)

  const _onClick = useCallback(
    (type: HomeNavBarActionType, onClick?: React.MouseEventHandler<HTMLButtonElement>) =>
      (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        switch (type) {
          case 'job':
            break
          case 'tool':
            setShowSetting(true)
            break
        }
        onClick?.(e)
      },
    []
  )
  return (
    <>
      <AppBar>
        <Toolbar>
          <Typography variant="h6" sx={{ flex: 1 }}>
            {title}
          </Typography>
          {iconActions?.map(({ type, onClick, icon }) => {
            return (
              <IconButton
                key={type}
                sx={() => ({
                  color: 'white'
                })}
                onClick={_onClick(type, onClick)}
              >
                {icon ?? getIconByActionType(type)}
              </IconButton>
            )
          })}
        </Toolbar>
      </AppBar>
      <SettingDialog
        open={showSetting}
        onClose={() => {
          setShowSetting(false)
        }}
      />
    </>
  )
}

export default HomeNavBar
