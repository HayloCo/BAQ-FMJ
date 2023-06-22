import { type FC, useState, useEffect } from 'react'
import { render } from 'react-dom'
import { ipcRenderer } from 'electron';
import './App.scss'
import merci from './slides/merci.png';
import start from './slides/start.png';

const App: FC = () => {
  const [slides, setSlides] = useState([])
  const [config, setConfig] = useState({
    slideSize: 5,
    random: true,
    usbCopy: false
  })
  const [currentSlide, setCurrentSlide] = useState(0);
  const [playing, setPlaying] = useState('ready');
  const [randomNumbers, setRandomNumbers] = useState<number[]>([]);
  const [index, setIndex] = useState(0);

  function generateRandomNumbers() {
    const numbers: Set<number> = new Set();

    while (numbers.size < config.slideSize ?? slides.length ) {
        const randomNumber = Math.floor(Math.random() * slides.length);
        numbers.add(randomNumber);
    }

    const newRandomNumbers = Array.from(numbers);
    setRandomNumbers(newRandomNumbers);
    setIndex(0)
    return newRandomNumbers;
  }

  useEffect(() => {
    ipcRenderer.send('get-drive');
    ipcRenderer.on('images', (event, images) => {
      setSlides(images)
    })
    ipcRenderer.on('config', (event, config) => {
      setConfig(config)
    })
  }, [])
  useEffect(() => {
    const next = () => {
      if (playing === 'ready') {
        let newRandomNumbers = generateRandomNumbers();
        if(config.random) {
          setCurrentSlide(newRandomNumbers[0]);
        } else {
          setCurrentSlide(0);
          setIndex(0);
        }
        setPlaying('on_play');
        ipcRenderer.send('start-record');
      } else if (playing === 'on_play' && index + 1 === (config.slideSize ? config.slideSize : slides.length)) {
          setPlaying('finished');
          ipcRenderer.send('stop-record');
      } else if (playing === 'on_play' && index + 1 < (config.slideSize ? config.slideSize : slides.length)) {
        setIndex((prevIndex) => {
          const newIndex = (prevIndex + 1) % (config.random ? randomNumbers.length : slides.length);
          if(config.random) {
            setCurrentSlide(randomNumbers[newIndex]);
          } else {
            setCurrentSlide(newIndex);
          }
          return newIndex;
        });
    }
  };
    const cancel = () => {
      ipcRenderer.send('stop-record');
      setPlaying('ready');
    }

    const handleKeyDown = (e) => {
      e = e || window.event;
      if (e.keyCode === 67) {
        cancel()
      }
      if (e.keyCode === 83) {
        next()
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [slides, playing, randomNumbers, index, currentSlide, config])

  return (
    <div className="App">
      {playing == 'ready' &&
        <img src={start} className="flex-item" />
      }

      {playing == 'on_play' &&
        <img src={slides[currentSlide]} className="flex-item" />
      }

      {playing == 'finished' &&
        <img src={merci} className="flex-item" />
      }
    </div>
  )
}

render(<App />, document.getElementById('root'))
