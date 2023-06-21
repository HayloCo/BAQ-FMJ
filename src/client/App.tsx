import { type FC, useState, useEffect } from 'react'
import { render } from 'react-dom'
import { ipcRenderer } from 'electron';
import './App.scss'
import merci from './slides/merci.png';
import start from './slides/start.png';

const App: FC = () => {
  const [slides, setSlides] = useState([])
  const [currentSlide, setCurrentSlide] = useState(0);
  const [playing, setPlaying] = useState('ready');
  const [randomNumbers, setRandomNumbers] = useState<number[]>([]);
  const [index, setIndex] = useState(0);

  const slideSize = 0;
  const random = false;

  function generateRandomNumbers() {
    const numbers: Set<number> = new Set();

    while (numbers.size < slideSize ?? slides.length ) {
        const randomNumber = Math.floor(Math.random() * slides.length);
        numbers.add(randomNumber);
    }

    const newRandomNumbers = Array.from(numbers);
    setRandomNumbers(newRandomNumbers);
    setIndex(0)
    return newRandomNumbers;
  }

  useEffect(() => {
    ipcRenderer.send('get-images');
    ipcRenderer.on('images', (event, images) => {
      setSlides(images)
    })

    const next = () => {
      if (playing === 'ready') {
        let newRandomNumbers = generateRandomNumbers();
        if(random) {
          setCurrentSlide(newRandomNumbers[0]);
        } else {
          setCurrentSlide(0);
          setIndex(0);
        }
        setPlaying('on_play');
        ipcRenderer.send('record');
      } else if (playing === 'on_play' && index + 1 === (slideSize ? slideSize : slides.length)) {
          setPlaying('finished');
          ipcRenderer.send('stopRecord');
      } else if (playing === 'on_play' && index + 1 < (slideSize ? slideSize : slides.length)) {
        setIndex((prevIndex) => {
          const newIndex = (prevIndex + 1) % (random ? randomNumbers.length : slides.length);
          if(random) {
            setCurrentSlide(randomNumbers[newIndex]);
          } else {
            setCurrentSlide(newIndex);
          }
          return newIndex;
        });
    }
  };
    const cancel = () => {
      ipcRenderer.send('stopRecord');
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
  }, [slides, playing, randomNumbers, index, currentSlide])

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
