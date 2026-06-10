import torch
import sounddevice as sd
import time


language = 'ru'
model_id = 'v4_ru'
sample_rate = 48000
speaker = 'aidar'
device = torch.device('cpu')


model, _ = torch.hub.load(repo_or_dir='snakers4/silero-models',
                          model='silero_tts',
                          language=language,
                          speaker=model_id,
                          trust_repo=True)
model.to(device)

def speak(text):
    print(f"Смеш говорит: {text}")
    audio = model.apply_tts(text=text,
                            speaker=speaker,
                            sample_rate=sample_rate)
    
   
    sd.play(audio.numpy(), sample_rate)
    sd.wait()

if __name__ == "__main__":
    speak("Я готов к работе.")