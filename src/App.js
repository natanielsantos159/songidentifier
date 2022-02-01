import { useState, useEffect } from "react";
import MicRecorder from "mic-recorder-to-mp3";
import identifySong from "./services/identifySongApi";
import iTunesSearchApi from "./services/iTunesSearchApi";

import "./App.css";

const Mp3Recorder = new MicRecorder({ bitRate: 128 });

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [identifiedSong, setIdentifiedSong] = useState({
    album: "Midnight Room",
    artist: "Springtime Carnivore",
    genre: "Alternative",
    release_year: "2016",
    title: "Bad Dream Baby",
  });
  const [count, setCount] = useState(0);

  useEffect(() => {
  }, []);

  const recognizeSong = async (file) => {
    const { data, identified } = await identifySong(file);
    if (identified) {
      iTunesSearchApi(data).then((artwork) => {
        data.artwork = artwork;
        setIdentifiedSong(data);
      });
    }
  };



  useEffect(() => {
    let timer;
    if ( isRecording && count < 10){
      timer = setInterval(() => {
        setCount(count + 1);
      }, 1000);
    }
    if(isRecording && count >= 10) stopRecording();
    return () => clearInterval(timer);
  }, [count]);

  const startRecording = () => {
    navigator.mediaDevices
      .getUserMedia({ audio: true, video: false })
      .then(() => {
        Mp3Recorder.start()
          .then(() => {
            setIsRecording(true);
            setCount(1)
          })
          .catch(console.error);
      });
  };

  const stopRecording = () => {
    setIsRecording(false);
    Mp3Recorder.stop()
      .getMp3()
      .then(([buffer, blob]) => {
        const file = new File([blob], "file.mp3", {
          type: blob.type,
        });
        if (file) recognizeSong(file);
        const track = Mp3Recorder.activeStream.getTracks()[0]
        track.stop();
        Mp3Recorder.activeStream.removeTrack(track);
      })
      .catch((e) => console.log(e));
  };

  return (
    <div className="App">
      <button
        type="button"
        onClick={isRecording ? stopRecording : startRecording}
      >
        Gravar
      </button>
      {isRecording && "Gravando..."}
      <span>{count}</span>
      <div className="identified-song">
        <img src={identifiedSong.artwork} alt="Capa do álbum" />
        <h2>{identifiedSong.title}</h2>
        <h3>{identifiedSong.album}</h3>
        <h3>{identifiedSong.artist}</h3>
      </div>
    </div>
  );
}

export default App;
