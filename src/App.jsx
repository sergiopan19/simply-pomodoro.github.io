import { useEffect, useState, useRef, useCallback} from 'react'
import './styles/App.css'
import timer from './styles/timer.module.css'

function App() {
  //Defines the different timer settings
  const timerTypes = {
    pomodoro: {time: 25, color: '#B0C5A4', buttonColor: '#79ab5bff', label: "Pomodoro"},
    shortBreak: {time: 5, color: '#f1b85dff', buttonColor: '#ec9100ff', label: "Short Break"},
    longBreak: {time: 15, color: '#ca5f5fff', buttonColor: '#aa1818ff', label: "Long Break"}
  }

  const [timerType, setTimerType] = useState('pomodoro')

  return (
    <>
      <Timer 
        timerTypes={timerTypes}
        timerType={timerType}
        setTimerType={setTimerType}
      />
    </>
  )
}

function Timer({timerTypes, timerType, setTimerType}) {
  const [time, setTime] = useState(timerTypes[timerType].time * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [alarmAudio, setAlarmAudio] = useState(null)
  
  //Reset timer when timer type changes
  useEffect(() => {
    setTime(timerTypes[timerType].time * 60)
    setIsRunning(false)
  }, [timerType, timerTypes])

  //Countdown logic
  useEffect(() => {
    if(!isRunning || time <= 0) {
      if (time === 0 && isRunning) {
        playAlarm()
      }  
    return
    }

    const interval = setInterval(() => {
      setTime((prevTimeLeft) => prevTimeLeft - 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [isRunning, time])

  //Handles basic timer controls
  const handleStartStop = useCallback(() => {
    stopAlarm()
    setTime((prevTime) => {
      if (prevTime === 0) {
        return timerTypes[timerType].time * 60
      }
      return prevTime
    })
    setIsRunning(!isRunning)
  }, [alarmAudio, timerTypes, timerType, isRunning])
  const handleReset = () => {
    stopAlarm()
    setTime(timerTypes[timerType].time * 60)
    setIsRunning(false)
  }
  const handleIncrement = (seconds) => setTime((prevTime) => prevTime + seconds)

  const playAlarm = () => {
    const audio = new Audio('./assets/alarm-clock.mp3')
    audio.loop = true
    audio.play().catch((error) => console.log('Audio failed to play: ', error))
    setAlarmAudio(audio)
  }

  const stopAlarm = () => {
    if (alarmAudio) {
      alarmAudio.pause()
      alarmAudio.currentTime = 0
      setAlarmAudio(null)
    }
  }

  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (e.key === ' ') {
        e.preventDefault()
        handleStartStop()
      }
    }

    document.addEventListener('keydown', handleGlobalKeyDown)
    return () => document.removeEventListener('keydown', handleGlobalKeyDown)
  }, [handleStartStop])

  return (
    <div className={timer.container} style={{'--color': timerTypes[timerType].color}}>
      <TabPanel 
        timerTypes={timerTypes}
        timerType={timerType}
        setTimerType={setTimerType}
        buttonColor={timerTypes[timerType].buttonColor}
      />
      <Clock 
        time={time}
        onTimeChange={setTime}
        isRunning={isRunning}
        onStartStop={handleStartStop}
      />
      <IncrementPanel 
        onIncrement={handleIncrement} 
        buttonColor={timerTypes[timerType].buttonColor} 
      />  
      <ControlPanel 
        isRunning={isRunning} 
        onStartStop={handleStartStop} 
        onReset={handleReset}
        buttonColor={timerTypes[timerType].buttonColor} 
      />
    </div>
  )
}

//Base class for buttons on timer
function Button({ children, onClick, color, className}) {
  return (
    <button
      className={`${timer.timerButton} ${className}`}
      onClick={onClick}
      style={{ '--color': color}}
    >
    {children}
    </button>
  )

}

//Extends Tab class. Handles preset timer settings
function Tab({ tabKey, config, isActive, onClick, buttonColor}) {
  return (
    <Button
      onClick={() => onClick(tabKey)}
      color={buttonColor}
      className={isActive ? 'tab active' : 'tab'}
    >
      {config.label}
    </Button>
  )
}

//Tab container
function TabPanel({timerTypes, timerType, setTimerType, buttonColor}) {
  return (
    <div className={timer.tabContainer}>
      {Object.entries(timerTypes).map(([key, config]) => (
        <Tab
          key={key}
          tabKey={key}
          config={config}
          isActive={timerType === key}
          onClick={setTimerType}
          buttonColor={buttonColor}
        />
      ))}
    </div>
  )
}

//Handles time editing and time display
function Clock({time, onTimeChange, isRunning, onStartStop}) {
  const [isEditing, setIsEditing] = useState(false)
  const [digits, setDigits] = useState('0000')
  const inputRef = useRef(null)

  const minutes = Math.floor(time/ 60)
  const seconds = time % 60

  //Handles value change on clicking and submission when user clicks off or presses enter 
  const handleClick = () => {
    if (!isRunning) {
      setIsEditing(true)
      const currentDigits = `${minutes.toString().padStart(2, '0')}${seconds.toString().padStart(2, '0')}`
      setDigits(currentDigits)
    }
  }

  
  const handleTouch = (e) => {
    e.preventDefault()
    handleClick()
  }

  useEffect(() => {
    if (isEditing && inputRef.current) {
      const length = inputRef.current.value.length
      inputRef.current.setSelectionRange(length, length)
    }
  }, [isEditing, digits])

  const formatDisplay = (digitString) => {
    const mins = digitString.slice(0, 2)
    const secs = digitString.slice(2, 4)
    return `${parseInt(mins)}:${secs}`
  }

  const handleKeyDown = (e) => {
    if (e.key >= '0' && e.key <= '9') {
      e.preventDefault()
      setDigits(prev => (prev + e.key).slice(-4))
    } else if (e.key === 'Backspace') {
      e.preventDefault()
      setDigits(prev => ('0' + prev.slice(0, -1)))
    } else if (e.key === 'Enter') {
      handleSubmit(e)
    } else if (e.key === ' ') {
      e.preventDefault()
      handleSubmit(e) // Submit current edit
    } else if (e.key === 'Escape') {
      setIsEditing(false)
    } else if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
      e.preventDefault() // Block arrow keys
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const mins = parseInt(digits.slice(0, 2))
    const secs = parseInt(digits.slice(2, 4))
    onTimeChange(mins * 60 + secs)
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <form onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          className={timer.clockContainer}
          type="text"
          inputMode='numeric'
          pattern="[0-9]*"
          value={formatDisplay(digits)}
          onKeyDown={handleKeyDown}
          onMouseDown={(e) => e.preventDefault()} // Prevent mouse selection
          onSelect={(e) => e.preventDefault()}    // Prevent text selection
          onBlur={handleSubmit}
          autoFocus
          readOnly
        />
      </form>
    )
  }
  
  return (
    <h1 
      className={timer.clockContainer} 
      onClick={handleClick} 
      onTouchStart={handleTouch}
      style={{ cursor: isRunning ? 'default' : 'pointer' }}>
      {minutes}:{seconds.toString().padStart(2, '0')}
    </h1>
  )
}

//Extends Button class. Increment time 
function Increment({increment, onIncrement, color}) {
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <Button onClick={() => onIncrement(increment)} color={color}>
      <h2>+{formatTime(increment)}</h2>
    </Button>
  )
}

//Increment button container
function IncrementPanel({onIncrement, buttonColor}) {
  const increments = [
    { value: 30, label: '+0:30' },
    { value: 60, label: '+1:00' },
    { value: 300, label: '+5:00' }
  ]

  return (
    <div className={timer.incrementContainer}>
      {increments.map((increment) => (
        <Increment
          key={increment.value}
          increment={increment.value}
          onIncrement={onIncrement}
          color={buttonColor}
        />
      ))}
    </div>
  )
}

//Pause, play, reset control container
function ControlPanel ({isRunning, onStartStop, onReset, buttonColor}) {
   const controls = [
    { 
      type: 'startStop', 
      onClick: onStartStop, 
      icon: isRunning ? './assets/pause.svg' : './assets/play.svg',
      alt: isRunning ? 'Pause' : 'Play'
    },
    { 
      type: 'reset', 
      onClick: onReset, 
      icon: './assets/reset.svg',
      alt: 'Reset'
    }
  ]

  return (
    <div className={timer.controlsContainer}>
      {controls.map((control) => (
          <Button
            key={control.type}
            onClick={control.onClick}
            color={buttonColor}
          >
            <img src={control.icon} alt={control.alt} />
          </Button>
        ))}
    </div>
  )
}

export default App
