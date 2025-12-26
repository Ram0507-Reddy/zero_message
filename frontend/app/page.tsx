'use client';

import React, { useState, useRef } from 'react';
import NoteModal from '../components/NoteModal';
import SecureViewer from '../components/SecureViewer';
import ReadLocalModal from '../components/ReadLocalModal';
import TrafficNoise from '../components/TrafficNoise';

export default function Home() {
  const [view, setView] = useState<'home' | 'send' | 'read' | 'local_read'>('home');
  const [isSecureDashboard, setIsSecureDashboard] = useState(false);
  const [selectedLocalNote, setSelectedLocalNote] = useState<any>(null);

  // --- GATE LOGIC ---
  const pressTimer = useRef<NodeJS.Timeout | null>(null);

  const handleLogoDown = () => {
    pressTimer.current = setTimeout(() => {
      setIsSecureDashboard(prev => !prev);
      // Visual indicator for debugging/demo (optional, keep subtle)
      console.log("DASHBOARD MODE SWITCHED");
    }, 3000); // 3 Seconds Hold
  };

  const handleLogoUp = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
  };

  // --- LOCAL DATA ---
  // --- LOCAL DATA ---
  const [notes, setNotes] = useState([
    {
      title: 'The beginning of screenless design',
      body: 'UI jobs to be taken over by Solution Architect. The era of screens is coming to an end, replaced by intuitive, voice-driven, and gesture-based interfaces that blend seamlessly into our environment.',
      date: 'May 21, 2020',
      color: 'bg-[#FCD34D]'
    },
    {
      title: '13 Things You Should Give Up',
      body: 'If You Want To Be a Successful UX Designer, you need to give up on perfectionism, the need to be right, and the fear of user feedback. Embrace iteration and failure as part of the process.',
      date: 'May 25, 2020',
      color: 'bg-[#FB923C]'
    },
    {
      title: 'The Psychology Principles',
      body: 'Every UI/UX Designer Needs to Know about cognitive load, Fitts\'s Law, and the Gestalt principles. These are the foundations of intuitive design.',
      date: 'June 5, 2020',
      color: 'bg-[#D9F99D]'
    },
    {
      title: '10 UI & UX Lessons',
      body: 'Designing My Own Product has taught me that you are not your user, simplicity is hard, and consistent feedback loops are essential for survival.',
      date: 'June 10, 2020',
      color: 'bg-[#C4B5FD]'
    },
    {
      title: 'Grocery List',
      body: 'Milk, Eggs, Bread, Avocado, Coffee Beans, Spinach, Chicken Breast, Hot Sauce.',
      date: 'Today',
      color: 'bg-[#A5F3FC]'
    }
  ]);

  const handleSaveLocal = (newNote: { title: string, body: string, date: string }) => {
    const colors = ['bg-[#FCD34D]', 'bg-[#FB923C]', 'bg-[#D9F99D]', 'bg-[#C4B5FD]', 'bg-[#A5F3FC]'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    setNotes([{ ...newNote, color: randomColor }, ...notes]);
    setView('home');
  };

  const handleOpenLocalNote = (note: any) => {
    setSelectedLocalNote(note);
    setView('local_read');
  };

  const Modal = ({ children }: { children: React.ReactNode }) => (
    <div className="fixed inset-0 bg-black/10 backdrop-blur-[2px] flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 min-h-[400px] flex flex-col">
        {children}
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-white text-[#111111] font-sans flex transition-colors duration-1000">
      <TrafficNoise />
      {/* Sidebar */}
      <aside className="w-24 border-r border-gray-100 flex flex-col items-center py-8 fixed h-full bg-white z-10 left-0 top-0">

        {/* THE GATE: LOGO */}
        <h1
          onPointerDown={handleLogoDown}
          onPointerUp={handleLogoUp}
          onPointerLeave={handleLogoUp}
          className="text-sm font-bold tracking-wide text-gray-800 mb-12 transform -rotate-0 cursor-default select-none"
        >
          <span style={{ color: '#34cf82' }}>&gt;</span>Zero<span style={{ color: '#34cf82' }}>_</span>
        </h1>

        {/* Add Button (Shared but changes Function based on Mode) */}
        <button
          onClick={() => setView('send')}
          className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-lg hover:scale-105 transition-all text-white ${isSecureDashboard ? 'bg-[#111111] ring-2 ring-offset-2 ring-black' : 'bg-black'}`}
          title="Add Note"
        >
          +
        </button>

        {/* Receiver Button (Only in Secure Mode) */}
        {isSecureDashboard && (
          <>
            <button
              onClick={() => setView('read')}
              className="mt-6 w-10 h-10 bg-white border-2 border-black text-black rounded-full flex items-center justify-center text-lg hover:bg-gray-50 transition animate-in zoom-in"
              title="Secure Read"
            >
              ↓
            </button>

            <button
              onClick={() => {
                setIsSecureDashboard(false);
                console.log("DASHBOARD LOCKED");
              }}
              className="mt-auto mb-8 w-10 h-10 text-gray-400 hover:text-red-500 rounded-full flex items-center justify-center transition animate-in fade-in"
              title="Exit Secure Mode"
            >
              ✕
            </button>
          </>
        )}
      </aside>

      {/* Main Content */}
      <section className="flex-1 ml-24 p-12">
        {/* Header */}
        {/* Header */}
        <div className="mb-12">
          <div className="mb-8 w-full">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                className="block w-full pl-14 pr-4 py-4 border-2 border-black rounded-full leading-5 bg-white placeholder-gray-400 text-black focus:outline-none focus:shadow-lg transition duration-150 ease-in-out font-medium text-lg"
                placeholder="search across notes"
              />
            </div>
          </div>

          <h1 className="text-5xl font-bold tracking-tight text-black">
            {isSecureDashboard ? (
              <><span style={{ color: '#34cf82' }}>&gt;</span>Zero<span style={{ color: '#34cf82' }}>_</span></>
            ) : 'Notes'}
          </h1>
        </div>

        {/* Masonry Grid (Always shows local notes to maintain cover) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {notes.map((note, i) => (
            <div
              key={i}
              onClick={() => handleOpenLocalNote(note)}
              className={`${note.color} p-8 rounded-[2rem] h-64 flex flex-col justify-between transition hover:shadow-xl cursor-default text-gray-900`}
            >
              <div>
                <h3 className="text-xl font-bold leading-tight mb-2">{note.title}</h3>
                <p className="text-sm font-medium opacity-80 line-clamp-3">{note.body}</p>
              </div>

              <div className="flex items-center justify-between mt-4">
                <span className="text-xs font-semibold opacity-70">{note.date}</span>
                <div className="w-8 h-8 bg-black/10 rounded-full flex items-center justify-center text-black/50 hover:bg-black/20 transition">
                  <span className="text-xs">✎</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Modals */}
      {view === 'send' && (
        <Modal>
          <NoteModal
            mode={isSecureDashboard ? 'secure' : 'normal'}
            onClose={() => setView('home')}
            onSaveLocal={handleSaveLocal}
          />
        </Modal>
      )}

      {view === 'read' && (
        <Modal>
          <SecureViewer onClose={() => setView('home')} />
        </Modal>
      )}

      {view === 'local_read' && selectedLocalNote && (
        <Modal>
          <ReadLocalModal
            note={selectedLocalNote}
            onClose={() => setView('home')}
          />
        </Modal>
      )}
    </main>
  );
}
