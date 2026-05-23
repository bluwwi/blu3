// hooks/usePictureInPicture.ts
'use client'
import { useState, useEffect, useRef } from 'react'

export function usePictureInPicture(videoRef: React.RefObject<HTMLVideoElement>) {
    const [isPipActive, setIsPipActive] = useState(false)
    const [isSupported, setIsSupported] = useState(false)

    useEffect(() => {
        // Check if PiP is supported
        setIsSupported(!!(document as any).pictureInPictureEnabled)
    }, [])

    useEffect(() => {
        if (!videoRef.current || !isSupported) return

        const video = videoRef.current

        // Handle PiP state changes
        const onEnterPiP = () => setIsPipActive(true)
        const onLeavePiP = () => setIsPipActive(false)

        video.addEventListener('enterpictureinpicture', onEnterPiP)
        video.addEventListener('leavepictureinpicture', onLeavePiP)

        return () => {
            video.removeEventListener('enterpictureinpicture', onEnterPiP)
            video.removeEventListener('leavepictureinpicture', onLeavePiP)
        }
    }, [videoRef, isSupported])

    // Auto-enable PiP when tab is hidden
    useEffect(() => {
        if (!isSupported || !videoRef.current) return

        const handleVisibilityChange = async () => {
            if (document.hidden && !isPipActive) {
                try {
                    await (videoRef.current as any).requestPictureInPicture()
                } catch (err) {
                    console.warn('Failed to auto-enable PiP:', err)
                }
            }
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
    }, [videoRef, isPipActive, isSupported])

    const togglePiP = async () => {
        if (!videoRef.current || !isSupported) return

        try {
            if (isPipActive) {
                await (document as any).exitPictureInPicture()
            } else {
                await (videoRef.current as any).requestPictureInPicture()
            }
        } catch (err) {
            console.error('PiP error:', err)
            alert('Picture-in-Picture failed. Please keep this tab visible.')
        }
    }

    return { isPipActive, isSupported, togglePiP }
}