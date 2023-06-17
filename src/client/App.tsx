import { type FC, useState, useEffect } from 'react'
import { render } from 'react-dom'
import './App.scss'

const App: FC = () => {
  const [data, setData] = useState<string | null>(null)

  const fetchData = (): void => {
    fetch('/api')
      .then(async (response) => await response.json())
      .then((data) => { setData(data.message) })
      .catch((error) => { console.error(error) })
  }

  useEffect(() => {
    fetchData()
  }, [])

  return (
    <div className="App">
      <header className="App-header">
        Test
        <p>{data === null || data === '' ? 'Loading...' : data}</p>
      </header>
    </div>
  )
}

render(<App />, document.getElementById('root'))
