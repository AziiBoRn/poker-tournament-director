import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmLabel?: string;
    isDestructive?: boolean; // Pour mettre le bouton en rouge
}

export const ConfirmModal = ({
                                 isOpen, onClose, onConfirm,
                                 title, message,
                                 confirmLabel = "Confirmer",
                                 isDestructive = false
                             }: ConfirmModalProps) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
            {/* Fond flouté */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
                onClick={onClose} // Ferme si on clique à côté
            ></div>

            {/* Contenu de la modale */}
            <div className="relative bg-gray-800 border border-white/10 rounded-2xl shadow-2xl w-full max-w-md transform transition-all scale-100 p-6">

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="flex flex-col items-center text-center">
                    {isDestructive && (
                        <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mb-4 border border-red-500/20">
                            <AlertTriangle size={24} />
                        </div>
                    )}

                    <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                    <p className="text-gray-400 mb-6 text-sm leading-relaxed">
                        {message}
                    </p>

                    <div className="flex gap-3 w-full">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-xl transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            onClick={() => { onConfirm(); onClose(); }}
                            className={`flex-1 px-4 py-3 font-bold rounded-xl transition-colors shadow-lg ${
                                isDestructive
                                    ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-900/20'
                                    : 'bg-poker-accent hover:bg-orange-600 text-white'
                            }`}
                        >
                            {confirmLabel}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};