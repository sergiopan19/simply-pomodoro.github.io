import { useRef } from 'react'
import { useEffect, useState } from 'react'
import './App.css'
import timer from './styles/timer.module.css'

function App() {
  //Defines the different timer settings
  const timerTypes = {
    pomodoro: {time: 25, color: "green", label: "Pomodoro"},
    shortBreak: {time: 5, color: "orange", label: "Short Break"},
    longBreak: {time: 15, color: "red", label: "Long Break"}
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

  //Reset timer when timer type changes
  useEffect(() => {
    setTime(timerTypes[timerType].time * 60)
    setIsRunning(false)
  }, [timerType, timerTypes])

  //Countdown logic
  useEffect(() => {
    if(!isRunning || time <= 0) return

    const interval = setInterval(() => {
      setTime((prevTimeLeft) => prevTimeLeft - 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [isRunning, time])

  //Handles basic timer controls
  const handleStartStop = () => setIsRunning(!isRunning)
  const handleReset = () => {
    setTime(timerTypes[timerType].time * 60)
    setIsRunning(false)
  }
  const handleIncrement = (seconds) => setTime((prevTime) => prevTime + seconds)

  return (
    <div className={timer.container}>
      <TabPanel 
        timerTypes={timerTypes}
        timerType={timerType}
        setTimerType={setTimerType}
      />
      <Clock 
        time={time}
        onTimeChange={setTime}
        isRunning={isRunning}
      />
    <div>
      <Controls
        isRunning={isRunning}
        onStartStop={handleStartStop}
        onReset={handleReset}
        onIncrement={handleIncrement}
      />
    </div>
    </div>
  )
}

function Tab({tabKey, config, isActive, onClick}) {
  return (
    <button
      className={`${isActive ? 'tab active' : 'tab'} ${timer.timerButton}`}
      onClick={() => onClick(tabKey)}
      style={{ '--color': config.color }}
    >
      {config.label}
    </button>
  ) 
}

function TabPanel({timerTypes, timerType, setTimerType}) {
  return (
    <div className={timer.tabContainer}>
      {Object.entries(timerTypes).map(([key, config]) => (
        <Tab
          key={key}
          tabKey={key}
          config={config}
          isActive={timerType === key}
          onClick={setTimerType}
        />
      ))}
    </div>
  )
}

function Clock({time, onTimeChange, isRunning}) {
  const [isEditing, setIsEditing] = useState(false)
  const [digits, setDigits] = useState('0000')

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
    } else if (e.key === 'Escape') {
      setIsEditing(false)
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
          className={timer.clockContainer}
          type="text"
          value={formatDisplay(digits)}
          onKeyDown={handleKeyDown}
          onBlur={handleSubmit}
          autoFocus
          readOnly
        />
      </form>
    )
  }
  
  return (
    <h1 className={timer.clockContainer} onClick={handleClick} style={{ cursor: isRunning ? 'default' : 'pointer' }}>
      {minutes}:{seconds.toString().padStart(2, '0')}
    </h1>
  )
}

function Increment({increment, onIncrement}) {
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <button className={timer.timerButton} onClick={() => onIncrement(increment)}>
      <h2>+{formatTime(increment)}</h2>
    </button>
  )
}

function Controls({isRunning, onStartStop, onReset, onIncrement}) {
  return (
    <>
      <div className={timer.incrementContainer}>
        <Increment increment={30} onIncrement={onIncrement} />
        <Increment increment={60} onIncrement={onIncrement} />
        <Increment increment={300} onIncrement={onIncrement} />
      </div>
      <div className={timer.controlsContainer}>
        <StartStopButton onStartStop={onStartStop} isRunning={isRunning}/>
        <ResetButton onReset={onReset}/>
      </div>
    </>
  )
}

function StartStopButton ({onStartStop, isRunning}) {
  return (
    <button className={timer.timerButton} onClick={onStartStop}>
      {isRunning ? 'Stop' : 'Start'}
    </button>
  )
}

function ResetButton ({onReset}) {
  return (
    <button className={timer.timerButton} onClick={onReset}>
      Reset
    </button>
  )
}

export default App
