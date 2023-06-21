import { type FC, useState, useEffect } from 'react'
import { render } from 'react-dom'
import { ipcRenderer } from 'electron';
import './App.scss'

const App: FC = () => {
  const [slides, setSlides] = useState([])
  const [currentSlide, setCurrentSlide] = useState(0);
  const [playing, setPlaying] = useState('ready');

  useEffect(() => {
    const next = () => {
      setCurrentSlide((prevSlide) => (prevSlide + 1) % slides.length);
    }
    ipcRenderer.send('get-images');
    ipcRenderer.on('images', (event, images) => {
      setSlides(images)
    })
    ipcRenderer.on('gpio', (event, type) => {
      if (type == 'buzzer_ready') setCurrentSlide(0)
      if (type == 'buzzer_on_play') next()
      if (type == 'buzzer_finished') setPlaying('ready')
      if (type == 'cancel') setPlaying('ready')
    })

    const handleKeyDown = (e) => {
      e = e || window.event;
      if (e.keyCode === 67) {
        next()
      }
      if (e.keyCode === 40) {
        next()
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [slides, playing])

  return (
    <div className="App">
      <img src={slides[currentSlide]} className="flex-item" />
    </div>
  )
}

render(<App />, document.getElementById('root'))
