import { type FC, useState, useEffect } from 'react'
import { render } from 'react-dom'
import { ipcRenderer } from 'electron';
import './App.scss'

const App: FC = () => {
  const [slides, setSlides] = useState([])
  const [currentSlide, setCurrentSlide] = useState(0);
  const [playing, setPlaying] = useState('ready');
  const [randomNumbers, setRandomNumbers] = useState<number[]>([]);

  const slideSize = 5;
  const random = true;

  let index = 0;

  function generateRandomNumbers() {
    const numbers: Set<number> = new Set();

    while (numbers.size < slideSize) {
        const randomNumber = Math.floor(Math.random() * slides.length);
        numbers.add(randomNumber);
    }

    setRandomNumbers(Array.from(numbers));
    index = 0; // Réinitialiser l'index
  }

  function getNextRandomNumber() {
      if (randomNumbers.length === 0) {
          // Si la liste n'a pas encore été générée, la générer
          generateRandomNumbers();
      }

      const nextNumber = randomNumbers[index];
      index = (index + 1) % randomNumbers.length;
      return nextNumber;
  }

  useEffect(() => {
    const next = () => {
      if(random) setCurrentSlide(getNextRandomNumber());
    }
    const cancel = () => {
      setPlaying('ready');
      generateRandomNumbers();
    }
    ipcRenderer.send('get-images');
    ipcRenderer.on('images', (event, images) => {
      setSlides(images)
    })

    const handleKeyDown = (e) => {
      e = e || window.event;
      if (e.keyCode === 67) {
        ipcRenderer.send('cancel');
        cancel()
      }
      if (e.keyCode === 83) {
        ipcRenderer.send('next');
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
