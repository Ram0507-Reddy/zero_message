'use client';

interface ReadLocalModalProps {
    note: { title: string; body: string; date: string; color: string };
    onClose: () => void;
}

export default function ReadLocalModal({ note, onClose }: ReadLocalModalProps) {
    return (
        <div className="flex flex-col h-full bg-white text-[#111111]">
            {/* Colorful Header */}
            <div className={`px-6 py-8 ${note.color} flex flex-col justify-end`}>
                <div className="flex justify-between items-start mb-4">
                    <span className="bg-black/20 text-white text-xs font-bold px-2 py-1 rounded uppercase tracking-wide">
                        {note.date}
                    </span>
                    <button onClick={onClose} className="bg-white/50 hover:bg-white text-black w-8 h-8 rounded-full flex items-center justify-center transition">
                        ×
                    </button>
                </div>
                <h2 className="text-3xl font-bold leading-tight">{note.title}</h2>
            </div>

            {/* Content Body */}
            <div className="p-8 flex-1 overflow-y-auto bg-white">
                <p className="text-lg leading-relaxed whitespace-pre-wrap text-gray-800">
                    {note.body}
                </p>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
                <button onClick={onClose} className="px-6 py-2 bg-black text-white rounded-full text-sm font-bold shadow-lg hover:scale-105 transition">
                    Close
                </button>
            </div>
        </div>
    );
}
