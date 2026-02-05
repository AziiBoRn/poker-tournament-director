// src/features/tables/PokerTable.tsx
import { Table } from '../../store/tournamentStore';

interface Props {
  table: Table;
}

export const PokerTable = ({ table }: Props) => {
  // Fonction pour placer les joueurs en cercle
  const getPositionStyle = (index: number, total: number) => {
    const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
    const radiusX = 120;
    const radiusY = 70;
    const centerX = 150;
    const centerY = 100;

    return { 
      left: `${centerX + radiusX * Math.cos(angle)}px`, 
      top: `${centerY + radiusY * Math.sin(angle)}px` 
    };
  };

  return (
    <div className="flex flex-col items-center mb-6">
      <h3 className="text-gray-400 font-bold mb-2">Table {table.id}</h3>
      <div className="relative w-[340px] h-[240px]">
        {/* Tapis Vert */}
        <div className="absolute inset-4 bg-green-800 rounded-[100px] border-[8px] border-gray-800 shadow-inner flex items-center justify-center">
             <span className="text-green-900/50 font-bold text-xl select-none">POKER</span>
        </div>
        {/* Joueurs */}
        {table.players.map((player, index) => (
          <div key={player.id} className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center" style={getPositionStyle(index, 10)}>
            <div className="w-8 h-8 bg-gray-900 rounded-full border border-yellow-500 flex items-center justify-center shadow-lg z-10 text-white text-xs">
              {player.username.charAt(0).toUpperCase()}
            </div>
            <div className="bg-black/80 text-white text-[10px] px-2 py-0.5 rounded-full mt-1 border border-white/10 z-20 whitespace-nowrap">
              {player.username}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};