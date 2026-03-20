'use client'

// Imperative toast — call showToast() from anywhere
let _setMsg: ((msg: string) => void) | null = null

export function showToast(msg: string) {
  if (_setMsg) _setMsg(msg)
}

import { useState, useEffect, useCallback } from 'react'

export function Toast() {
  const [msg, setMsg]       = useState('')
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    _setMsg = (m: string) => {
      setMsg(m)
      setVisible(true)
      setTimeout(() => setVisible(false), 2500)
    }
    return () => { _setMsg = null }
  }, [])

  if (!msg) return null

  return (
    <div style={{
      position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
      background: 'var(--accent)', color: 'white',
      padding: '10px 20px', borderRadius: 20, fontSize: 13,
      zIndex: 9999, pointerEvents: 'none',
      transition: 'opacity 0.3s',
      opacity: visible ? 1 : 0,
    }}>
      {msg}
    </div>
  )
}
