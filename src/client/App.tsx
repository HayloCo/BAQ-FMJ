import { type FC, useState, useEffect } from 'react'
import { render } from 'react-dom'
import { io } from 'socket.io-client'
import './App.scss'

const App: FC = () => {
  const socket = io()
  const [isConnected, setIsConnected] = useState(socket.connected)
  const [data, setData] = useState<string | null>(null)

  const fetchData = (): void => {
    fetch('/api')
      .then(async (response) => await response.json())
      .then((data) => { setData(data.message) })
      .catch((error) => { console.error(error) })
  }

  useEffect(() => {
    socket.connect()
    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    function onConnect () {
      setIsConnected(true)
    }

    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    function onDisconnect () {
      setIsConnected(false)
    }

    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    function onFooEvent (value) {
      console.log(value)
    }

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('foo', onFooEvent)
    fetchData()

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off('foo', onFooEvent)
    }
  }, [])

  return (
    <div className="App">
      <p>State: { isConnected }</p>
      <header className="App-header">
        Test
        <p>{data === null || data === '' ? 'Loading...' : data}</p>
      </header>
    </div>
  )
}

render(<App />, document.getElementById('root'))
