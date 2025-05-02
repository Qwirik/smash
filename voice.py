import torch
import sounddevice as sd
import numpy as np

TEXT = "Это тестовое сообщение для нейросетевого голоса" 
SPEAKER = "eugene"
SAMPLE_RATE = 48000
PAUSE_DURATION = 0.1
VOL = 0.5
def load_model():
    """Загрузка модели без привязки к устройству"""
    model, _ = torch.hub.load(
        repo_or_dir='snakers4/silero-models',
        model='silero_tts',
        language='ru',
        speaker='v3_1_ru'
    )
    return model

def split_text(text, max_length=900):
    """Улучшенное разделение текста"""
    sentences = []
    current = ""
    
    delimiters = ['.', '!', '?', ';', ',']
    
    for char in text:
        current += char
        if (char in delimiters and len(current) > max_length * 0.7) or len(current) >= max_length:
            sentences.append(current.strip())
            current = ""
    
    if current:
        sentences.append(current.strip())
    
    return [s for s in sentences if s]

def apply_fade(audio, sample_rate, fade_duration=0.05):
    """Добавляет плавное затухание в начале и конце"""
    fade_samples = int(sample_rate * fade_duration)
    if len(audio) < fade_samples * 2:
        return audio
    
    fade_in = np.linspace(0, 1, fade_samples)
    fade_out = np.linspace(1, 0, fade_samples)
    
    audio[:fade_samples] *= fade_in
    audio[-fade_samples:] *= fade_out
    return audio

def text_to_speech(model, text, speaker, sample_rate, vol):
    try:
        chunks = split_text(text)
        if not chunks:
            return
            
        full_audio = np.array([], dtype=np.float32)
        
        for i, chunk in enumerate(chunks):
            print(f"Обрабатываю часть {i+1}/{len(chunks)}: {chunk[:50]}...")
            
            # Генерация аудио
            audio = model.apply_tts(
                text=chunk,
                speaker=speaker,
                sample_rate=sample_rate
            ).numpy()
            
            audio = apply_fade(audio, sample_rate)
            
            if i > 0:
                pause = np.zeros(int(sample_rate * PAUSE_DURATION))
                full_audio = np.concatenate((full_audio, pause, audio))
            else:
                full_audio = audio
        
        # Нормализация громкости
        max_vol = np.max(np.abs(full_audio))
        if max_vol > 0:
            full_audio = full_audio * (vol / max_vol)
        
        # Воспроизведение
        print("Начинаю воспроизведение...")
        sd.play(full_audio, sample_rate)
        sd.wait()
        
    except Exception as e:
        print(f"Ошибка: {e}")

if __name__ == "__main__":
    print("Загружаю модель...")
    model = load_model()
    print("Модель загружена, начинаю обработку текста...")
    text_to_speech(model, TEXT, SPEAKER, SAMPLE_RATE, VOL)
