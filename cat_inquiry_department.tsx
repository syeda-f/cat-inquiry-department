import React, { useState, useEffect, useRef } from 'react';
import { 
  Compass, 
  Search, 
  MessageSquare, 
  BookOpen, 
  Award, 
  Volume2, 
  VolumeX, 
  CheckCircle, 
  User, 
  Lock,
  Info,
  MapPin,
  Send,
  Loader2,
  History,
  Archive,
  LogOut,
  FileText,
  Shield,
  Stamp,
  Trash2
} from 'lucide-react';

import { initializeApp } from 'firebase/app';
import type { FirebaseOptions } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signOut } from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import { getFirestore, doc, setDoc, updateDoc, onSnapshot, collection, deleteDoc } from 'firebase/firestore';

type Clue = {
  id: string;
  name: string;
  description: string;
  coords: { x: number; y: number };
  hint: string;
  icon: string;
};

type Suspect = {
  id: string;
  name: string;
  role: string;
  avatar: string;
  description: string;
  collar: string;
  dialogue: {
    intro: string;
    clues: Record<string, string>;
  };
};

type CaseData = {
  id: string;
  title: string;
  shortDesc: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  locationName: string;
  clues: Clue[];
  suspects: Suspect[];
  guiltySuspectId: string;
  solutionExplanation: string;
};

type Profile = {
  id: string;
  name: string;
  xp: number;
  solvedCases: string[];
  collectedClues: string[];
  createdAt: string;
};

type ChatMessage = {
  role: 'user' | 'suspect';
  content: string;
};

type DeductionResult = {
  success: boolean;
  text: string;
};

type TabId = 'cases' | 'investigate' | 'manual' | 'history';

type WebAudioWindow = Window & typeof globalThis & {
  webkitAudioContext?: typeof AudioContext;
};

const firebaseConfig: FirebaseOptions = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = import.meta.env.VITE_CID_APP_ID || 'cat-inquiry-department';

// ==========================================
// PROCEDURAL AUDIO SYNTHESIZER (Web Audio API)
// ==========================================
class CatSoundSynth {
  private ctx!: AudioContext;
  private jazzTimeout: ReturnType<typeof setTimeout> | null;
  private isPlayingJazz: boolean;
  private activeNodes: AudioBufferSourceNode[];
  private currentTrack: number;

  constructor() {
    this.jazzTimeout = null;
    this.isPlayingJazz = false;
    this.activeNodes = [];
    this.currentTrack = 1;
  }

  init() {
    if (!this.ctx) {
      const AudioContextConstructor = window.AudioContext || (window as WebAudioWindow).webkitAudioContext;
      if (!AudioContextConstructor) {
        throw new Error('Web Audio API is not supported in this browser.');
      }
      this.ctx = new AudioContextConstructor();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTick() {
    this.init();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.frequency.setValueAtTime(900, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.08);
  }

  playMeow() {
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'triangle';
    osc2.type = 'sawtooth';
    
    osc.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.frequency.setValueAtTime(290, now);
    osc.frequency.exponentialRampToValueAtTime(620, now + 0.12);
    osc.frequency.exponentialRampToValueAtTime(440, now + 0.35);
    
    osc2.frequency.setValueAtTime(295, now);
    osc2.frequency.exponentialRampToValueAtTime(625, now + 0.12);
    osc2.frequency.exponentialRampToValueAtTime(445, now + 0.35);
    
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.05, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    
    osc.start(now);
    osc2.start(now);
    osc.stop(now + 0.4);
    osc2.stop(now + 0.4);
  }

  playPurr() {
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.frequency.setValueAtTime(26, now);
    gain.gain.setValueAtTime(0.06, now);
    for (let i = 0; i < 8; i++) {
      gain.gain.setValueAtTime(0.10, now + i * 0.12);
      gain.gain.setValueAtTime(0.02, now + i * 0.12 + 0.06);
    }
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
    
    osc.start(now);
    osc.stop(now + 1.0);
  }

  playChime() {
    this.init();
    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((f, index) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.frequency.setValueAtTime(f, now + index * 0.07);
      gain.gain.setValueAtTime(0.04, now + index * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.07 + 0.35);
      
      osc.start(now + index * 0.07);
      osc.stop(now + index * 0.07 + 0.35);
    });
  }

  playSuccess() {
    this.init();
    const now = this.ctx.currentTime;
    const melody = [587.33, 659.25, 783.99, 880.00, 1046.50];
    melody.forEach((note, index) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.frequency.setValueAtTime(note, now + index * 0.08);
      gain.gain.setValueAtTime(0.04, now + index * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.08 + 0.4);
      osc.start(now + index * 0.08);
      osc.stop(now + index * 0.08 + 0.42);
    });
  }

  playError() {
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.setValueAtTime(90, now + 0.12);
    gain.gain.setValueAtTime(0.04, now);
    gain.gain.linearRampToValueAtTime(0.001, now + 0.25);
    
    osc.start(now);
    osc.stop(now + 0.25);
  }

  startMusic(trackId = 1) {
    this.init();
    this.stopMusic(); 
    this.isPlayingJazz = true;
    this.currentTrack = trackId;
    let step = 0;

    const bufferSize = this.ctx.sampleRate * 2; 
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    if (this.currentTrack === 4 || this.currentTrack === 5) {
      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const rainFilter = this.ctx.createBiquadFilter();
      rainFilter.type = 'lowpass';
      rainFilter.frequency.value = this.currentTrack === 4 ? 600 : 300; 

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.value = this.currentTrack === 4 ? 0.04 : 0.07;

      whiteNoise.connect(rainFilter);
      rainFilter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);
      whiteNoise.start();
      
      this.activeNodes.push(whiteNoise);
    }

    const playBeat = () => {
      if (!this.isPlayingJazz) return;
      const now = this.ctx.currentTime;

      if (this.currentTrack === 1) {
        // Track 1: Cozy Cafe
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bassOsc.type = 'triangle';
        bassOsc.connect(bassGain);
        bassGain.connect(this.ctx.destination);
        
        const jazzBassLine = [110, 130.8, 146.8, 164.8, 174.6, 196];
        const currentBass = jazzBassLine[step % jazzBassLine.length];
        bassOsc.frequency.setValueAtTime(currentBass, now);
        
        bassGain.gain.setValueAtTime(0.05, now);
        bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        
        bassOsc.start(now);
        bassOsc.stop(now + 0.6);

        if (step % 2 === 0) {
          const chordFreqs = step % 4 === 0 
            ? [261.63, 329.63, 392.00, 493.88] 
            : [293.66, 349.23, 440.00, 523.25];
          
          chordFreqs.forEach(freq => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            
            osc.frequency.setValueAtTime(freq, now);
            gain.gain.setValueAtTime(0.012, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
            
            osc.start(now);
            osc.stop(now + 1.2);
          });
        }
        this.jazzTimeout = setTimeout(playBeat, 750);

      } else if (this.currentTrack === 2) {
        // Track 2: Sunbeam
        const notes = [329.63, 392.00, 440.00, 523.25, 587.33, 659.25];
        const note = notes[step % notes.length];

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.frequency.setValueAtTime(note, now);
        gain.gain.setValueAtTime(0.03, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

        osc.start(now);
        osc.stop(now + 1.5);

        if (step % 6 === 0) {
           const padOsc = this.ctx.createOscillator();
           const padGain = this.ctx.createGain();
           padOsc.type = 'triangle';
           padOsc.connect(padGain);
           padGain.connect(this.ctx.destination);
           padOsc.frequency.setValueAtTime(164.81, now); 
           padGain.gain.setValueAtTime(0.02, now);
           padGain.gain.setTargetAtTime(0.03, now + 1.0, 0.5);
           padGain.gain.exponentialRampToValueAtTime(0.001, now + 4.0);
           padOsc.start(now);
           padOsc.stop(now + 4.0);
        }
        this.jazzTimeout = setTimeout(playBeat, 400);

      } else if (this.currentTrack === 3) {
        // Track 3: Night Purr
        if (step % 2 === 0) {
          const chordFreqs = step % 4 === 0
            ? [174.61, 261.63, 329.63, 440.00] 
            : [164.81, 246.94, 329.63, 392.00];

          const bassOsc = this.ctx.createOscillator();
          const bassGain = this.ctx.createGain();
          bassOsc.type = 'sine';
          bassOsc.connect(bassGain);
          bassGain.connect(this.ctx.destination);
          bassOsc.frequency.setValueAtTime(chordFreqs[0] / 2, now);
          bassGain.gain.setValueAtTime(0.06, now);
          bassGain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);
          bassOsc.start(now);
          bassOsc.stop(now + 2.0);

          chordFreqs.forEach((freq, idx) => {
            if (idx === 0) return;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.frequency.setValueAtTime(freq + (Math.random()*1.5 - 0.75), now);
            gain.gain.setValueAtTime(0.015, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);

            osc.start(now);
            osc.stop(now + 2.5);
          });
        }
        this.jazzTimeout = setTimeout(playBeat, 1000);
      } else if (this.currentTrack === 4) {
        // Track 4: Rain Drops 
        const dropFreq = 500 + Math.random() * 900;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.frequency.setValueAtTime(dropFreq, now);
        osc.frequency.exponentialRampToValueAtTime(dropFreq * 1.5, now + 0.05);
        gain.gain.setValueAtTime(0.02, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);

        this.jazzTimeout = setTimeout(playBeat, 100 + Math.random() * 400);
      } else if (this.currentTrack === 5) {
        // Track 5: Realistic Thunder
        if (Math.random() > 0.5) {
          const strikeNoise = this.ctx.createBufferSource();
          strikeNoise.buffer = noiseBuffer;
          
          const lowpass = this.ctx.createBiquadFilter();
          lowpass.type = 'lowpass';
          lowpass.frequency.setValueAtTime(120, now);
          lowpass.frequency.linearRampToValueAtTime(40, now + 4);

          const bandpass = this.ctx.createBiquadFilter();
          bandpass.type = 'bandpass';
          bandpass.frequency.setValueAtTime(500, now);
          bandpass.frequency.exponentialRampToValueAtTime(80, now + 1);

          const sGain = this.ctx.createGain();
          sGain.gain.setValueAtTime(0, now);
          sGain.gain.linearRampToValueAtTime(0.15, now + 0.05); 
          sGain.gain.exponentialRampToValueAtTime(0.05, now + 0.2); 
          sGain.gain.linearRampToValueAtTime(0.08, now + 0.5); 
          sGain.gain.exponentialRampToValueAtTime(0.001, now + 4); 

          strikeNoise.connect(lowpass);
          strikeNoise.connect(bandpass);
          lowpass.connect(sGain);
          bandpass.connect(sGain);
          sGain.connect(this.ctx.destination);
          
          strikeNoise.start(now);
          strikeNoise.stop(now + 4);
        }
        this.jazzTimeout = setTimeout(playBeat, 4000 + Math.random() * 6000);
      }
      step++;
    };
    playBeat();
  }

  stopMusic() {
    this.isPlayingJazz = false;
    if (this.jazzTimeout) clearTimeout(this.jazzTimeout);
    this.activeNodes.forEach(node => { try { node.stop(); } catch(e) {} });
    this.activeNodes = [];
  }
}

const audioSynth = new CatSoundSynth();

// ==========================================
// CASES AND STORIES DATA
// ==========================================
const CASES_DATA: CaseData[] = [
  {
    id: "case-1",
    title: "The Case of the Missing Tuna Cup",
    shortDesc: "The tasty Salmon-Tuna food is gone from the high kitchen counter. Only small, oily pawprints are left behind.",
    difficulty: "Easy",
    locationName: "Kitchen Countertop",
    clues: [
      { id: "clue_sleek_pawprints", name: "Small Muddy Pawprints", description: "These muddy tracks are very small and narrow. They belong to a small, light cat.", coords: { x: 32, y: 55 }, hint: "Near the counter leg", icon: "🐾" },
      { id: "clue_catnip_scent", name: "Catnip Mist Spray", description: "There is a strong smell of sweet catnip spray here. Someone probably used it to distract the other cats.", coords: { x: 75, y: 35 }, hint: "On the top kitchen shelf", icon: "🧴" },
      { id: "clue_red_feather", name: "Red Toy Feather", description: "A bright red feather piece from a fancy toy. It got caught on the floor.", coords: { x: 50, y: 78 }, hint: "On the floor vent", icon: "🪶" }
    ],
    suspects: [
      {
        id: "sus_barnaby", name: "Barnaby", role: "Big Orange Tabby", avatar: "🐱", description: "A huge, lazy orange cat who loves eating and sleeping. He is too heavy to jump high.", collar: "Yellow collar with a metal fish tag",
        dialogue: {
          intro: "Hi detective! I am way too big and heavy to jump all the way up onto that high counter. I was busy looking for treats inside the bottom cupboard.",
          clues: {
            clue_sleek_pawprints: "Those footprints are tiny! My paws are as big as tennis balls. Those small prints belong to a light, elegant cat.",
            clue_catnip_scent: "Oh, I smelled that catnip spray earlier! It made me feel very dizzy and sleepy, so I had to take a nap on the sofa.",
            clue_red_feather: "I do not play with fancy red feathers. I only play with old dirty socks and cardboard boxes!"
          }
        }
      },
      {
        id: "sus_cleo", name: "Princess Cleo", role: "Fancy White Persian", avatar: "🐩", description: "A clean, elegant white cat who wears fancy accessories. She is very proud and hates dirt.", collar: "Pink collar with a red feather toy attached",
        dialogue: {
          intro: "Hello. I am a clean show cat. I only eat expensive fresh fish. Why would I steal a cheap can of tuna?",
          clues: {
            clue_sleek_pawprints: "Mud on my beautiful paws? Never! I hate dirt. But... those footprints are quite small and cute, just like mine.",
            clue_catnip_scent: "Catnip spray is for silly street cats. I only wear high-quality lavender perfume.",
            clue_red_feather: "Oh! That looks like a piece from... well, many toys have red feathers. It does not mean anything!"
          }
        }
      }
    ],
    guiltySuspectId: "sus_cleo",
    solutionExplanation: "Princess Cleo took the tuna! The small muddy tracks matched her exact paw size. The red feather fell off her own collar toy during the jump. She also sprayed catnip on the floor to make Barnaby dizzy so everyone would suspect him instead!"
  },
  {
    id: "case-2",
    title: "The Missing Crinkle Ball",
    shortDesc: "The shiny crinkle toy ball has disappeared from its velvet pillow. The thief left deep claw scratch marks on the wood.",
    difficulty: "Medium",
    locationName: "The Master Bedroom",
    clues: [
      { id: "clue_black_fur", name: "Black Fur", description: "A small piece of dark black cat hair. It was stuck to the corner of the pillow.", coords: { x: 22, y: 40 }, hint: "On the pillow corner", icon: "🐈‍⬛" },
      { id: "clue_deep_scratch", name: "Deep Scratch Marks", description: "Sharp, heavy claw scratches cut deep into the wooden leg of the bed stool.", coords: { x: 60, y: 70 }, hint: "At the bottom of the stool leg", icon: "🪵" },
      { id: "clue_candy_wrapper", name: "Crinkly Foil Paper", description: "A piece of shiny silver wrapper. It makes the exact same crinkle sound as the missing toy.", coords: { x: 80, y: 25 }, hint: "Inside the nightstand drawer", icon: "🍬" }
    ],
    suspects: [
      {
        id: "sus_spike", name: "Spike", role: "Tough Black Street Cat", avatar: "😾", description: "A strong black cat with a clipped ear. He rules the backyard and claims he is too cool for toys.", collar: "Tough leather collar with studs",
        dialogue: {
          intro: "What do you want, detective? I don't play with baby toys. I hunt mice and guard my trash cans outside.",
          clues: {
            clue_black_fur: "A lot of cats around here have black fur. But yes, my hair falls out when I get annoyed. And you are annoying me right now!",
            clue_deep_scratch: "I scratch wood to keep my claws strong and sharp. Do you want me to scratch your trench coat too?",
            clue_candy_wrapper: "I don't eat sweet candies. That sweet wrapper is probably from that orange kitten, Mittens."
          }
        }
      },
      {
        id: "sus_mittens", name: "Mittens", role: "Playful Little Kitten", avatar: "😸", description: "A tiny orange kitten who has way too much energy and loves chasing everything.", collar: "Bright collar with a ringing bell",
        dialogue: {
          intro: "Hi detective! I was busy chasing my own tail for hours, and then I fell asleep on the warm rug near the window!",
          clues: {
            clue_black_fur: "Ooh, that fur is super dark! My fur is bright orange, so it definitely belongs to a black cat like Spike!",
            clue_deep_scratch: "I only scratch my little cardboard scratching pad. Spike has giant claws and scratches the real wooden furniture all the time!",
            clue_candy_wrapper: "I love shiny paper! But Spike told me to stay away from his secret pile of shiny treasures under the stairs."
          }
        }
      }
    ],
    guiltySuspectId: "sus_spike",
    solutionExplanation: "Spike stole the crinkle ball! Even though he acts tough, he secretly loves playing with shiny toys. His black fur was left on the pillow, his huge claws left the deep scratch marks, and Mittens saw him hiding shiny objects under the stairs."
  },
  {
    id: "case-3",
    title: "The Vanishing Shipping Box",
    shortDesc: "A giant empty cardboard shipping box has vanished from the front hallway. It was the perfect size to sit in.",
    difficulty: "Hard",
    locationName: "The Front Hallway",
    clues: [
      { id: "clue_shampoo_scent", name: "Lavender Perfume Scent", description: "A strong, clean smell of luxury lavender cat shampoo on the carpet.", coords: { x: 45, y: 65 }, hint: "On the entry rug", icon: "🌸" },
      { id: "clue_box_fiber", name: "Chewed Cardboard Bits", description: "Small bits of cardboard and little teeth marks left behind on the floor.", coords: { x: 20, y: 30 }, hint: "On the wooden floor", icon: "📦" },
      { id: "clue_royal_ribbon", name: "Golden Silk Ribbon", description: "A fancy golden ribbon. It looks like it was ripped off a luxury collar accessory.", coords: { x: 85, y: 80 }, hint: "Behind the umbrella stand", icon: "🎗️" }
    ],
    suspects: [
      {
        id: "sus_prof_paws", name: "Professor Paws", role: "Siamese Scholar", avatar: "😼", description: "An intelligent Siamese cat who wears little spectacles. He spends his day studying books.", collar: "Brown tweed collar",
        dialogue: {
          intro: "Greetings, detective. I was busy calculating math problems all morning. I do not care about cardboard boxes.",
          clues: {
            clue_shampoo_scent: "Lavender? That is far too strong. I prefer the clean smell of paper and old books.",
            clue_box_fiber: "Cats love sitting in boxes because they are warm and cozy. But I did not touch this one.",
            clue_royal_ribbon: "That gold ribbon belongs to Bella. She loves wearing shiny, expensive things to show off."
          }
        }
      },
      {
        id: "sus_bella", name: "Bella", role: "Pampered Calico", avatar: "😽", description: "A rich calico cat who only sleeps on soft pillows and hates getting her fur dirty.", collar: "Gold silk collar with shiny beads",
        dialogue: {
          intro: "Oh, hello darling! You are asking about that ugly brown box? I would never put my beautiful clean body inside dirty cardboard!",
          clues: {
            clue_shampoo_scent: "Ah, that is my special lavender shampoo! My owner washes me with it every weekend. It smells lovely, doesn't it?",
            clue_box_fiber: "Cardboard dust? Oh, perhaps it blew in from the open window. I have no idea.",
            clue_royal_ribbon: "My gold ribbon! I mean... that is just a common ribbon. Anyone could have dropped it!"
          }
        }
      }
    ],
    guiltySuspectId: "sus_bella",
    solutionExplanation: "Bella is the culprit! Even though she acts rich and says she hates dirty boxes, she secretly loves sitting in cardboard boxes more than anything. Her lavender shampoo scent, her lost golden ribbon, and the chewed cardboard pieces proved she dragged the box to her closet to sleep inside!"
  }
];

// Aesthetic Constants (Neo-Brutal / Scrapbook Style)
const cardStyle = "bg-[#FDFDF9] border-[3px] border-[#2C2422] shadow-[6px_6px_0px_#2C2422] rounded-sm relative";
const folderStyle = "bg-[#F4E9D8] border-[3px] border-[#2C2422] shadow-[8px_8px_0px_#2C2422] rounded-b-md rounded-tr-3xl relative";
const stickyStyle = "bg-[#FEFA94] border-[2px] border-[#2C2422] shadow-[4px_4px_0px_#2C2422] rotate-1 hover:rotate-0 transition-transform relative";
const btnStyle = "bg-[#A2D2FF] text-[#2C2422] border-[3px] border-[#2C2422] shadow-[4px_4px_0px_#2C2422] font-bold uppercase tracking-wider hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#2C2422] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all rounded-sm flex items-center justify-center gap-2";
const inputStyle = "bg-[#FDFDF9] border-[3px] border-[#2C2422] focus:outline-none focus:shadow-[inset_4px_4px_0px_#E8E1D5] transition-all rounded-sm font-mono";

// Animated Crime Scene Background Component
const CrimeSceneBackground = ({ caseId }: { caseId: string }) => {
  if (caseId === 'case-1') {
    return (
      <div className="absolute inset-0 pointer-events-none flex flex-col z-0 opacity-80 mix-blend-multiply">
        <div className="h-2/3 w-full border-b-[3px] border-[#2C2422] relative overflow-hidden bg-[#DCEAF5]" style={{ backgroundImage: 'radial-gradient(#2C2422 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
          <div className="absolute bottom-[30%] left-[30%]">
             <div className="w-16 h-12 bg-[#8CABC4] border-[3px] border-[#2C2422] relative shadow-[4px_4px_0px_#2C2422]">
               <div className="absolute -right-4 top-2 w-4 h-8 border-[3px] border-[#2C2422] rounded-full" />
             </div>
             <div className="absolute -top-12 left-4 w-3 h-10 bg-white/80 rounded-full animate-[floatUp_2s_ease-in_infinite]" />
             <div className="absolute -top-16 left-8 w-3 h-12 bg-white/80 rounded-full animate-[floatUp_2.5s_ease-in_infinite_0.5s]" />
          </div>
        </div>
        <div className="h-1/3 w-full bg-[#E5D5C5]" style={{ backgroundImage: 'linear-gradient(45deg, #D3BFA1 25%, transparent 25%, transparent 75%, #D3BFA1 75%, #D3BFA1), linear-gradient(45deg, #D3BFA1 25%, transparent 25%, transparent 75%, #D3BFA1 75%, #D3BFA1)', backgroundSize: '40px 40px', backgroundPosition: '0 0, 20px 20px', opacity: 0.7 }} />
      </div>
    );
  }
  if (caseId === 'case-2') {
    return (
      <div className="absolute inset-0 pointer-events-none bg-[#3A4A5A] z-0 opacity-90">
        <div className="absolute top-12 left-12 w-32 h-48 bg-[#4B5E73] rounded-t-full border-[3px] border-[#2C2422] overflow-hidden flex flex-col shadow-[inset_0_10px_20px_rgba(0,0,0,0.3)]">
          <div className="w-full h-1/2 border-b-[3px] border-[#2C2422]" />
          <div className="absolute left-1/2 w-[3px] h-full bg-[#2C2422] -translate-x-1/2" />
          <div className="absolute top-6 right-6 w-10 h-10 bg-[#FFD6A5] rounded-full shadow-[0_0_20px_#FFD6A5] animate-[pulse_3s_infinite] border-2 border-[#2C2422]" />
        </div>
        <div className="absolute bottom-0 right-10 w-80 h-36 bg-[#4B5E73] border-t-[3px] border-l-[3px] border-[#2C2422] shadow-[inset_0_10px_20px_rgba(0,0,0,0.2)] flex items-end">
           <div className="w-full h-20 bg-[#F4E9D8] border-t-[3px] border-[#2C2422]" />
        </div>
        <div className="absolute bottom-40 right-40 text-[#FFD6A5] font-bold text-3xl animate-[floatUp_3s_ease-in_infinite]" style={{ WebkitTextStroke: '1px #2C2422' }}>Z</div>
        <div className="absolute bottom-48 right-32 text-[#FFD6A5] font-bold text-xl animate-[floatUp_3s_ease-in_infinite_1s]" style={{ WebkitTextStroke: '1px #2C2422' }}>z</div>
      </div>
    );
  }
  if (caseId === 'case-3') {
    return (
      <div className="absolute inset-0 pointer-events-none z-0 bg-[#E8E4D9]">
        <div className="absolute top-0 left-1/2 w-[3px] h-32 bg-[#2C2422] origin-top animate-[swing_4s_ease-in-out_infinite_alternate] -translate-x-1/2 z-0">
           <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-10 bg-[#FFD6A5] rounded-b-full shadow-[0_10px_0px_rgba(0,0,0,0.1)] border-[3px] border-[#2C2422]" />
        </div>
        <div className="absolute bottom-0 w-full h-2/5 flex flex-col justify-evenly border-t-[3px] border-[#2C2422] bg-[#D3BFA1]">
           <div className="w-full h-[2px] bg-[#2C2422]/30" />
           <div className="w-full h-[2px] bg-[#2C2422]/30" />
           <div className="w-full h-[2px] bg-[#2C2422]/30" />
        </div>
        <div className="absolute bottom-[40%] right-20 w-36 h-72 border-[3px] border-[#2C2422] bg-[#FDFDF9] shadow-[6px_6px_0px_rgba(44,36,34,0.3)]" />
      </div>
    );
  }
  return <div className="absolute inset-0 bg-[#F4E9D8]" />;
};

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('cases'); 
  const [selectedCase, setSelectedCase] = useState(CASES_DATA[0]);
  const [activeSuspect, setActiveSuspect] = useState(CASES_DATA[0].suspects[0]);
  
  const [deductionSuspectId, setDeductionSuspectId] = useState('');
  const [caseSolved, setCaseSolved] = useState(false);
  
  // Firebase Auth & Profile State
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [profilesList, setProfilesList] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loginName, setLoginName] = useState("");

  const performAuth = async () => {
    setIsLoading(true);
    try {
      await signInAnonymously(auth);
    } catch (error) {
      console.error("Auth error:", error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    performAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setProfile(null);
        setActiveProfileId(null);
        setProfilesList([]);
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const profilesRef = collection(db, 'artifacts', appId, 'users', user.uid, 'profiles');
    const unsubscribe = onSnapshot(profilesRef, (snapshot) => {
      const loadedProfiles: Profile[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data() as Omit<Profile, 'id'>;
        loadedProfiles.push({ id: docSnap.id, ...data });
      });
      
      // Sort profiles by creation time (oldest first)
      loadedProfiles.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      setProfilesList(loadedProfiles);
      
      if (activeProfileId) {
        const current = loadedProfiles.find(p => p.id === activeProfileId);
        if (current) {
          setProfile(current);
          setCaseSolved(current.solvedCases?.includes(selectedCase.id) || false);
        } else {
          setActiveProfileId(null);
          setProfile(null);
        }
      }
      setIsLoading(false);
    }, (error) => {
      console.error("Firestore error:", error);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [user, activeProfileId, selectedCase.id]);

  const handleCreateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!loginName.trim() || !user) return;
    audioSynth.playSuccess();
    
    // Create a unique profile document in a list instead of a single static document
    const profilesRef = collection(db, 'artifacts', appId, 'users', user.uid, 'profiles');
    const newDocRef = doc(profilesRef);
    await setDoc(newDocRef, {
      name: loginName.trim(),
      xp: 0,
      solvedCases: [],
      collectedClues: [],
      createdAt: new Date().toISOString()
    });
    
    setActiveProfileId(newDocRef.id);
    setLoginName("");
  };

  const handleDeleteProfile = async (e: React.MouseEvent<HTMLButtonElement>, profileId: string) => {
    e.stopPropagation();
    if (!user) return;
    audioSynth.playError();
    
    try {
      const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profiles', profileId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("Error deleting profile:", error);
    }
  };

  const handleLogout = () => {
    audioSynth.playTick();
    // Instead of disconnecting the session, just unselect the active profile
    setActiveProfileId(null);
  };

  const collectedClues = profile?.collectedClues || [];
  const solvedCases = profile?.solvedCases || [];
  const detectiveXP = profile?.xp || 0;

  const getRank = (xp: number) => {
    if (xp >= 600) return "Legendary Cat-ective";
    if (xp >= 300) return "Master Investigator";
    if (xp >= 150) return "Senior Inspector";
    if (xp >= 50) return "Junior Detective";
    return "Apprentice Sleuth";
  };
  const detectiveRank = getRank(detectiveXP);

  const [showDeductionModal, setShowDeductionModal] = useState(false);
  const [deductionResult, setDeductionResult] = useState<DeductionResult | null>(null); 
  const [soundMuted, setSoundMuted] = useState(true);
  const [currentTrack, setCurrentTrack] = useState(1);

  const [playerAvatar, setPlayerAvatar] = useState('🕵️');
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);

  const [chatLogs, setChatLogs] = useState<Record<string, ChatMessage[]>>({}); 
  const [isTyping, setIsTyping] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Sensory Beam (Magnifying Glass) Mechanics
  const [magnifyingCoords, setMagnifyingCoords] = useState({ x: 0, y: 0 });
  const [isLensActive, setIsLensActive] = useState(false);
  const sceneContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatLogs, activeSuspect, isTyping]);

  const handleMouseMoveScene = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!sceneContainerRef.current || !isLensActive) return;
    const rect = sceneContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMagnifyingCoords({ x, y });
  };

  const toggleMute = () => {
    const nextState = !soundMuted;
    setSoundMuted(nextState);
    if (!nextState) {
      audioSynth.startMusic(currentTrack);
      audioSynth.playMeow();
    } else {
      audioSynth.stopMusic();
    }
  };

  const handleTrackChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const trackId = Number(e.target.value);
    setCurrentTrack(trackId);
    if (!soundMuted) {
      audioSynth.startMusic(trackId);
    }
  };

  const handleSelectCase = (caseObj: CaseData) => {
    setSelectedCase(caseObj);
    setActiveSuspect(caseObj.suspects[0]);
    setDeductionSuspectId('');
    setCaseSolved(solvedCases.includes(caseObj.id));
    setDeductionResult(null);
    setIsLensActive(false); 
    audioSynth.playTick();
  };

  const handleDiscoverClue = async (clue: Clue) => {
    if (collectedClues.includes(clue.id) || !user || !activeProfileId) return;
    audioSynth.playChime();
    const nextClues = [...collectedClues, clue.id];
    const nextXp = detectiveXP + 50;
    const userDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profiles', activeProfileId);
    await updateDoc(userDocRef, {
      collectedClues: nextClues,
      xp: nextXp
    });
  };

  // ==========================================
  // OPTIONAL SERVER-BACKED INTERROGATION SYSTEM
  // ==========================================
  const fetchAIResponse = async (userMessage: string, suspectObj: Suspect, caseObj: CaseData) => {
    const isGuilty = caseObj.guiltySuspectId === suspectObj.id;
    const cluesContext = caseObj.clues.map(c => `- ${c.name}: ${c.description}`).join('\n');
    const systemPrompt = `You are playing the role of a cat named ${suspectObj.name}.
Your personality: ${suspectObj.description}. You wear a ${suspectObj.collar}.
The crime: ${caseObj.shortDesc}.
Are you the guilty culprit? ${isGuilty ? 'YES. Try to act innocent but sound a bit nervous or defensive if pressed.' : 'NO. You are completely innocent and slightly offended they are asking.'}
You know about these clues:
${cluesContext}
Rules:
1. Act like a cat. Meow occasionally, mention your tail, grooming, or cat habits.
2. Keep your answer under 3 sentences. Be very concise and funny.
3. NEVER admit guilt directly. If they accuse you, deflect.
4. You are talking to a detective from C.I.D. (Cat Inquiry Department).`;

    const endpoint = import.meta.env.VITE_AI_CHAT_ENDPOINT;
    if (!endpoint) {
      return null;
    }

    const payload = {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ]
    };

    const delays = [1000, 2000, 4000, 8000];
    for (let i = 0; i < 4; i++) {
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        return data.text || data.message || data.choices?.[0]?.message?.content || "*silence*";
      } catch (e) {
        if (i === 3) throw e;
        await new Promise(r => setTimeout(r, delays[i]));
      }
    }
  };

  const handleSendMessage = async (textOverride: string | null = null, clueId: string | null = null) => {
    const textToSend = textOverride || chatInput;
    if (!textToSend.trim()) return;

    const chatKey = `${selectedCase.id}_${activeSuspect.id}`;
    const newMsg: ChatMessage = { role: 'user', content: textToSend };
    
    setChatLogs(prev => {
      const existing = prev[chatKey] || [{ role: 'suspect', content: activeSuspect.dialogue.intro }];
      return { ...prev, [chatKey]: [...existing, newMsg] };
    });
    
    setChatInput("");
    setIsTyping(true);
    audioSynth.playTick();

    try {
      const responseText = await fetchAIResponse(textToSend, activeSuspect, selectedCase);
      const fallbackText = clueId && activeSuspect.dialogue.clues[clueId]
        ? activeSuspect.dialogue.clues[clueId]
        : activeSuspect.dialogue.intro;
      setChatLogs(prev => ({
        ...prev,
        [chatKey]: [...(prev[chatKey] || []), { role: 'suspect', content: responseText || fallbackText }]
      }));
      audioSynth.playMeow();
    } catch (e) {
      console.error(e);
      let fallbackText = "Hiss... I don't feel like talking right now.";
      if (clueId && activeSuspect.dialogue.clues[clueId]) {
        fallbackText = activeSuspect.dialogue.clues[clueId];
      }
      setChatLogs(prev => ({
        ...prev,
        [chatKey]: [...(prev[chatKey] || []), { role: 'suspect', content: fallbackText }]
      }));
      audioSynth.playError();
    } finally {
      setIsTyping(false);
    }
  };

  const handleAccuseSuspect = async () => {
    if (!deductionSuspectId || !user || !activeProfileId) return;
    audioSynth.playTick();
    
    if (deductionSuspectId === selectedCase.guiltySuspectId) {
      audioSynth.playSuccess();
      setCaseSolved(true);
      
      if (!solvedCases.includes(selectedCase.id)) {
        const newSolved = [...solvedCases, selectedCase.id];
        const newXp = detectiveXP + 150;
        const userDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profiles', activeProfileId);
        await updateDoc(userDocRef, {
          solvedCases: newSolved,
          xp: newXp
        });
      }
      
      setDeductionResult({
        success: true,
        text: `Great job, detective! You solved it! ${selectedCase.solutionExplanation}`
      });
    } else {
      audioSynth.playError();
      setDeductionResult({
        success: false,
        text: `Oh no! That is not correct. ${activeSuspect.name} has a good alibi, or the clues do not match their story. Look closely at the clues and ask them more questions!`
      });
    }
    setShowDeductionModal(true);
  };

  const activeChatLogs = chatLogs[`${selectedCase.id}_${activeSuspect.id}`] || [{ role: 'suspect', content: activeSuspect.dialogue.intro }];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F4EAD5] flex flex-col items-center justify-center text-[#2C2422]">
         <Loader2 className="w-12 h-12 text-[#2C2422] animate-spin mb-4" />
         <p className="font-bold text-xl font-mono uppercase tracking-widest">Opening Case Files...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#E8E4D9] flex flex-col items-center justify-center p-6 text-[#2C2422] font-sans" style={{ backgroundImage: 'radial-gradient(#C4BBAF 2px, transparent 2px)', backgroundSize: '30px 30px' }}>
        <div className={`p-10 max-w-lg w-full text-center relative ${cardStyle}`}>
          {/* Tape decorations */}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-32 h-8 bg-white/40 rotate-2 border border-black/10 shadow-sm" />
          
          <div className="w-24 h-24 bg-[#2C2422] mx-auto flex items-center justify-center text-white font-bold text-5xl relative mb-6 rounded-sm shadow-[4px_4px_0px_#A2D2FF]">
            🔒
          </div>
          <h1 className="text-5xl font-black mb-4 tracking-tighter uppercase">Signed Out</h1>
          
          <p className="text-lg text-[#5C524E] mb-8 leading-relaxed font-serif italic">
            You have securely locked your case files and left the precinct.
          </p>

          <button onClick={performAuth} className={`w-full py-4 text-xl ${btnStyle} !bg-[#A2D2FF]`}>
            Return to Duty
          </button>
        </div>
      </div>
    );
  }

  if (!activeProfileId) {
    return (
      <div className="min-h-screen bg-[#E8E4D9] flex flex-col items-center justify-center p-6 text-[#2C2422] font-sans" style={{ backgroundImage: 'radial-gradient(#C4BBAF 2px, transparent 2px)', backgroundSize: '30px 30px' }}>
        <div className={`p-8 md:p-10 max-w-4xl w-full relative ${cardStyle}`}>
          {/* Tape decorations */}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-32 h-8 bg-white/40 rotate-2 border border-black/10 shadow-sm" />
          
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-[#2C2422] mx-auto flex items-center justify-center text-white font-bold text-4xl relative mb-4 rounded-sm shadow-[4px_4px_0px_#A2D2FF]">
              🐈‍⬛
            </div>
            <h1 className="text-5xl font-black mb-2 tracking-tighter uppercase">C.I.D. Roster</h1>
            <p className="text-xl font-bold bg-[#2C2422] text-white inline-block px-4 py-1 shadow-[4px_4px_0px_#FF9EBB] uppercase tracking-widest border border-[#2C2422]">
              Select Detective Badge
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            
            {/* Existing Profiles */}
            <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 scrollbar-thin">
              <h3 className="font-black uppercase text-sm tracking-widest border-b-[3px] border-[#2C2422] pb-2 text-[#5C524E]">Active Detectives</h3>
              {profilesList.length === 0 ? (
                <div className="p-6 border-[3px] border-dashed border-[#2C2422] text-center bg-[#F4EAD5]">
                   <p className="text-sm font-serif italic text-[#5C524E]">No detectives registered yet. Sign up a new recruit!</p>
                </div>
              ) : (
                profilesList.map(p => (
                  <div key={p.id} className="flex w-full gap-2">
                    <button
                      onClick={() => { setActiveProfileId(p.id); audioSynth.playTick(); }}
                      className={`flex-1 p-5 flex flex-col items-start ${btnStyle} !bg-white hover:!bg-[#FEFA94] !justify-start !text-left`}
                    >
                      <span className="font-black text-2xl mb-1 truncate w-full">{p.name}</span>
                      <span className="text-[10px] uppercase font-bold tracking-widest text-[#5C524E]">
                        {getRank(p.xp)} • {p.xp} XP • {p.solvedCases?.length || 0} Solved
                      </span>
                    </button>
                    <button
                      onClick={(e) => handleDeleteProfile(e, p.id)}
                      className={`w-14 shrink-0 flex flex-col items-center justify-center ${btnStyle} !bg-[#FF9EBB]`}
                      title="Retire Detective Badge"
                    >
                      <Trash2 className="w-6 h-6" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Create New Profile */}
            <div className="bg-[#A2D2FF] p-8 border-[3px] border-[#2C2422] shadow-[6px_6px_0px_#2C2422] flex flex-col justify-center relative">
              <div className="absolute -top-3 -right-3 text-3xl rotate-12">📌</div>
              <h3 className="font-black uppercase text-sm tracking-widest border-b-[3px] border-[#2C2422] pb-2 mb-6 text-[#2C2422]">Register New Rookie</h3>
              <form onSubmit={handleCreateProfile} className="space-y-6">
                <div className="space-y-2">
                   <label className="text-xs font-bold uppercase tracking-widest text-[#2C2422] ml-1">Applicant Name</label>
                   <input
                     type="text"
                     placeholder="Type name here..."
                     value={loginName}
                     onChange={(e) => setLoginName(e.target.value)}
                     className={`w-full px-5 py-4 text-base ${inputStyle}`}
                     required
                   />
                </div>
                <button type="submit" disabled={!loginName.trim()} className={`w-full py-4 text-base ${btnStyle} !bg-white ${!loginName.trim() ? 'opacity-50 grayscale' : ''}`}>
                  Stamp Approval
                </button>
              </form>
            </div>
            
          </div>

          <button onClick={async () => { audioSynth.playTick(); await signOut(auth); }} className="absolute bottom-6 right-6 text-[10px] font-bold uppercase tracking-widest hover:underline text-[#5C524E] flex items-center gap-1">
             <LogOut className="w-3 h-3" /> Lock Server completely
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative text-[#2C2422] flex flex-col font-sans selection:bg-[#2C2422] selection:text-white pb-20">
      
      {/* Neo-Brutal Paper Background */}
      <div className="fixed inset-0 pointer-events-none z-[-1] bg-[#E8E4D9]" style={{ backgroundImage: 'linear-gradient(#D3C9B8 1px, transparent 1px), linear-gradient(90deg, #D3C9B8 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      {/* HEADER / NAVIGATION BAR */}
      <header className="bg-[#F4EAD5] border-b-[4px] border-[#2C2422] sticky top-0 z-40 px-6 md:px-12 lg:px-16 py-6 shadow-[0_8px_0px_rgba(44,36,34,0.1)]">
        <div className="max-w-[90rem] mx-auto flex flex-col xl:flex-row items-center justify-between gap-6">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-[#2C2422] flex items-center justify-center text-white text-3xl shadow-[4px_4px_0px_#A2D2FF] border border-[#2C2422] rounded-sm relative group">
              🐈‍⬛
              <span className="absolute -bottom-2 -right-2 text-xl bg-white rounded-full shadow-sm">🛡️</span>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="font-black text-4xl tracking-tighter uppercase">C.I.D.</h1>
                <span className="bg-[#FF9EBB] text-[#2C2422] border-[2px] border-[#2C2422] text-[10px] px-2 py-1 font-black uppercase tracking-widest shadow-[2px_2px_0px_#2C2422]">
                  Confidential
                </span>
              </div>
              <p className="text-sm font-mono font-bold text-[#5C524E] uppercase tracking-wider">Cat Inquiry Department</p>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex flex-wrap items-center gap-4">
            
            <div className={`px-4 py-2 flex items-center gap-2 ${stickyStyle} !bg-[#E6F4EA]`}>
              <Lock className="w-4 h-4 text-emerald-700" />
              <span className="text-xs font-black uppercase tracking-widest text-emerald-800">Secure Network</span>
            </div>

            <div className="relative">
              <button 
                 onClick={() => setShowAvatarMenu(!showAvatarMenu)}
                 className={`w-12 h-12 text-2xl ${btnStyle} !bg-white`}
              >
                {playerAvatar}
              </button>
              {showAvatarMenu && (
                 <div className={`absolute top-14 right-0 p-2 flex gap-2 z-50 ${cardStyle}`}>
                   {['🕵️', '🍔', '🍞', '🐸'].map(av => (
                     <button 
                        key={av} 
                        onClick={() => { setPlayerAvatar(av); setShowAvatarMenu(false); audioSynth.playTick(); }} 
                        className={`w-10 h-10 text-xl border-[2px] border-transparent hover:border-[#2C2422] bg-[#F4EAD5] hover:bg-[#A2D2FF] transition-colors rounded-sm`}
                      >
                       {av}
                     </button>
                   ))}
                 </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <select
                value={currentTrack}
                onChange={handleTrackChange}
                disabled={soundMuted}
                className={`hidden sm:block appearance-none px-4 py-3 outline-none cursor-pointer pr-8 text-sm uppercase ${btnStyle} ${soundMuted ? '!bg-gray-300 opacity-50' : '!bg-[#FFD6A5]'}`}
              >
                <option value={1}>🎵 Cozy Café</option>
                <option value={2}>🎵 Sunbeam</option>
                <option value={3}>🎵 Night Purr</option>
                <option value={4}>🌧️ Rain Drops</option>
                <option value={5}>⛈️ Thunder</option>
              </select>
              <button onClick={toggleMute} className={`p-3 ${btnStyle} ${soundMuted ? '!bg-gray-300' : '!bg-[#FFD6A5]'}`}>
                {soundMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
            </div>

            <button onClick={handleLogout} className={`p-3 ${btnStyle} !bg-[#FF9EBB]`} title="Switch Detective Badge">
              <LogOut className="w-5 h-5" />
            </button>
            
          </div>
        </div>
      </header>

      {/* SUB-HEADER: Stats & Navigation */}
      <section className="bg-[#D3C9B8]/40 border-b-[3px] border-[#2C2422] py-4 px-6 md:px-12 lg:px-16 z-30 relative backdrop-blur-sm">
        <div className="max-w-[90rem] mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          
          <div className={`flex items-center gap-6 px-6 py-3 ${cardStyle} !bg-[#FEFA94]`}>
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-[#2C2422]" />
              <div>
                <p className="text-[10px] uppercase font-black tracking-widest text-[#5C524E]">Rank</p>
                <p className="text-sm font-black uppercase">{detectiveRank}</p>
              </div>
            </div>
            <div className="h-8 w-[3px] bg-[#2C2422]" />
            <div>
              <p className="text-[10px] uppercase font-black tracking-widest text-[#5C524E]">Points</p>
              <p className="text-sm font-black font-mono">{detectiveXP} XP</p>
            </div>
          </div>

          <nav className="flex flex-wrap items-center gap-3">
            {([
              { id: 'cases', label: 'Case Files', icon: BookOpen, color: '#A2D2FF' },
              { id: 'investigate', label: 'Crime Scene', icon: Search, color: '#FFD6A5' },
              { id: 'manual', label: 'Manual', icon: FileText, color: '#B5EAD7' },
              { id: 'history', label: 'Archive', icon: Archive, color: '#FF9EBB' }
            ] satisfies Array<{ id: TabId; label: string; icon: React.ComponentType<{ className?: string }>; color: string }>).map(tab => (
              <button 
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); audioSynth.playTick(); }}
                className={`px-5 py-3 text-sm flex items-center gap-2 ${btnStyle}`}
                style={{ backgroundColor: activeTab === tab.id ? tab.color : '#FDFDF9' }}
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </nav>

        </div>
      </section>

      {/* CASE SELECTOR (Only visible when cases or investigate is active) */}
      {(activeTab === 'cases' || activeTab === 'investigate') && (
        <section className="bg-[#2C2422] border-b-[3px] border-[#2C2422] py-4 px-6 md:px-12 lg:px-16">
          <div className="max-w-[90rem] mx-auto flex items-center gap-4 overflow-x-auto scrollbar-none">
              <span className="px-3 py-1 bg-[#FDFDF9] text-[#2C2422] font-black uppercase text-xs tracking-widest border-2 border-transparent">
                OPEN CASES
              </span>
              <div className="flex gap-4">
                {CASES_DATA.map((caseObj) => {
                  const isSolved = solvedCases.includes(caseObj.id);
                  const isSelected = selectedCase.id === caseObj.id;
                  return (
                    <button
                      key={caseObj.id}
                      onClick={() => handleSelectCase(caseObj)}
                      className={`px-4 py-2 text-xs flex items-center gap-2 shrink-0 ${btnStyle} ${isSelected ? '!bg-[#A2D2FF]' : '!bg-[#FDFDF9] !shadow-[2px_2px_0px_#2C2422] hover:!translate-x-0 hover:!translate-y-0'}`}
                    >
                      <span>{caseObj.title}</span>
                      {isSolved && <CheckCircle className="w-4 h-4 text-emerald-600" />}
                    </button>
                  );
                })}
              </div>
          </div>
        </section>
      )}

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 max-w-[90rem] w-full mx-auto p-6 md:p-10 lg:p-14">

        {/* TAB 1: STORY BOARD AND CASE BRIEF */}
        {activeTab === 'cases' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-fadeIn">
            
            {/* Case file card */}
            <div className={`lg:col-span-7 flex flex-col ${folderStyle}`}>
              <div className="absolute top-4 -right-4 w-16 h-8 bg-white/40 rotate-12 border border-black/10 shadow-sm" />
              
              <div className="p-10 border-b-[3px] border-[#2C2422] bg-[#FDFDF9] rounded-tr-2xl relative">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-[10px] font-black uppercase tracking-widest bg-[#2C2422] text-white px-3 py-1 shadow-[2px_2px_0px_#A2D2FF]">
                    FILE: {selectedCase.id}
                  </span>
                  <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 border-[2px] border-[#2C2422] shadow-[2px_2px_0px_#2C2422] ${
                    selectedCase.difficulty === 'Easy' ? 'bg-[#B5EAD7]' :
                    selectedCase.difficulty === 'Medium' ? 'bg-[#FFD6A5]' : 'bg-[#FF9EBB]'
                  }`}>
                    {selectedCase.difficulty}
                  </span>
                </div>
                <h3 className="text-4xl font-black uppercase tracking-tight text-[#2C2422] leading-none mb-4">{selectedCase.title}</h3>
              </div>

              <div className="p-10 flex-1 space-y-10">
                <div>
                  <h4 className="text-sm font-black uppercase text-[#2C2422] tracking-widest border-b-[3px] border-[#2C2422] pb-2 mb-4">Incident Report</h4>
                  <div className={`p-6 bg-white font-serif italic text-lg leading-relaxed ${stickyStyle} !rotate-0`}>
                    "{selectedCase.shortDesc}"
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-sm font-black uppercase text-[#2C2422] tracking-widest border-b-[3px] border-[#2C2422] pb-2 mb-4">Location</h4>
                    <div className="flex items-center gap-3 font-bold text-lg">
                      <MapPin className="w-6 h-6 text-[#FF9EBB]" />
                      {selectedCase.locationName}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-black uppercase text-[#2C2422] tracking-widest border-b-[3px] border-[#2C2422] pb-2 mb-4">Status</h4>
                    {caseSolved ? (
                      <div className="flex items-center gap-3 font-bold text-lg text-emerald-700">
                        <Stamp className="w-8 h-8 text-emerald-700 -rotate-12" /> CASE CLOSED
                      </div>
                    ) : (
                      <div className="font-bold text-lg text-[#FFD6A5] bg-[#2C2422] px-3 py-1 inline-block border-[2px] border-black">
                        INVESTIGATION ONGOING
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => { setActiveTab('investigate'); audioSynth.playTick(); }}
                  className={`w-full py-5 text-xl ${btnStyle} !bg-[#A2D2FF] mt-8`}
                >
                  <Search className="w-6 h-6" /> Enter Crime Scene
                </button>
              </div>
            </div>

            {/* Suspects & Accusation */}
            <div className="lg:col-span-5 flex flex-col gap-10">
              
              <div className={`p-8 ${cardStyle}`}>
                <h3 className="font-black text-2xl uppercase tracking-tighter border-b-[3px] border-[#2C2422] pb-4 mb-6 flex items-center justify-between">
                  <span>Suspects</span>
                  <span className="text-sm font-mono tracking-widest">({selectedCase.suspects.length})</span>
                </h3>

                <div className="space-y-6">
                  {selectedCase.suspects.map((suspect) => (
                    <div key={suspect.id} className={`p-4 border-[3px] border-[#2C2422] flex gap-4 ${activeSuspect.id === suspect.id ? 'bg-[#FFD6A5] shadow-[4px_4px_0px_#2C2422]' : 'bg-[#FDFDF9]'}`}>
                      <div className="w-16 h-16 bg-white border-[3px] border-[#2C2422] flex items-center justify-center text-3xl shrink-0 shadow-[2px_2px_0px_#2C2422]">
                        {suspect.avatar}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-black text-lg uppercase">{suspect.name}</h4>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#5C524E] mb-2">{suspect.role}</p>
                        <button
                          onClick={() => { setActiveSuspect(suspect); audioSynth.playPurr(); }}
                          className={`w-full py-2 text-xs ${btnStyle} ${activeSuspect.id === suspect.id ? '!bg-[#2C2422] text-white' : '!bg-white'}`}
                        >
                          Interrogate
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className={`p-8 ${cardStyle} !bg-[#FF9EBB]`}>
                <h3 className="font-black text-2xl uppercase tracking-tighter border-b-[3px] border-[#2C2422] pb-4 mb-6">
                  Arrest Warrant
                </h3>
                <p className="font-bold mb-4 text-[#2C2422]">Select the guilty party:</p>
                
                <div className="space-y-3 mb-6">
                  {selectedCase.suspects.map((suspect) => {
                    const isSelected = deductionSuspectId === suspect.id;
                    return (
                      <button
                        key={`deduct-${suspect.id}`}
                        onClick={() => { setDeductionSuspectId(suspect.id); audioSynth.playTick(); }}
                        className={`w-full p-4 flex items-center justify-between border-[3px] border-[#2C2422] font-black uppercase text-sm ${isSelected ? 'bg-[#2C2422] text-white shadow-[4px_4px_0px_#FDFDF9]' : 'bg-white text-[#2C2422] shadow-[4px_4px_0px_#2C2422]'}`}
                      >
                        <span className="flex items-center gap-3"><span className="text-xl">{suspect.avatar}</span> {suspect.name}</span>
                        {isSelected && <CheckCircle className="w-5 h-5 text-[#FFD6A5]" />}
                      </button>
                    );
                  })}
                </div>

                <button
                  disabled={!deductionSuspectId}
                  onClick={handleAccuseSuspect}
                  className={`w-full py-4 text-lg ${btnStyle} ${deductionSuspectId ? '!bg-[#FEFA94]' : 'opacity-50 grayscale'}`}
                >
                  <Award className="w-5 h-5" /> Accuse & Solve!
                </button>
              </div>

            </div>
          </div>
        )}

        {/* TAB 2: INTERACTIVE CRIME SCENE AND INTERROGATION */}
        {activeTab === 'investigate' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-fadeIn">
            
            {/* Interactive Crime Scene Frame */}
            <div className="lg:col-span-6 space-y-8">
              <div className={`p-8 ${cardStyle}`}>
                <div className="flex justify-between items-end border-b-[3px] border-[#2C2422] pb-4 mb-6">
                  <div>
                    <h3 className="font-black text-2xl uppercase tracking-tighter">Location Scanner</h3>
                    <p className="text-xs font-mono font-bold mt-1 uppercase tracking-widest">{selectedCase.locationName}</p>
                  </div>
                  <button 
                    onClick={() => { setIsLensActive(!isLensActive); audioSynth.playTick(); }}
                    className={`py-2 px-4 text-xs ${btnStyle} ${isLensActive ? '!bg-[#FF9EBB]' : '!bg-white'}`}
                  >
                    Lens: {isLensActive ? "ON" : "OFF"}
                  </button>
                </div>

                <div 
                  ref={sceneContainerRef}
                  onMouseMove={handleMouseMoveScene}
                  className="relative h-[450px] border-[4px] border-[#2C2422] overflow-hidden select-none shadow-[8px_8px_0px_#2C2422] bg-[#F4E9D8] mb-8 cursor-crosshair"
                >
                  <CrimeSceneBackground caseId={selectedCase.id} />
                  
                  {selectedCase.clues.map((clue) => {
                    const isDiscovered = collectedClues.includes(clue.id);
                    const dx = Math.abs(magnifyingCoords.x - clue.coords.x);
                    const dy = Math.abs(magnifyingCoords.y - clue.coords.y);
                    const isWithinLensRange = dx < 12 && dy < 12;
                    const showHotspot = isWithinLensRange && isLensActive;

                    return (
                      <div
                        key={clue.id}
                        className="absolute cursor-pointer z-20"
                        style={{ left: `${clue.coords.x}%`, top: `${clue.coords.y}%` }}
                        onClick={() => handleDiscoverClue(clue)}
                      >
                        <div className={`relative -translate-x-1/2 -translate-y-1/2 flex items-center justify-center transition-all ${
                          isDiscovered ? 'w-12 h-12 bg-white border-[3px] border-[#2C2422] shadow-[4px_4px_0px_#2C2422] rotate-6 text-2xl' : 
                          showHotspot ? 'w-16 h-16 bg-[#FFD6A5] border-[3px] border-dashed border-[#2C2422] text-3xl animate-spin' : 
                          'w-10 h-10 border-2 border-transparent text-transparent hover:border-[#2C2422]'
                        }`}>
                          <span className="select-none">{clue.icon}</span>
                        </div>
                      </div>
                    );
                  })}

                  {isLensActive && (
                    <div 
                      className="absolute rounded-full border-[4px] border-[#FF9EBB] pointer-events-none z-30 transition-transform duration-75"
                      style={{
                        width: '150px', height: '150px',
                        left: `${magnifyingCoords.x}%`, top: `${magnifyingCoords.y}%`,
                        transform: 'translate(-50%, -50%)',
                        boxShadow: '0 0 0 9999px rgba(44,36,34,0.7)'
                      }}
                    >
                      <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-[#FF9EBB] text-[#2C2422] px-3 py-1 text-[10px] font-black uppercase tracking-widest border-[2px] border-[#2C2422] shadow-[2px_2px_0px_#2C2422] whitespace-nowrap">
                        Beam Active
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-black uppercase tracking-widest border-b-[3px] border-[#2C2422] pb-2 mb-4">Evidence Log</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedCase.clues.map((clue) => {
                      const isDiscovered = collectedClues.includes(clue.id);
                      return (
                        <div key={`ev-${clue.id}`} className={`p-4 border-[3px] border-[#2C2422] flex flex-col gap-2 ${isDiscovered ? 'bg-[#B5EAD7] shadow-[4px_4px_0px_#2C2422]' : 'bg-[#E8E4D9]'}`}>
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{isDiscovered ? clue.icon : '❓'}</span>
                            <span className="font-black text-sm uppercase leading-tight">{isDiscovered ? clue.name : 'Unknown Clue'}</span>
                          </div>
                          <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#5C524E]">
                            {isDiscovered ? clue.hint : `Check ${clue.hint}`}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            </div>

            {/* Interrogation Room */}
            <div className="lg:col-span-6 flex flex-col">
              <div className={`p-8 flex-1 flex flex-col ${cardStyle}`}>
                <div className="flex justify-between items-center border-b-[3px] border-[#2C2422] pb-4 mb-6 shrink-0">
                  <h3 className="font-black text-2xl uppercase tracking-tighter flex items-center gap-3">
                    <MessageSquare className="w-6 h-6" /> Interrogation
                  </h3>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-sm uppercase">{activeSuspect.name}</span>
                    <span className="text-3xl bg-white border-[3px] border-[#2C2422] shadow-[2px_2px_0px_#2C2422] w-12 h-12 flex justify-center items-center">{activeSuspect.avatar}</span>
                  </div>
                </div>

                <div className="flex-1 bg-white border-[3px] border-[#2C2422] p-6 overflow-y-auto space-y-6 shadow-[inset_4px_4px_0px_#E8E4D9] mb-6 min-h-[400px] font-mono text-sm">
                  {activeChatLogs.map((msg, idx) => (
                    <div key={idx} className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#5C524E] mb-1 px-1">
                        {msg.role === 'user' ? 'Detective' : activeSuspect.name}
                      </span>
                      <div className={`p-4 border-[3px] border-[#2C2422] shadow-[4px_4px_0px_#2C2422] font-sans text-base leading-relaxed ${msg.role === 'user' ? 'bg-[#A2D2FF]' : 'bg-[#FEFA94]'}`}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="mr-auto items-start flex flex-col max-w-[85%]">
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#5C524E] mb-1 px-1">{activeSuspect.name}</span>
                      <div className="p-4 border-[3px] border-[#2C2422] shadow-[4px_4px_0px_#2C2422] bg-[#FEFA94] flex items-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" /> Thinking...
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                <div className="shrink-0 space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {selectedCase.clues.map((clue) => {
                      if (!collectedClues.includes(clue.id)) return null;
                      return (
                        <button
                          key={`ask-${clue.id}`}
                          disabled={isTyping}
                          onClick={() => handleSendMessage(`Tell me what you know about the ${clue.name}.`, clue.id)}
                          className={`py-2 px-3 text-xs ${btnStyle} !bg-white !text-sm`}
                        >
                          Ask: {clue.icon} {clue.name}
                        </button>
                      );
                    })}
                  </div>

                  <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex gap-3">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      disabled={isTyping}
                      placeholder="Type question here..."
                      className={`flex-1 px-5 py-4 text-base ${inputStyle}`}
                    />
                    <button type="submit" disabled={!chatInput.trim() || isTyping} className={`px-6 py-4 ${btnStyle} !bg-[#A2D2FF]`}>
                      <Send className="w-5 h-5" />
                    </button>
                  </form>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: THE DETECTIVE MANUAL */}
        {activeTab === 'manual' && (
          <div className="grid grid-cols-1 max-w-4xl mx-auto gap-10 animate-fadeIn">
            <div className={`p-12 ${folderStyle} !bg-[#FDFDF9] !border-[#2C2422]`}>
               
               <div className="text-center border-b-[4px] border-[#2C2422] pb-8 mb-10 relative">
                 <Stamp className="absolute -top-4 -left-4 w-24 h-24 text-[#FF9EBB] opacity-20 -rotate-12" />
                 <h2 className="text-5xl font-black uppercase tracking-tighter mb-4">C.I.D. Handbook</h2>
                 <p className="font-mono font-bold uppercase tracking-widest text-[#5C524E]">Classified Intelligence Document</p>
               </div>

               <div className="space-y-12 font-serif text-lg leading-relaxed text-[#2C2422]">
                 
                 <section className="relative">
                   <div className="absolute -left-6 top-2 w-12 h-4 bg-[#FEFA94]/60 -rotate-6 border border-black/10" />
                   <h3 className="font-sans font-black text-2xl uppercase tracking-tighter mb-4 flex items-center gap-3">
                     <span className="bg-[#2C2422] text-white w-8 h-8 flex items-center justify-center rounded-full text-sm shadow-[2px_2px_0px_#FFD6A5]">1</span> 
                     The Detective's Oath
                   </h3>
                   <p className="pl-11 bg-[#F4EAD5]/40 p-6 border-l-[4px] border-[#2C2422] italic">
                     "I solemnly swear to follow the trail of knocked-over water cups, to sniff out the hidden catnip, and to never, under any circumstances, pull a suspect's tail during interrogation."
                   </p>
                 </section>

                 <section>
                   <h3 className="font-sans font-black text-2xl uppercase tracking-tighter mb-4 flex items-center gap-3">
                     <span className="bg-[#2C2422] text-white w-8 h-8 flex items-center justify-center rounded-full text-sm shadow-[2px_2px_0px_#FFD6A5]">2</span> 
                     Decoding the Feline Form
                   </h3>
                   <div className="pl-11 grid grid-cols-1 md:grid-cols-2 gap-6 font-sans">
                     <div className={`p-5 ${stickyStyle} !rotate-1`}>
                       <h4 className="font-black uppercase mb-2">The Tail Swish</h4>
                       <p className="text-sm">A rapidly swishing tail indicates a suspect is agitated or lying. Proceed with caution and treats.</p>
                     </div>
                     <div className={`p-5 ${stickyStyle} !-rotate-2 !bg-[#B5EAD7]`}>
                       <h4 className="font-black uppercase mb-2">The Slow Blink</h4>
                       <p className="text-sm">A sign of trust. If a suspect gives you the slow blink, their alibi is likely solid.</p>
                     </div>
                     <div className={`p-5 ${stickyStyle} !rotate-2 !bg-[#A2D2FF]`}>
                       <h4 className="font-black uppercase mb-2">Airplane Ears</h4>
                       <p className="text-sm">Ears flattened to the side mean the suspect is defensive and ready to flee the interrogation room.</p>
                     </div>
                   </div>
                 </section>

                 <section>
                   <h3 className="font-sans font-black text-2xl uppercase tracking-tighter mb-4 flex items-center gap-3">
                     <span className="bg-[#2C2422] text-white w-8 h-8 flex items-center justify-center rounded-full text-sm shadow-[2px_2px_0px_#FFD6A5]">3</span> 
                     Investigation Protocols
                   </h3>
                   <ul className="pl-11 space-y-4 list-none">
                     <li className="flex items-start gap-3">
                       <CheckCircle className="w-6 h-6 shrink-0 mt-1 text-emerald-600" />
                       <span><strong>Always use the Sensory Beam:</strong> Clues are often hidden in plain sight. Activate your lens on the Crime Scene to uncover them.</span>
                     </li>
                     <li className="flex items-start gap-3">
                       <CheckCircle className="w-6 h-6 shrink-0 mt-1 text-emerald-600" />
                       <span><strong>Cross-reference Alibis:</strong> Cats will blame each other. If Mittens says Spike did it, ask Spike about Mittens.</span>
                     </li>
                     <li className="flex items-start gap-3">
                       <CheckCircle className="w-6 h-6 shrink-0 mt-1 text-emerald-600" />
                       <span><strong>Beware of the Red Dot:</strong> Do not get distracted during duty. The red laser dot is a known illusion meant to throw off detectives.</span>
                     </li>
                   </ul>
                 </section>

               </div>
            </div>
          </div>
        )}

        {/* TAB 4: ARCHIVE / HISTORY */}
        {activeTab === 'history' && (
          <div className="grid grid-cols-1 max-w-5xl mx-auto gap-10 animate-fadeIn">
            
            <div className={`p-10 ${cardStyle} !bg-[#2C2422] text-white flex flex-col md:flex-row items-center gap-8`}>
               <div className="w-32 h-32 bg-[#FFD6A5] rounded-full flex items-center justify-center text-6xl border-[4px] border-white shrink-0 shadow-[0_0_20px_rgba(255,214,165,0.5)]">
                 {playerAvatar}
               </div>
               <div className="text-center md:text-left flex-1">
                 <h2 className="text-4xl font-black uppercase tracking-tighter mb-2">{profile?.name}</h2>
                 <p className="text-2xl text-[#A2D2FF] font-black uppercase tracking-widest mb-6">{detectiveRank}</p>
                 <div className="flex flex-wrap justify-center md:justify-start items-center gap-4">
                   <div className="bg-[#FF9EBB] text-[#2C2422] px-4 py-2 font-black uppercase border-[3px] border-[#2C2422] shadow-[4px_4px_0px_#FDFDF9]">
                     {detectiveXP} XP
                   </div>
                   <div className="bg-[#B5EAD7] text-[#2C2422] px-4 py-2 font-black uppercase border-[3px] border-[#2C2422] shadow-[4px_4px_0px_#FDFDF9]">
                     {solvedCases.length} Closed
                   </div>
                 </div>
               </div>
            </div>

            <div className={`p-10 ${cardStyle}`}>
              <h3 className="font-black text-3xl uppercase tracking-tighter border-b-[4px] border-[#2C2422] pb-4 mb-8 flex items-center gap-4">
                <Archive className="w-8 h-8" /> Closed Cases
              </h3>
              
              {solvedCases.length === 0 ? (
                <div className="text-center p-12 bg-[#F4EAD5] border-[3px] border-dashed border-[#2C2422]">
                  <p className="text-xl font-bold mb-2">No cases solved yet.</p>
                  <p className="text-[#5C524E] font-mono uppercase tracking-widest text-sm">The precinct is quiet... too quiet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {solvedCases.map((caseId, i) => {
                    const c = CASES_DATA.find(x => x.id === caseId);
                    if (!c) return null;
                    return (
                      <div key={`${caseId}-${i}`} className="p-6 border-[3px] border-[#2C2422] flex items-center gap-5 bg-[#FDFDF9] shadow-[4px_4px_0px_#2C2422] relative overflow-hidden">
                         <div className="absolute -right-6 -bottom-6 opacity-10 rotate-12">
                           <Stamp className="w-32 h-32" />
                         </div>
                         <div className="w-16 h-16 bg-white rounded-sm flex items-center justify-center text-4xl border-[3px] border-[#2C2422] shrink-0 z-10 bg-[#FFD6A5]">
                           {c.suspects.find(s => s.id === c.guiltySuspectId)?.avatar || '🐈'}
                         </div>
                         <div className="z-10">
                           <h4 className="font-black text-lg uppercase leading-tight mb-1">{c.title}</h4>
                           <p className="text-[10px] bg-emerald-200 text-emerald-900 border border-emerald-900 px-2 py-0.5 inline-block font-black uppercase tracking-widest mb-2">
                             Guilty: {c.suspects.find(s => s.id === c.guiltySuspectId)?.name}
                           </p>
                           <p className="text-xs text-[#5C524E] font-serif italic line-clamp-2 leading-relaxed">{c.shortDesc}</p>
                         </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer className="bg-[#2C2422] text-[#FDFDF9] py-8 px-6 mt-auto border-t-[4px] border-[#2C2422]">
        <div className="max-w-[90rem] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs uppercase tracking-widest font-bold">
          <p>© 2026 C.I.D. Confidential.</p>
          <div className="flex gap-6">
            <span className="opacity-50">Powered by Next.js & Firebase</span>
          </div>
        </div>
      </footer>

      {/* ACCUSATION DEDUCTION MODAL RESULT */}
      {showDeductionModal && deductionResult && (
        <div className="fixed inset-0 bg-[#2C2422]/90 flex items-center justify-center z-50 p-6 animate-fadeIn">
          <div className={`p-12 max-w-xl w-full text-center space-y-8 relative ${cardStyle} ${deductionResult.success ? '!bg-[#B5EAD7]' : '!bg-[#FF9EBB]'}`}>
            
            <div className="text-7xl animate-bounce">
              {deductionResult.success ? "🏆" : "❌"}
            </div>

            <h3 className="text-4xl font-black uppercase tracking-tighter">
              {deductionResult.success ? "Case Closed!" : "Incorrect!"}
            </h3>

            <p className="text-lg font-serif italic bg-white/60 p-6 border-[3px] border-[#2C2422] shadow-[inset_4px_4px_0px_rgba(0,0,0,0.05)]">
              "{deductionResult.text}"
            </p>

            <button
              onClick={() => { setShowDeductionModal(false); audioSynth.playTick(); }}
              className={`w-full py-5 text-xl ${btnStyle} !bg-white`}
            >
              {deductionResult.success ? "Return to Precinct" : "Keep Investigating"}
            </button>

          </div>
        </div>
      )}

    </div>
  );
}
