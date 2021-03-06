import React, { useContext, useEffect } from "react";
import AppContext from "../context/AppContext";
import microphoneIcon from "../images/microphone2.png";
import MicRecorder from "mic-recorder-to-mp3";
import identifySong from "../services/identifySongApi";
import iTunesSearchApi from "../services/iTunesSearchApi";
import '../styles/RecordButton.css';
import HistoryContext from "../context/HistoryContext";

const Mp3Recorder = new MicRecorder({ bitRate: 128 });

export default function RecordButton() {
  const {
    isRecording, 
    setIsRecording,
    setIdentifiedSong,
    setIdentified,
    setItunesUrl,
    setIdentifying,
    setStream,
    setCount,
    count,
    setStatus,
  } = useContext(AppContext);
  const { addSongToHistory } = useContext(HistoryContext);

  useEffect(() => {
    let timer;
    if (isRecording && count < 10) {
      timer = setInterval(() => {
        setCount(count + 1);
      }, 1000);
    }
    if (isRecording && count >= 10) stopRecording();
    return () => clearInterval(timer);
  }, [count]);

  const recognizeSong = async (file) => {
    setIdentifying(true);
    setStatus("Identificando...");
    const { data, identified: indentifiedBool } = await identifySong(file);
    setIdentified(indentifiedBool);

    if (indentifiedBool) {
      setStatus(undefined);
      setIdentifying(false);
      setIdentifiedSong(data);
      const { artwork, trackUrl: itunesUrl } = await iTunesSearchApi(data);
      if (!data.artwork) setIdentifiedSong({ ...data, artwork });
      setItunesUrl(itunesUrl);
      addSongToHistory({ 
        ...data,
        itunesUrl,
        artwork: artwork || data.artwork,
      });
    }

    if (!indentifiedBool) setStatus("Não foi possível identificar a música");
  };

  const startRecording = () => {
    const onSuccessFn = () => {
      Mp3Recorder.start()
        .then((stream) => {
          setIdentified(undefined)
          setStream(stream);
          setIsRecording(true);
          setStatus("Gravando...");
          setCount(1);
        })
        .catch(console.error);
    };

    if (navigator.mediaDevices === undefined) {
      navigator.mediaDevices = {};
    }

    if (navigator.mediaDevices.getUserMedia === undefined) {
      navigator.mediaDevices.getUserMedia = function(constraints) {
        let getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
  
        if (!getUserMedia) {
          return Promise.reject(new Error('getUserMedia is not implemented in this browser'));
        }
    
        return new Promise(function(resolve, reject) {
          getUserMedia.call(navigator, constraints, resolve, reject);
        });
      }
    }
  
    navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      .then(onSuccessFn)
      .catch(console.error);

  };

  const stopRecording = () => {
    setIsRecording(false);
    Mp3Recorder.stop()
      .getMp3()
      .then(([ , blob]) => {
        const file = new File([blob], "file.mp3", {
          type: blob.type,
        });
        if (file) recognizeSong(file);
        const track = Mp3Recorder.activeStream.getTracks()[0];
        track.stop();
        Mp3Recorder.activeStream.removeTrack(track);
      })
      .catch((e) => console.log(e));
  };

  return (
    <button
      type="button"
      onClick={isRecording ? stopRecording : startRecording}
      className={`record-button ${isRecording ? 'is-recording': ''}`}
    >
      <div className="card__content">
        <img src={microphoneIcon} alt="Identificar" />
      </div>
      <div className="blob"></div>
      <div className="blob"></div>
      <div className="blob"></div>
    </button>
  );
}
